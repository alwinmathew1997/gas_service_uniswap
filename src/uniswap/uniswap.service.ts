import { Injectable, NotFoundException } from '@nestjs/common';
import { ethers } from 'ethers';
import { EthereumService } from '../ethereum/ethereum.service';

@Injectable()
export class UniswapService {
  private readonly FEE_NUMERATOR = 997; // 0.3% fee
  private readonly FEE_DENOMINATOR = 1000;

  constructor(private readonly ethereumService: EthereumService) {}

  /**
   * Calculate the output amount for a token swap using the Uniswap V2 formula
   * Implements the formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
   * 
   * @param amountIn The input amount of tokens
   * @param reserveIn Reserve of the input token in the pool
   * @param reserveOut Reserve of the output token in the pool
   * @returns The output amount of tokens
   */
  calculateOutputAmount(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
  ): bigint {
    if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) {
      throw new Error('Invalid input: amounts and reserves must be positive');
    }

    const amountInWithFee = amountIn * BigInt(this.FEE_NUMERATOR);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BigInt(this.FEE_DENOMINATOR) + amountInWithFee;
    
    return numerator / denominator;
  }

  /**
   * Get the estimated output amount for a token swap
   * 
   * @param fromTokenAddress The address of the input token
   * @param toTokenAddress The address of the output token
   * @param amountIn The input amount as a string in wei
   * @returns The estimated output amount as a string in wei
   */
  async getAmountOut(
    fromTokenAddress: string,
    toTokenAddress: string,
    amountIn: string,
  ): Promise<{ amountOut: string }> {
    try {
      // Parse the input amount
      const amountInBN = ethers.toBigInt(amountIn);
      
      if (amountInBN <= 0n) {
        throw new Error('Input amount must be greater than 0');
      }

      // Get the pair contract
      const pair = await this.ethereumService.getPair(
        fromTokenAddress,
        toTokenAddress,
      );

      if (!pair) {
        throw new NotFoundException('Liquidity pool not found for the token pair');
      }

      // Get reserves and token addresses
      const [reserves, tokenAddresses] = await Promise.all([
        this.ethereumService.getReserves(pair),
        this.ethereumService.getTokenAddresses(pair),
      ]);

      // Determine if we need to swap the reserves
      const token0 = tokenAddresses.token0.toLowerCase();
      const fromTokenIsToken0 = fromTokenAddress.toLowerCase() === token0;
      
      let reserveIn: bigint;
      let reserveOut: bigint;

      if (fromTokenIsToken0) {
        reserveIn = ethers.toBigInt(reserves.reserve0);
        reserveOut = ethers.toBigInt(reserves.reserve1);
      } else {
        reserveIn = ethers.toBigInt(reserves.reserve1);
        reserveOut = ethers.toBigInt(reserves.reserve0);
      }

      // Calculate the output amount
      const amountOut = this.calculateOutputAmount(
        amountInBN,
        reserveIn,
        reserveOut,
      );

      return { amountOut: amountOut.toString() };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to calculate output amount: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
