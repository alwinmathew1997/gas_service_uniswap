import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';

/**
 * Default test configuration values
 */
export const DEFAULT_TEST_CONFIG = {
  ethereum: {
    rpcUrl: 'http://localhost:8545',
    network: 'goerli',
    chainId: 5,
  },
  uniswap: {
    v2: {
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
    },
  },
  tokens: {
    weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // WETH on Goerli
    usdc: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C', // USDC on Goerli
    dai: '0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60', // DAI on Goerli
  },
};

/**
 * Creates a test module with the default test configuration
 */
export async function createTestModule(providers: any[] = [], imports: any[] = []) {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => DEFAULT_TEST_CONFIG],
      }),
      ...imports,
    ],
    providers: [
      {
        provide: 'ETHERS_PROVIDER',
        useFactory: (configService: ConfigService) => {
          const rpcUrl = configService.get<string>('ethereum.rpcUrl');
          if (!rpcUrl) {
            throw new Error('ETHEREUM_RPC_URL is not defined in environment variables');
          }
          return new ethers.providers.JsonRpcProvider(rpcUrl);
        },
        inject: [ConfigService],
      },
      ...providers,
    ],
  }).compile();

  return module;
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  ADDRESSES: {
    ZERO: '0x0000000000000000000000000000000000000000',
    DEAD: '0x000000000000000000000000000000000000dEaD',
  },
  HASHES: {
    ZERO: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  NUMBERS: {
    MAX_UINT256: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
  },
};

/**
 * Common test helper functions
 */
export const TestHelpers = {
  /**
   * Wait for a number of blocks to be mined
   */
  async waitBlocks(provider: ethers.providers.Provider, blocks: number): Promise<void> {
    const currentBlock = await provider.getBlockNumber();
    const targetBlock = currentBlock + blocks;
    
    return new Promise((resolve) => {
      const checkBlock = async () => {
        const latestBlock = await provider.getBlockNumber();
        if (latestBlock >= targetBlock) {
          resolve();
        } else {
          setTimeout(checkBlock, 1000);
        }
      };
      checkBlock();
    });
  },
  
  /**
   * Generate a random address
   */
  randomAddress(): string {
    return ethers.Wallet.createRandom().address.toLowerCase();
  },
  
  /**
   * Generate a random amount as a string
   */
  randomAmount(decimals: number = 18): string {
    const amount = Math.floor(Math.random() * 10000);
    return ethers.utils.parseUnits(amount.toString(), decimals).toString();
  },
};
