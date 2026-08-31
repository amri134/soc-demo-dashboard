import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as sdk from 'node-appwrite';

loadEnvFile(path.resolve('.env'));

const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required .env values: ${missing.join(', ')}`);
}

const ids = {
  database: process.env.VITE_APPWRITE_DATABASE_ID || 'soc_demo',
  workspaces: process.env.VITE_APPWRITE_WORKSPACES_TABLE_ID || 'demo_workspaces',
  alerts: process.env.VITE_APPWRITE_ALERTS_TABLE_ID || 'demo_alerts',
  incidents: process.env.VITE_APPWRITE_INCIDENTS_TABLE_ID || 'incidents',
  notes: process.env.VITE_APPWRITE_NOTES_TABLE_ID || 'incident_notes',
  notifications: process.env.VITE_APPWRITE_NOTIFICATIONS_TABLE_ID || 'demo_notifications',
  auditLogs: process.env.VITE_APPWRITE_AUDIT_LOGS_TABLE_ID || 'audit_logs',
  evidence: process.env.VITE_APPWRITE_EVIDENCE_BUCKET_ID || 'demo_evidence'
};

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new sdk.TablesDB(client);
const storage = new sdk.Storage(client);

const schema = [
  {
    id: ids.workspaces,
    name: 'Demo workspaces',
    columns: [
      string('ownerId', 36, true),
      enumColumn('status', ['active', 'expired'], false, 'active'),
      datetime('expiresAt', true),
      datetime('createdAt', true)
    ]
  },
  {
    id: ids.alerts,
    name: 'Demo alerts',
    columns: [
      string('workspaceId', 36, true),
      enumColumn('severity', ['low', 'medium', 'high', 'critical'], true),
      string('title', 255, true),
      text('description', false),
      string('sourceIp', 45, false),
      enumColumn('status', ['new', 'triaged', 'dismissed'], false, 'new'),
      datetime('simulatedAt', true)
    ]
  },
  {
    id: ids.incidents,
    name: 'Incidents',
    columns: [
      string('workspaceId', 36, true),
      string('alertId', 36, false),
      enumColumn('status', ['new', 'investigating', 'resolved'], false, 'new'),
      enumColumn('priority', ['low', 'medium', 'high', 'critical'], false, 'medium'),
      string('summary', 255, true),
      text('resolution', false),
      datetime('createdAt', true),
      datetime('updatedAt', true)
    ]
  },
  {
    id: ids.notes,
    name: 'Incident notes',
    columns: [
      string('workspaceId', 36, true),
      string('incidentId', 36, true),
      string('authorId', 36, true),
      text('body', true),
      datetime('createdAt', true)
    ]
  },
  {
    id: ids.notifications,
    name: 'Demo notifications',
    columns: [
      string('workspaceId', 36, true),
      enumColumn('channel', ['telegram_simulation', 'in_app'], false, 'telegram_simulation'),
      text('message', true),
      boolean('isRead', false, false),
      datetime('createdAt', true)
    ]
  },
  {
    id: ids.auditLogs,
    name: 'Audit logs',
    columns: [
      string('workspaceId', 36, true),
      string('actorId', 36, true),
      string('action', 100, true),
      text('metadata', false),
      datetime('createdAt', true)
    ]
  }
];

await ensureDatabase();
for (const table of schema) await ensureTable(table);
await ensureEvidenceBucket();

console.log('\nAppwrite demo schema is ready. No public table or bucket permission was created.');

async function ensureDatabase() {
  try {
    await tablesDB.get({ databaseId: ids.database });
    console.log(`✓ Database already exists: ${ids.database}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await tablesDB.create({ databaseId: ids.database, name: 'SOC demo data', enabled: true });
    console.log(`✓ Created database: ${ids.database}`);
  }
}

async function ensureTable(table) {
  try {
    await tablesDB.getTable({ databaseId: ids.database, tableId: table.id });
    console.log(`✓ Table already exists: ${table.id}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await tablesDB.createTable({
      databaseId: ids.database,
      tableId: table.id,
      name: table.name,
      permissions: [],
      rowSecurity: true,
      enabled: true
    });
    console.log(`✓ Created table: ${table.id}`);
  }

  const existing = await tablesDB.listColumns({ databaseId: ids.database, tableId: table.id });
  const keys = new Set(existing.columns.map((column) => column.key));
  for (const column of table.columns) {
    if (keys.has(column.key)) continue;
    await tablesDB[column.method]({ databaseId: ids.database, tableId: table.id, ...column.options });
    console.log(`  + Column ${table.id}.${column.key}`);
  }
}

async function ensureEvidenceBucket() {
  try {
    await storage.getBucket({ bucketId: ids.evidence });
    console.log(`✓ Bucket already exists: ${ids.evidence}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await storage.createBucket({
      bucketId: ids.evidence,
      name: 'Demo evidence',
      permissions: [],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 5 * 1024 * 1024,
      allowedFileExtensions: ['png', 'jpg', 'jpeg', 'pdf', 'txt'],
      compression: sdk.Compression.None,
      encryption: true,
      antivirus: true,
      transformations: false
    });
    console.log(`✓ Created private evidence bucket: ${ids.evidence}`);
  }
}

function string(key, size, required, xdefault) {
  return { key, method: 'createStringColumn', options: { key, size, required, xdefault, array: false, encrypt: false } };
}

function text(key, required, xdefault) {
  // Appwrite TablesDB uses sized string columns for longer text content.
  return { key, method: 'createStringColumn', options: { key, size: 10_000, required, xdefault, array: false, encrypt: false } };
}

function enumColumn(key, elements, required, xdefault) {
  return { key, method: 'createEnumColumn', options: { key, elements, required, xdefault, array: false } };
}

function boolean(key, required, xdefault) {
  return { key, method: 'createBooleanColumn', options: { key, required, xdefault, array: false } };
}

function datetime(key, required, xdefault) {
  return { key, method: 'createDatetimeColumn', options: { key, required, xdefault, array: false } };
}

function isNotFound(error) {
  return error?.code === 404 || error?.type === 'database_not_found' || error?.type === 'table_not_found' || error?.type === 'storage_bucket_not_found';
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['\"]|['\"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}
