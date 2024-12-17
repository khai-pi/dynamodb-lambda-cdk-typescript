import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../get-one';

const dbMock = mockClient(DynamoDBDocument);

beforeEach(() => {
  dbMock.reset();
});

it('should return one item from dynamoDb', async () => {
  const mockItem = { id: 'item1', name: 'noodle' };

  dbMock.on(GetCommand).resolves({
    Item: mockItem,
  });

  const event = {
    pathParameters: {
      id: 'item1',
    },
  };

  const response = await handler(event);

  expect(response).toStrictEqual({
    statusCode: 200,
    body: JSON.stringify(mockItem),
  });
});

it('should return 400 when id is missing', async () => {
  const event = {
    pathParameters: {},
  };

  const response = await handler(event);

  expect(response).toStrictEqual({
    statusCode: 400,
    body: 'Error: You are missing the path parameter id',
  });
});

it('should return 404 when item is not found', async () => {
  dbMock.on(GetCommand).resolves({
    Item: undefined,
  });

  const event = {
    pathParameters: {
      id: 'nonexistent',
    },
  };

  const response = await handler(event);

  expect(response).toStrictEqual({
    statusCode: 404,
  });
});

it('should return 500 on database error', async () => {
  const dbError = new Error('Database connection failed');
  dbMock.on(GetCommand).rejects(dbError);

  const event = {
    pathParameters: {
      id: 'item1',
    },
  };

  const response = await handler(event);

  expect(response).toStrictEqual({
    statusCode: 500,
    body: JSON.stringify(dbError),
  });
});
