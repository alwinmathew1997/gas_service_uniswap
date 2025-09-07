import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { EthereumModule } from '../ethereum/ethereum.module';

@Module({
  imports: [EthereumModule],
  providers: [UniswapService],
  exports: [UniswapService],
})
export class UniswapModule {}
