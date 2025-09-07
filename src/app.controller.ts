import { Controller, Get, Param, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';
import { EthereumService } from './ethereum/ethereum.service';
import { UniswapService } from './uniswap/uniswap.service';

class GetReturnQueryDto {
  @IsEthereumAddress()
  fromTokenAddress!: string;

  @IsEthereumAddress()
  toTokenAddress!: string;

  @IsString()
  amountIn!: string;
}

@ApiTags('API')
@Controller()
export class AppController {
  constructor(
    private readonly ethereumService: EthereumService,
    private readonly uniswapService: UniswapService,
  ) {}

  @Get('gasPrice')
  @ApiOperation({ summary: 'Get current gas price on Ethereum network' })
  @ApiResponse({ status: 200, description: 'Returns the current gas price in gwei' })
  async getGasPrice(): Promise<{ gasPrice: string }> {
    const gasPrice = await this.ethereumService.getGasPrice();
    return { gasPrice };
  }

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  @ApiOperation({ 
    summary: 'Get estimated output amount for a token swap',
    description: 'Calculates the estimated output amount for a token swap using Uniswap V2 pricing formula',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the estimated output amount in wei',
    schema: {
      type: 'object',
      properties: {
        amountOut: { type: 'string', description: 'Estimated output amount in wei' },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Liquidity pool not found for the token pair',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input parameters',
  })
  async getReturn(
    @Param('fromTokenAddress') fromTokenAddress: string,
    @Param('toTokenAddress') toTokenAddress: string,
    @Param('amountIn') amountIn: string,
  ): Promise<{ amountOut: string }> {
    // Validate input parameters
    const query = new GetReturnQueryDto();
    query.fromTokenAddress = fromTokenAddress;
    query.toTokenAddress = toTokenAddress;
    query.amountIn = amountIn;

    // This will throw an error if validation fails
    await new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
      .transform(query, { type: 'param', metatype: GetReturnQueryDto });

    return this.uniswapService.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountIn,
    );
  }
}
