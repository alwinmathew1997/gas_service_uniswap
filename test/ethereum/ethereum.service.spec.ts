import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { EthereumService } from '../../src/ethereum/ethereum.service';

describe('EthereumService', () => {
  let service: EthereumService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EthereumService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'config.ethereum.rpcUrl') {
                return 'https://mainnet.infura.io/v3/test';
              }
              if (key === 'config.uniswap.v2FactoryAddress') {
                return '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EthereumService>(EthereumService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGasPrice', () => {
    it('should return a gas price', async () => {
      const mockGasPrice = ethers.parseUnits('10', 'gwei');
      jest.spyOn(ethers.providers.JsonRpcProvider.prototype, 'getGasPrice').mockResolvedValueOnce(mockGasPrice);
      
      const result = await service.getGasPrice();
      expect(result).toBeDefined();
      expect(parseFloat(result)).toBeGreaterThan(0);
    });

    it('should use cached value if not expired', async () => {
      const mockGasPrice = ethers.parseUnits('10', 'gwei');
      jest.spyOn(ethers.providers.JsonRpcProvider.prototype, 'getGasPrice').mockResolvedValueOnce(mockGasPrice);
      
      // First call - should call the provider
      const firstCall = await service.getGasPrice();
      
      // Second call - should use cache
      const secondCall = await service.getGasPrice();
      
      expect(firstCall).toBe(secondCall);
      // Should only call getGasPrice once due to caching
      expect(ethers.providers.JsonRpcProvider.prototype.getGasPrice).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPair', () => {
    it('should return a pair contract', async () => {
      const mockPairAddress = '0x0000000000000000000000000000000000000001';
      
      jest.spyOn(ethers.Contract.prototype, 'getPair').mockResolvedValueOnce(mockPairAddress);
      
      const tokenA = '0x0000000000000000000000000000000000000002';
      const tokenB = '0x0000000000000000000000000000000000000003';
      
      const result = await service.getPair(tokenA, tokenB);
      expect(result).toBeDefined();
    });

    it('should return null if pair does not exist', async () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      jest.spyOn(ethers.Contract.prototype, 'getPair').mockResolvedValueOnce(zeroAddress);
      
      const tokenA = '0x0000000000000000000000000000000000000002';
      const tokenB = '0x0000000000000000000000000000000000000003';
      
      const result = await service.getPair(tokenA, tokenB);
      expect(result).toBeNull();
    });
  });
});
