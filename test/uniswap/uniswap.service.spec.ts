import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from 'ethers';
import { EthereumService } from '../../src/ethereum/ethereum.service';
import { UniswapService } from '../../src/uniswap/uniswap.service';

describe('UniswapService', () => {
  let service: UniswapService;
  let ethereumService: jest.Mocked<EthereumService>;

  const mockPair = {
    token0: jest.fn().mockResolvedValue('0xToken0'),
    token1: jest.fn().mockResolvedValue('0xToken1'),
    getReserves: jest.fn().mockResolvedValue({
      reserve0: BigNumber.from('1000000000000000000'), // 1.0 token0
      reserve1: BigNumber.from('2000000000000000000'), // 2.0 token1
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapService,
        {
          provide: EthereumService,
          useValue: {
            getPair: jest.fn().mockResolvedValue(mockPair),
            getReserves: jest.fn().mockResolvedValue({
              reserve0: '1000000000000000000',
              reserve1: '2000000000000000000',
            }),
            getTokenAddresses: jest.fn().mockResolvedValue({
              token0: '0xToken0',
              token1: '0xToken1',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UniswapService>(UniswapService);
    ethereumService = module.get(EthereumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAmountOut', () => {
    it('should calculate output amount correctly', async () => {
      const amountIn = '100000000000000000'; // 0.1 token0
      const expectedAmountOut = '181322178876029097'; // Expected output for 0.1 token0 with 1:2 reserves
      
      const result = await service.getAmountOut(
        '0xFromToken',
        '0xToToken',
        amountIn
      );
      
      expect(result).toBeDefined();
      expect(result.amountOut).toBe(expectedAmountOut);
      expect(ethereumService.getPair).toHaveBeenCalledWith('0xFromToken', '0xToToken');
    });

    it('should handle zero input amount', async () => {
      await expect(
        service.getAmountOut('0xFromToken', '0xToToken', '0')
      ).rejects.toThrow('Input amount must be greater than 0');
    });

    it('should handle token order correctly', async () => {
      // When token order is reversed, the reserves should be swapped
      await service.getAmountOut('0xToken1', '0xToken0', '100000000000000000');
      
      expect(ethereumService.getPair).toHaveBeenCalledWith('0xToken1', '0xToken0');
    });

    it('should throw error for non-existent pair', async () => {
      ethereumService.getPair.mockResolvedValueOnce(null);
      
      await expect(
        service.getAmountOut('0xNonexistent1', '0xNonexistent2', '100000000000000000')
      ).rejects.toThrow('No liquidity pool found for the token pair');
    });
  });

  describe('calculateOutputAmount', () => {
    it('should calculate output amount using Uniswap formula', () => {
      const amountIn = BigNumber.from('100000000000000000'); // 0.1 token0
      const reserveIn = BigNumber.from('1000000000000000000'); // 1.0 token0
      const reserveOut = BigNumber.from('2000000000000000000'); // 2.0 token1
      
      const result = service.calculateOutputAmount(amountIn, reserveIn, reserveOut);
      
      // Expected: (0.1 * 2.0 * 997) / (1.0 * 1000 + 0.1 * 997) ≈ 0.1813
      const expected = '181322178876029097';
      expect(result.toString()).toBe(expected);
    });

    it('should throw error if reserves are 0', () => {
      const amountIn = BigNumber.from('100000000000000000');
      const reserveIn = BigNumber.from('0');
      const reserveOut = BigNumber.from('0');
      
      expect(() => {
        service.calculateOutputAmount(amountIn, reserveIn, reserveOut);
      }).toThrow('Invalid input: amounts and reserves must be positive');
    });
  });
});
