<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


  <p align="center"> 
  Nest.js application that allows an arbitrary client to get information from two endpoints:
<p align="center"> 
• /gasPrice
<br/>
• /return/:fromTokenAddress/:toTokenAddress/:amountIn
</p > 
  </p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
   



## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```



### Get Gas Price

```
GET /gasPrice
```

**Response**
```json
{
  "gasPrice": "12.5"
}
```

### Get Swap Return Amount

```
GET /return/:fromTokenAddress/:toTokenAddress/:amountIn
```

**Parameters**
- `fromTokenAddress`: Address of the token to swap from
- `toTokenAddress`: Address of the token to swap to
- `amountIn`: Amount of input token in wei

**Example Request**
```
GET /return/0x6B175474E89094C44Da98b954EedeAC495271d0F/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1000000000000000000
```

**Response**
```json
{
  "amountOut": "998999999999999999"
}
```

## Testing

Run unit tests:
```bash
npm test
```

Run e2e tests:
```bash
npm run test:e2e
```

## Technologies Used

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [Ethers.js](https://docs.ethers.org/) - Ethereum wallet implementation and utilities
- [Swagger](https://swagger.io/) - API documentation
- [Jest](https://jestjs.io/) - Testing framework

