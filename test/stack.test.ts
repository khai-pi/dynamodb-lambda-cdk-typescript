import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DynamodbLambdaCdkTypescriptStack } from '../lib/dynamodb-lambda-cdk-typescript-stack';

// Mock NodejsFunction to avoid actual bundling during tests
// Allow testing of infrastructure properties
// Prevent esbuild bundling error in CI
jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => ({
  NodejsFunction: jest.fn().mockImplementation((scope, id, props) => {
    const lambda = require('aws-cdk-lib/aws-lambda');
    return new lambda.Function(scope, id, {
      ...props,
      runtime: props.runtime,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = function() { }'),
    });
  }),
  NodejsFunctionProps: jest.fn(),
}));

describe('DynamodbLambdaCdkTypescriptStack Test', () => {
  let app: cdk.App;
  let stack: DynamodbLambdaCdkTypescriptStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DynamodbLambdaCdkTypescriptStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('DynamoDB Table Created', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'items',
      KeySchema: [
        {
          AttributeName: 'itemId',
          KeyType: 'HASH'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'itemId',
          AttributeType: 'S'
        }
      ]
    });
  });

  test('Lambda Functions Created', () => {
    // Test all five Lambda functions are created
    template.resourceCountIs('AWS::Lambda::Function', 5);

    // Test specific Lambda function properties
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Environment: {
        Variables: {
          PRIMARY_KEY: 'itemId',
          TABLE_NAME: Match.anyValue() // Allow any value since it's a CloudFormation reference
        }
      }
    });
  });

  test('API Gateway Created', () => {
    // Test API Gateway REST API is created
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Items Service'
    });

    // Test API Gateway Methods
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      AuthorizationType: 'NONE'
    });

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      AuthorizationType: 'NONE'
    });

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
      AuthorizationType: 'NONE'
    });
  });

  test('Lambda Functions Have DynamoDB Permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem'
            ]),
            Resource: Match.anyValue()
          })
        ])
      }
    });
  });
});