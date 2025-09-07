import { BigNumber, BigNumberish } from 'ethers';

/**
 * Mock implementation of a Uniswap V2 Pair contract
 */
export class MockUniswapV2Pair {
  public readonly address: string;
  public token0: string;
  public token1: string;
  public reserve0: BigNumber;
  public reserve1: BigNumber;
  public blockTimestampLast: number;
  public kLast: BigNumber;

  constructor(
    tokenA: string,
    tokenB: string,
    reserveA: BigNumberish = '1000000000000000000', // 1.0 of token A
    reserveB: BigNumberish = '1000000000000000000', // 1.0 of token B
  ) {
    // Sort tokens to ensure consistent ordering
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    this.token0 = token0;
    this.token1 = token1;
    
    // Set reserves based on token order
    this.reserve0 = BigNumber.from(
      tokenA.toLowerCase() === token0.toLowerCase() ? reserveA : reserveB
    );
    this.reserve1 = BigNumber.from(
      tokenA.toLowerCase() === token0.toLowerCase() ? reserveB : reserveA
    );
    
    this.blockTimestampLast = Math.floor(Date.now() / 1000);
    this.kLast = this.reserve0.mul(this.reserve1);
    this.address = this.generatePairAddress(token0, token1);
  }

  /**
   * Generate a deterministic pair address based on token addresses
   */
  private generatePairAddress(tokenA: string, tokenB: string): string {
    // This is a simplified version of the actual CREATE2 address generation
    // In a real implementation, this would use the CREATE2 opcode with the UniswapV2Factory's salt
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() 
      ? [tokenA, tokenB] 
      : [tokenB, tokenA];
    
    const salt = ethers.utils.keccak256(
      ethers.utils.solidityPack(['address', 'address'], [token0, token1])
    );
    
    // This is a simplified version - in reality, this would use CREATE2
    return `0x${salt.substring(0, 40)}`;
  }

  /**
   * Update reserves with new values
   */
  public updateReserves(
    reserve0: BigNumberish,
    reserve1: BigNumberish,
    blockTimestamp: number = Math.floor(Date.now() / 1000)
  ): void {
    this.reserve0 = BigNumber.from(reserve0);
    this.reserve1 = BigNumber.from(reserve1);
    this.blockTimestampLast = blockTimestamp;
    this.kLast = this.reserve0.mul(this.reserve1);
  }

  /**
   * Get the reserves of the pair
   */
  public getReserves(): [BigNumber, BigNumber, number] {
    return [this.reserve0, this.reserve1, this.blockTimestampLast];
  }

  /**
   * Simulate a swap
   * @param amount0In Amount of token0 being sent in
   * @param amount1In Amount of token1 being sent in
   * @returns [amount0Out, amount1Out] - The amounts that would be sent out
   */
  public swap(
    amount0In: BigNumberish = 0,
    amount1In: BigNumberish = 0,
  ): [BigNumber, BigNumber] {
    const amount0InBN = BigNumber.from(amount0In);
    const amount1InBN = BigNumber.from(amount1In);
    
    if (amount0InBN.gt(0) && amount1InBN.gt(0)) {
      throw new Error('UniswapV2: INVALID_INPUT_AMOUNTS');
    }
    
    if (amount0InBN.lte(0) && amount1InBN.lte(0)) {
      throw new Error('UniswapV2: INSUFFICIENT_INPUT_AMOUNT');
    }
    
    const [reserve0, reserve1] = this.getReserves();
    
    let amount0Out = BigNumber.from(0);
    let amount1Out = BigNumber.from(0);
    
    if (amount0InBN.gt(0)) {
      // Selling token0 for token1
      const amountInWithFee = amount0InBN.mul(997); // 0.3% fee
      const numerator = amountInWithFee.mul(reserve1);
      const denominator = reserve0.mul(1000).add(amountInWithFee);
      amount1Out = numerator.div(denominator);
      
      if (amount1Out.gte(reserve1)) {
        throw new Error('UniswapV2: INSUFFICIENT_LIQUIDITY');
      }
      
      this.updateReserves(
        reserve0.add(amount0InBN),
        reserve1.sub(amount1Out)
      );
      
      return [BigNumber.from(0), amount1Out];
    } else {
      // Selling token1 for token0
      const amountInWithFee = amount1InBN.mul(997); // 0.3% fee
      const numerator = amountInWithFee.mul(reserve0);
      const denominator = reserve1.mul(1000).add(amountInWithFee);
      amount0Out = numerator.div(denominator);
      
      if (amount0Out.gte(reserve0)) {
        throw new Error('UniswapV2: INSUFFICIENT_LIQUIDITY');
      }
      
      this.updateReserves(
        reserve0.sub(amount0Out),
        reserve1.add(amount1InBN)
      );
      
      return [amount0Out, BigNumber.from(0)];
    }
  }
  
  /**
   * Get the price of token0 in terms of token1
   */
  public getPrice0(): BigNumber {
    const [reserve0, reserve1] = this.getReserves();
    return reserve1.mul(ethers.utils.parseEther('1')).div(reserve0);
  }
  
  /**
   * Get the price of token1 in terms of token0
   */
  public getPrice1(): BigNumber {
    const [reserve0, reserve1] = this.getReserves();
    return reserve0.mul(ethers.utils.parseEther('1')).div(reserve1);
  }
  
  /**
   * Get the output amount for a given input amount
   * @param amountIn The input amount
   * @param reserveIn The reserve of the input token
   * @param reserveOut The reserve of the output token
   * @returns The output amount
   */
  public static getAmountOut(
    amountIn: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish
  ): BigNumber {
    const amountInBN = BigNumber.from(amountIn);
    const reserveInBN = BigNumber.from(reserveIn);
    const reserveOutBN = BigNumber.from(reserveOut);
    
    if (amountInBN.lte(0)) {
      throw new Error('UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
    }
    
    if (reserveInBN.lte(0) || reserveOutBN.lte(0)) {
      throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    }
    
    const amountInWithFee = amountInBN.mul(997);
    const numerator = amountInWithFee.mul(reserveOutBN);
    const denominator = reserveInBN.mul(1000).add(amountInWithFee);
    
    return numerator.div(denominator);
  }
  
  /**
   * Get the input amount for a given output amount
   * @param amountOut The output amount
   * @param reserveIn The reserve of the input token
   * @param reserveOut The reserve of the output token
   * @returns The input amount
   */
  public static getAmountIn(
    amountOut: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish
  ): BigNumber {
    const amountOutBN = BigNumber.from(amountOut);
    const reserveInBN = BigNumber.from(reserveIn);
    const reserveOutBN = BigNumber.from(reserveOut);
    
    if (amountOutBN.lte(0)) {
      throw new Error('UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
    }
    
    if (reserveInBN.lte(0) || reserveOutBN.lte(0)) {
      throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    }
    
    const numerator = reserveInBN.mul(amountOutBN).mul(1000);
    const denominator = reserveOutBN.sub(amountOutBN).mul(997);
    
    return numerator.div(denominator).add(1);
  }
}

// Add the mock to the ethers namespace for easier access in tests
declare module 'ethers' {
  namespace utils {
    export class MockUniswapV2Pair extends MockUniswapV2Pair {}
  }
}

// @ts-ignore
ethers.utils.MockUniswapV2Pair = MockUniswapV2Pair;
