process.env.PRIMARY_KEY = 'id';
process.env.TABLE_NAME = 'test-table';

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../update-one';
const dbMock = mockClient(DynamoDBDocument);

describe('Update Item Lambda', () => {
  beforeEach(() => {
    dbMock.reset();
  });

  it('should update an item successfully', async () => {
    dbMock.on(UpdateCommand).resolves({});

    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
      body: JSON.stringify({
        name: 'updated name',
        description: 'updated description',
      }),
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 204,
      body: '',
    });

    // Verify the correct parameters were passed to DynamoDB
    expect(dbMock.calls()).toHaveLength(1);
    const updateCall = dbMock.calls()[0];
    expect(updateCall.args[0].input).toEqual({
      TableName: 'test-table',
      Key: {
        id: 'test-id-123',
      },
      UpdateExpression: 'set name = :name, description = :description',
      ExpressionAttributeValues: {
        ':name': 'updated name',
        ':description': 'updated description',
      },
      ReturnValues: 'UPDATED_NEW',
    });
  });

  it('should accept object as body', async () => {
    dbMock.on(UpdateCommand).resolves({});

    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
      body: {
        name: 'updated name',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(204);
  });

  it('should return 400 when body is missing', async () => {
    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body',
    });
  });

  it('should return 400 when id is missing', async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({
        name: 'updated name',
      }),
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'invalid request, you are missing the path parameter id',
    });
  });

  it('should return 400 when body is empty', async () => {
    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 400,
      body: 'invalid request, no arguments provided',
    });
  });

  it('should return 500 when using reserved keywords', async () => {
    const mockError = {
      code: 'ValidationException',
      message: 'reserved keyword',
    };

    dbMock.on(UpdateCommand).rejects(mockError);

    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
      body: JSON.stringify({
        timestamp: 'test',
      }),
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 500,
      body: "Error: You're using AWS reserved keywords as attributes",
    });
  });

  it('should return 500 on database error', async () => {
    const mockError = new Error('Database connection failed');
    dbMock.on(UpdateCommand).rejects(mockError);

    const event = {
      pathParameters: {
        id: 'test-id-123',
      },
      body: JSON.stringify({
        name: 'updated name',
      }),
    };

    const response = await handler(event);

    expect(response).toStrictEqual({
      statusCode: 500,
      body: 'Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.',
    });
  });
});
