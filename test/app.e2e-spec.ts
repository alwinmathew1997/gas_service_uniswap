import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { 
  createMockEthereumService, 
  createMockUniswapService 
} from './test-utils/mocks';
import { EthereumService } from '../src/ethereum/ethereum.service';
import { UniswapService } from '../src/uniswap/uniswap.service';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testRequest: request.SuperTest<request.Test>;
  let ethereumService: ReturnType<typeof createMockEthereumService>;
  let uniswapService: ReturnType<typeof createMockUniswapService>;

  beforeAll(async () => {
    const mockEthereumService = createMockEthereumService();
    const mockUniswapService = createMockUniswapService();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EthereumService)
      .useValue(mockEthereumService)
      .overrideProvider(UniswapService)
      .useValue(mockUniswapService)
      .compile();

    app = moduleRef.createNestApplication();
    
    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    httpServer = app.getHttpServer();
    testRequest = request(httpServer);
    
    // Store mocks for test assertions
    ethereumService = mockEthereumService;
    uniswapService = mockUniswapService;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const response = await testRequest.get('/').expect(200);
    expect(response.text).toBe('Uniswap Gas Service is running!');
  });

  describe('GET /gasPrice', () => {
    it('should return current gas price', async () => {
      const response = await testRequest.get('/gasPrice').expect(200);
      const body = response.body as { gasPrice: string };
      expect(body).toHaveProperty('gasPrice');
      expect(typeof body.gasPrice).toBe('string');
    });
  });

  describe('GET /return/:from/:to/:amount', () => {
    const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const amount = '1000000000000000000'; // 1.0 with 18 decimals

    it('should return expected output amount', async () => {
      const response = await testRequest
        .get(`/return/${DAI}/${USDC}/${amount}`)
        .expect(200);
      
      const body = response.body as {
        fromToken: string;
        toToken: string;
        amountIn: string;
        amountOut: string;
      };
      
      expect(body).toHaveProperty('fromToken', DAI);
      expect(body).toHaveProperty('toToken', USDC);
      expect(body).toHaveProperty('amountIn', amount);
      expect(body).toHaveProperty('amountOut');
      expect(typeof body.amountOut).toBe('string');
    });

    it('should return 400 for invalid token address', async () => {
      await testRequest
        .get(`/return/invalid-address/${USDC}/${amount}`)
        .expect(400);
    });

    it('should return 400 for invalid amount', async () => {
      await testRequest
        .get(`/return/${DAI}/${USDC}/invalid-amount`)
        .expect(400);
    });
  });

  describe('GET /api', () => {
    it('should redirect to Swagger UI', async () => {
      const response = await testRequest.get('/api').expect(301);
      expect(response.headers.location).toBe('/api/');
    });

    it('should serve OpenAPI JSON', async () => {
      const response = await testRequest
        .get('/api-json')
        .expect(200)
        .expect('Content-Type', /application\/json/);
      expect(response.body).toBeDefined();
    });
  });
});
