/*
 One-time migration script: copy `reputation` -> `ratingAverage`, `swaps` -> `ratingCount` for Users table.
 Usage: node scripts/migrate_ratings.js
 Requires local AWS credentials env (same as your app).
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function migrate() {
  console.log('Starting migration: Users.reputation -> ratingAverage, Users.swaps -> ratingCount');
  let ExclusiveStartKey = undefined;
  let total = 0;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: 'Users', ExclusiveStartKey }));
    const items = res.Items || [];
    for (const it of items) {
      const updated = {
        ...it,
        ratingAverage: it.ratingAverage ?? it.reputation ?? 0,
        ratingCount: it.ratingCount ?? it.swaps ?? 0,
        // keep legacy fields
        reputation: it.reputation ?? 0,
        swaps: it.swaps ?? 0
      };
      await ddb.send(new PutCommand({ TableName: 'Users', Item: updated }));
      total++;
      if (total % 50 === 0) console.log(`Migrated ${total} users...`);
    }
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  console.log(`Migration complete. Total users migrated: ${total}`);
}

migrate().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
