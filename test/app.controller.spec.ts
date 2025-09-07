import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { EthereumService } from '../src/ethereum/ethereum.service';
import { UniswapService } from '../src/uniswap/uniswap.service';
import { BigNumber } from 'ethers';

describe('AppController', () => {
  let appController: AppController;
  let ethereumService: jest.Mocked<EthereumService>;
  let uniswapService: jest.Mocked<UniswapService>;

  beforeEach(async () => {
    const mockEthereumService = {
      getGasPrice: jest.fn().mockResolvedValue('20000000000'), // 20 Gwei
    };

    const mockUniswapService = {
      getAmountOut: jest.fn().mockResolvedValue('1980000000000000000'), // 1.98 tokens out
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: EthereumService,
          useValue: mockEthereumService,
        },
        {
          provide: UniswapService,
          useValue: mockUniswapService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    ethereumService = app.get(EthereumService);
    uniswapService = app.get(UniswapService);
  });

  describe('root', () => {
    it('should return "Uniswap Gas Service is running!"', () => {
      expect(appController.getHello()).toBe('Uniswap Gas Service is running!');
    });
  });

  describe('getGasPrice', () => {
    it('should return current gas price', async () => {
      const result = await appController.getGasPrice();
      expect(result).toEqual({ gasPrice: '20000000000' });
      expect(ethereumService.getGasPrice).toHaveBeenCalled();
    });
  });

  describe('getReturnAmount', () => {
    it('should return the expected output amount', async () => {
      const fromToken = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI
      const toToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
      const amountIn = '1000000000000000000'; // 1.0 DAI
      
      const result = await appController.getReturnAmount(fromToken, toToken, amountIn);
      
      expect(result).toEqual({
        fromToken,
        toToken,
        amountIn,
        amountOut: '1980000000000000000',
      });
      
      expect(uniswapService.getAmountOut).toHaveBeenCalledWith(
        fromToken,
        toToken,
        amountIn
      );
    });

    it('should handle zero amount input', async () => {
      const fromToken = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      const toToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const amountIn = '0';
      
      uniswapService.getAmountOut.mockResolvedValueOnce('0');
      
      const result = await appController.getReturnAmount(fromToken, toToken, amountIn);
      
      expect(result).toEqual({
        fromToken,
        toToken,
        amountIn: '0',
        amountOut: '0',
      });
    });

    it('should throw an error for invalid token address', async () => {
      const invalidToken = '0xinvalid';
      const validToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      await expect(
        appController.getReturnAmount(invalidToken, validToken, '1000000000000000000')
      ).rejects.toThrow();
      
      await expect(
        appController.getReturnAmount(validToken, invalidToken, '1000000000000000000')
      ).rejects.toThrow();
    });
  });
});
