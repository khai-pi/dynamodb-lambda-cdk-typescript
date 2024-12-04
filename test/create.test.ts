import { handler } from '../lambdas/create';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Mock the UUID generation to have consistent values in tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

// Mock the DynamoDB Document Client
const mockPut = jest.fn();
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocument: {
    from: jest.fn(() => ({
      put: mockPut
    }))
  }
}));

describe('DynamoDB Lambda Handler', () => {
  let mockDynamoDb: jest.Mock;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // // Get reference to the mocked put function
    // mockDynamoDb = DynamoDBDocument.from(new DynamoDB()).put as jest.Mock;
    // Set environment variables
    process.env.TABLE_NAME = 'TestTable';
    process.env.PRIMARY_KEY = 'id';
  });

  test('should return 400 when no body is provided', async () => {
    const event = {};
    
    const result = await handler(event);
    
    expect(result).toEqual({
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body'
    });
  });

  test('should successfully create item with string body', async () => {
    const event = {
      body: JSON.stringify({ name: 'test item' })
    };

    mockPut.mockResolvedValue({});

    // mockDynamoDb.mockResolvedValue({});
    
    const result = await handler(event);
    
    expect(mockPut).toHaveBeenCalledWith({
      TableName: 'TestTable',
      Item: {
        id: 'mock-uuid',
        name: 'test item'
      }
    });
    
    expect(result).toEqual({
      statusCode: 201,
      body: ''
    });
  });

  test('should successfully create item with object body', async () => {
    const event = {
      body: { name: 'test item' }
    };

    mockDynamoDb.mockResolvedValue({});
    
    const result = await handler(event);
    
    expect(mockDynamoDb).toHaveBeenCalledWith({
      TableName: 'TestTable',
      Item: {
        id: 'mock-uuid',
        name: 'test item'
      }
    });
    
    expect(result).toEqual({
      statusCode: 201,
      body: ''
    });
  });

  test('should return 500 when using reserved keywords', async () => {
    const event = {
      body: { name: 'test item' }
    };

    mockDynamoDb.mockRejectedValue({
      code: 'ValidationException',
      message: 'reserved keyword'
    });
    
    const result = await handler(event);
    
    expect(result).toEqual({
      statusCode: 500,
      body: 'Error: You\'re using AWS reserved keywords as attributes'
    });
  });

  test('should return 500 on general DynamoDB error', async () => {
    const event = {
      body: { name: 'test item' }
    };

    mockDynamoDb.mockRejectedValue({
      code: 'InternalServerError',
      message: 'Something went wrong'
    });
    
    const result = await handler(event);
    
    expect(result).toEqual({
      statusCode: 500,
      body: 'Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.'
    });
  });
});