import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as sdk from 'node-appwrite';

for (const line of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const tablesDB = new sdk.TablesDB(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'soc_demo';
const tableIds = ['WORKSPACES', 'ALERTS', 'INCIDENTS', 'NOTES', 'NOTIFICATIONS', 'AUDIT_LOGS']
  .map((name) => process.env[`VITE_APPWRITE_${name}_TABLE_ID`])
  .filter(Boolean);

await tablesDB.get({ databaseId });
for (const tableId of tableIds) await tablesDB.getTable({ databaseId, tableId });
console.log(`✓ Appwrite schema is reachable: ${databaseId} (${tableIds.length} tables checked)`);
