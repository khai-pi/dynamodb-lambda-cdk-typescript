// Set environment variables before imports
process.env.PRIMARY_KEY = 'id';
process.env.TABLE_NAME = 'test-table';

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../lambdas/delete-one";

const dbMock = mockClient(DynamoDBDocument);

describe('Delete Item Lambda', () => {
  beforeEach(() => {
    dbMock.reset();
  });

  it("should delete an item successfully", async () => {
    dbMock.on(DeleteCommand).resolves({});

    const event = {
      pathParameters: {
        id: 'test-id-123'
      }
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 200,
      body: ''
    });

    // Verify the correct parameters were passed to DynamoDB
    expect(dbMock.calls()).toHaveLength(1);
    const deleteCall = dbMock.calls()[0];
    expect(deleteCall.args[0].input).toEqual({
      TableName: 'test-table',
      Key: {
        id: 'test-id-123'
      }
    });
  });

  it("should return 400 when id parameter is missing", async () => {
    const event = {
      pathParameters: {}
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'Error: You are missing the path parameter id'
    });
  });

  it("should return 500 on database error", async () => {
    const mockError = new Error('Database connection failed');
    dbMock.on(DeleteCommand).rejects(mockError);

    const event = {
      pathParameters: {
        id: 'test-id-123'
      }
    };

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 500,
      body: JSON.stringify(mockError)
    });
  });

  it("should return 400 when pathParameters is missing", async () => {
    const event = {};

    const response = await handler(event);
    
    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'Error: You are missing the path parameter id'
    });
  });
});