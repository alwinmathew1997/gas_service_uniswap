import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, ZeroAddress, formatUnits, ethers } from 'ethers';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';

type TokenPair = {
  token0: string;
  token1: string;
};

@Injectable()
export class EthereumService implements OnModuleInit {
  private provider: JsonRpcProvider;
  private factory: Contract;
  private gasPriceCache: {
    price: string;
    timestamp: number;
  } | null = null;
  private readonly GAS_PRICE_CACHE_TTL = 10000; // 10 seconds

  constructor(private configService: ConfigService) {
    this.provider = new JsonRpcProvider(
      this.configService.get<string>('config.ethereum.rpcUrl') as string,
    );

    const factoryAddress = this.configService.get<string>('config.uniswap.v2FactoryAddress');
    if (!factoryAddress) {
      throw new Error('Uniswap V2 factory address is not configured');
    }
    this.factory = new Contract(
      factoryAddress,
      IUniswapV2Factory.abi,
      this.provider,
    );
  }

  async onModuleInit() {
    // Initialize with current gas price
    await this.getGasPrice();
  }

  /**
   * Get current gas price from the network
   * Implements caching to ensure fast response times
   */
  async getGasPrice(): Promise<string> {
    const now = Date.now();
    
    // Return cached price if it's still valid
    if (
      this.gasPriceCache &&
      now - this.gasPriceCache.timestamp < this.GAS_PRICE_CACHE_TTL
    ) {
      return this.gasPriceCache.price;
    }

    // Fetch fresh gas price
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
      if (!gasPrice) {
        throw new Error('Gas price not available from provider');
      }
      const gasPriceInGwei = formatUnits(gasPrice, 'gwei');
      
      // Update cache
      this.gasPriceCache = {
        price: gasPriceInGwei,
        timestamp: now,
      };
      
      return gasPriceInGwei;
    } catch (error: unknown) {
      // If there's an error but we have a cached value, return it
      if (this.gasPriceCache) {
        return this.gasPriceCache.price;
      }
      throw new Error(`Failed to fetch gas price: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pair contract for two tokens
   */
  async getPair(tokenA: string, tokenB: string): Promise<Contract | null> {
    try {
      const [token0, token1] = tokenA < tokenB 
        ? [tokenA, tokenB] 
        : [tokenB, tokenA];
      
      const pairAddress = await this.factory.getPair(token0, token1);
      
      if (pairAddress === ZeroAddress) {
        return null;
      }
      
      return new Contract(pairAddress, IUniswapV2Pair.abi, this.provider);
    } catch (error: unknown) {
      throw new Error(`Failed to get pair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get reserves for a token pair
   */
  async getReserves(pair: Contract): Promise<{
    reserve0: string;
    reserve1: string;
  }> {
    try {
      const { reserve0, reserve1 } = await pair.getReserves();
      return {
        reserve0: reserve0.toString(),
        reserve1: reserve1.toString(),
      };
    } catch (error: unknown) {
      throw new Error(`Failed to get reserves: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get token addresses from a pair
   */
  async getTokenAddresses(pair: Contract): Promise<TokenPair> {
    try {
      const [token0, token1] = await Promise.all([
        pair.token0(),
        pair.token1(),
      ]);
      return { token0, token1 };
    } catch (error: unknown) {
      throw new Error(`Failed to get token addresses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
