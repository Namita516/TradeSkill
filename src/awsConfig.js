import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.REACT_APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

export const db = DynamoDBDocumentClient.from(client);

// Helper functions for database operations
export const putItem = (tableName, item) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return db.send(command);
};

export const getItem = async (tableName, key) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const result = await db.send(command);
  return result.Item || null;
};

export const queryItems = async (tableName, keyConditionExpression, expressionAttributeValues) => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  const result = await db.send(command);
  return result.Items || [];
};

export const scanItems = async (tableName) => {
  const command = new ScanCommand({
    TableName: tableName,
  });
  const result = await db.send(command);
  return result.Items || [];
};
