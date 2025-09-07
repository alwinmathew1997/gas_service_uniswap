import { BigNumber, providers } from 'ethers';

/**
 * Creates a mock Ethereum provider with the given block number and gas price
 */
export function createMockEthereumProvider(
  blockNumber: number = 1,
  gasPrice: BigNumber = BigNumber.from('20000000000'), // 20 Gwei
) {
  return {
    getBlockNumber: jest.fn().mockResolvedValue(blockNumber),
    getGasPrice: jest.fn().mockResolvedValue(gasPrice),
    getCode: jest.fn().mockResolvedValue('0x'),
    getStorageAt: jest.fn().mockResolvedValue('0x'),
    getBalance: jest.fn().mockResolvedValue(BigNumber.from('1000000000000000000')), // 1 ETH
    getTransactionCount: jest.fn().mockResolvedValue(0),
    getBlock: jest.fn().mockResolvedValue({
      number: blockNumber,
      hash: '0x123',
      parentHash: '0x456',
      timestamp: Math.floor(Date.now() / 1000),
      nonce: '0x0',
      difficulty: 1,
      gasLimit: BigNumber.from('10000000'),
      gasUsed: BigNumber.from('0'),
      miner: '0x0000000000000000000000000000000000000000',
      extraData: '0x',
      transactions: [],
    }),
    call: jest.fn().mockResolvedValue('0x'),
    sendTransaction: jest.fn().mockResolvedValue({
      hash: '0x123',
      wait: jest.fn().mockResolvedValue({
        status: 1,
        logs: [],
      }),
    }),
    estimateGas: jest.fn().mockResolvedValue(BigNumber.from('21000')),
    getLogs: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    removeListener: jest.fn(),
    _isProvider: true,
  } as unknown as providers.JsonRpcProvider;
}

/**
 * Creates a mock contract with the given ABI and return values
 */
export function createMockContract(abi: any[], returnValues: Record<string, any> = {}) {
  const mockContract: any = {
    // Default implementations that can be overridden
    ...returnValues,
    
    // Default implementations
    address: '0x' + '0'.repeat(40),
    interface: {
      getFunction: jest.fn().mockImplementation((name: string) => ({
        name,
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      })),
    },
    
    // Helper to set up method mocks
    setMethod: function(method: string, value: any, once = false) {
      if (once) {
        this[method].mockImplementationOnce(() => Promise.resolve(value));
      } else {
        this[method].mockImplementation(() => Promise.resolve(value));
      }
      return this;
    },
    
    // Mock callStatic methods
    callStatic: {},
    
    // Mock estimateGas methods
    estimateGas: {},
    
    // Mock populateTransaction methods
    populateTransaction: {},
    
    // Mock filters
    filters: {},
  };
  
  // Set up method mocks for all functions in the ABI
  abi
    .filter(item => item.type === 'function')
    .forEach((func) => {
      const methodName = func.name;
      const isView = func.stateMutability === 'view' || func.constant;
      
      // Main function mock
      mockContract[methodName] = jest.fn().mockImplementation((...args: any[]) => {
        // If there's a specific return value for this method, use it
        if (returnValues[methodName] !== undefined) {
          return Promise.resolve(returnValues[methodName]);
        }
        
        // Default return value based on function type
        if (isView) {
          return Promise.resolve('0x');
        }
        
        // For non-view functions, return a transaction receipt
        return Promise.resolve({
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          wait: jest.fn().mockResolvedValue({
            status: 1,
            logs: [],
          }),
        });
      });
      
      // Set up callStatic mock
      mockContract.callStatic[methodName] = jest.fn().mockResolvedValue('0x');
      
      // Set up estimateGas mock
      mockContract.estimateGas[methodName] = jest.fn().mockResolvedValue(BigNumber.from('100000'));
      
      // Set up populateTransaction mock
      mockContract.populateTransaction[methodName] = jest.fn().mockResolvedValue({
        to: mockContract.address,
        data: '0x',
      });
      
      // Set up filter mock
      mockContract.filters[methodName] = jest.fn().mockReturnValue({
        fromBlock: 0,
        toBlock: 'latest',
        address: mockContract.address,
        topics: [],
      });
    });
  
  return mockContract;
}
