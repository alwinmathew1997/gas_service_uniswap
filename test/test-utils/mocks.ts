import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import { EthereumService } from '../../src/ethereum/ethereum.service';
import { UniswapService } from '../../src/uniswap/uniswap.service';

// Mock the entire ethers module
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getGasPrice: jest.fn().mockResolvedValue('1000000000'),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    })),
  },
}));

export const createTestingModule = async (providers: Provider[] = []) => {
  return await Test.createTestingModule({
    imports: [],
    providers: [
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            const config = {
              'ETHEREUM_RPC_URL': 'http://localhost:8545',
              'UNISWAP_V2_FACTORY_ADDRESS': '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
              'UNISWAP_V2_ROUTER_ADDRESS': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            };
            return config[key];
          }),
        },
      },
      ...providers,
    ],
  }).compile();
};

export const createMockEthereumService = () => ({
  getGasPrice: jest.fn().mockResolvedValue('1000000000'),
});

export const createMockUniswapService = () => ({
  getExpectedReturn: jest.fn().mockResolvedValue({
    fromToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amountIn: '1000000000000000000',
    amountOut: '999000000000',
  }),
});

// Mock the AppModule to avoid circular dependencies
jest.mock('../../src/app.module', () => ({
  __esModule: true,
  default: class {},
}));
