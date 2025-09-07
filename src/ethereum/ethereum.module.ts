import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JsonRpcProvider } from 'ethers';
import { EthereumService } from './ethereum.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'ETHERS_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const rpcUrl = configService.get<string>('config.ethereum.rpcUrl');
        if (!rpcUrl) {
          throw new Error('ETHEREUM_RPC_URL is not defined in environment variables');
        }
        return new JsonRpcProvider(rpcUrl);
      },
      inject: [ConfigService],
    },
    EthereumService,
  ],
  exports: [EthereumService],
})
export class EthereumModule {}
