import { BigNumber, BigNumberish, ethers } from 'ethers';
import { MockUniswapV2Pair } from './uniswap-v2-pair.mock';

/**
 * Mock implementation of a Uniswap V2 Factory contract
 */
export class MockUniswapV2Factory {
  public readonly address: string;
  public feeTo: string;
  public feeToSetter: string;
  public allPairs: string[];
  public pairs: { [key: string]: string };
  public pairContracts: { [key: string]: MockUniswapV2Pair };
  
  constructor(feeToSetter: string) {
    this.address = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'; // Same as mainnet for consistency
    this.feeTo = ethers.ZeroAddress;
    this.feeToSetter = feeToSetter || ethers.Wallet.createRandom().address;
    this.allPairs = [];
    this.pairs = {};
    this.pairContracts = {};
  }
  
  /**
   * Create a new pair between two tokens
   */
  public createPair(
    tokenA: string,
    tokenB: string,
    reserveA: BigNumberish = '1000000000000000000', // 1.0 of token A
    reserveB: BigNumberish = '1000000000000000000'  // 1.0 of token B
  ): string {
    // Sort tokens to ensure consistent ordering
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    const pairKey = `${token0}-${token1}`;
    
    if (pairKey in this.pairs) {
      throw new Error('UniswapV2: PAIR_EXISTS');
    }
    
    // Create a new pair contract
    const pair = new MockUniswapV2Pair(tokenA, tokenB, reserveA, reserveB);
    
    // Store the pair
    this.pairs[pairKey] = pair.address;
    this.pairs[`${tokenA}-${tokenB}`] = pair.address;
    this.pairs[`${tokenB}-${tokenA}`] = pair.address;
    this.allPairs.push(pair.address);
    this.pairContracts[pair.address.toLowerCase()] = pair;
    
    return pair.address;
  }
  
  /**
   * Get the pair address for two tokens
   */
  public getPair(tokenA: string, tokenB: string): string {
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    return this.pairs[`${token0}-${token1}`] || ethers.ZeroAddress;
  }
  
  /**
   * Get the pair contract for two tokens
   */
  public getPairContract(tokenA: string, tokenB: string): MockUniswapV2Pair | null {
    const pairAddress = this.getPair(tokenA, tokenB);
    return pairAddress !== ethers.ZeroAddress 
      ? this.pairContracts[pairAddress.toLowerCase()] 
      : null;
  }
  
  /**
   * Get all pairs created by the factory
   */
  public getAllPairs(): string[] {
    return [...this.allPairs];
  }
  
  /**
   * Get the total number of pairs
   */
  public allPairsLength(): number {
    return this.allPairs.length;
  }
  
  /**
   * Set the feeTo address
   */
  public setFeeTo(feeTo: string): void {
    if (ethers.getAddress(feeTo) === ethers.ZeroAddress) {
      throw new Error('UniswapV2: ZERO_ADDRESS');
    }
    this.feeTo = feeTo;
  }
  
  /**
   * Set the feeToSetter address
   */
  public setFeeToSetter(feeToSetter: string): void {
    if (ethers.getAddress(feeToSetter) === ethers.ZeroAddress) {
      throw new Error('UniswapV2: ZERO_ADDRESS');
    }
    this.feeToSetter = feeToSetter;
  }
}

// Add the mock to the ethers namespace for easier access in tests
declare module 'ethers' {
  namespace utils {
    export class MockUniswapV2Factory extends MockUniswapV2Factory {}
  }
}

// @ts-ignore
ethers.utils.MockUniswapV2Factory = MockUniswapV2Factory;
