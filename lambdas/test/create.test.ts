const mockPrimaryKey = 'id';
process.env.PRIMARY_KEY = mockPrimaryKey;
process.env.TABLE_NAME = 'test-table';

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../create";
import { v4 as uuidv4 } from 'uuid';

// Mock uuid to have consistent test values
jest.mock('uuid');
const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
(uuidv4 as jest.Mock).mockReturnValue(mockUuid);

const dbMock = mockClient(DynamoDBDocument);

describe('Create Item Lambda', () => {
  beforeEach(() => {
    dbMock.reset();
  });

  it("should create an item successfully", async () => {
    const mockItem = { name: 'test item', description: 'test description' };
    
    dbMock.on(PutCommand).resolves({});

    const event = {
      body: JSON.stringify(mockItem)
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 201,
      body: ''
    });

    // Verify the correct parameters were passed to DynamoDB
    expect(dbMock.calls()).toHaveLength(1);
    const putCall = dbMock.calls()[0];
    expect(putCall.args[0].input).toEqual({
      TableName: expect.any(String),
      Item: {
        ...mockItem,
        [mockPrimaryKey]: mockUuid
      }
    });
  });

  it("should accept object as body", async () => {
    const mockItem = { name: 'test item' };
    
    dbMock.on(PutCommand).resolves({});

    const event = {
      body: mockItem  // Note: not stringified
    };

    const response = await handler(event);
    
    expect(response.statusCode).toBe(201);
  });

  it("should return 400 when body is missing", async () => {
    const event = {};

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body'
    });
  });

  it("should return 500 when using reserved keywords", async () => {
    const mockError = {
      code: 'ValidationException',
      message: 'reserved keyword'
    };
    
    dbMock.on(PutCommand).rejects(mockError);

    const event = {
      body: JSON.stringify({ timestamp: 'test' })  // 'timestamp' is a reserved word
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 500,
      body: 'Error: You\'re using AWS reserved keywords as attributes'
    });
  });

  it("should return 500 on general database error", async () => {
    const mockError = new Error('Database connection failed');
    dbMock.on(PutCommand).rejects(mockError);

    const event = {
      body: JSON.stringify({ name: 'test item' })
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 500,
      body: 'Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.'
    });
  });
});