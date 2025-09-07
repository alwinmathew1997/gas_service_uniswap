import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL,
  },
  uniswap: {
    v2FactoryAddress: process.env.UNISWAP_V2_FACTORY_ADDRESS || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  },
  app: {
    port: Number.parseInt(process.env.PORT ?? '', 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
}));
