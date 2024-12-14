process.env.TABLE_NAME = 'test-table';

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../lambdas/get-all";

const dbMock = mockClient(DynamoDBDocument);

describe('Get All Items Lambda', () => {
  beforeEach(() => {
    dbMock.reset();
  });

  it("should get all items successfully", async () => {
    const mockItems = [
      { id: '1', name: 'item 1' },
      { id: '2', name: 'item 2' },
      { id: '3', name: 'item 3' }
    ];

    dbMock.on(ScanCommand).resolves({
      Items: mockItems
    });

    const response = await handler();
    
    expect(response).toStrictEqual({
      statusCode: 200,
      body: JSON.stringify(mockItems)
    });

    // Verify the correct parameters were passed to DynamoDB
    expect(dbMock.calls()).toHaveLength(1);
    const scanCall = dbMock.calls()[0];
    expect(scanCall.args[0].input).toEqual({
      TableName: 'test-table'
    });
  });

  it("should return empty array when no items exist", async () => {
    dbMock.on(ScanCommand).resolves({
      Items: []
    });

    const response = await handler();
    
    expect(response).toStrictEqual({
      statusCode: 200,
      body: JSON.stringify([])
    });
  });

  it("should return 500 on database error", async () => {
    const mockError = new Error('Database connection failed');
    dbMock.on(ScanCommand).rejects(mockError);

    const response = await handler();
    
    expect(response).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify(mockError)
    });
  });
});