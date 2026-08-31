import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { Client, Functions, ID, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

loadEnvFile(path.resolve('.env'));

const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'VITE_APPWRITE_PROVISION_FUNCTION_ID'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing required .env values: ${missing.join(', ')}`);

const functionId = process.env.VITE_APPWRITE_PROVISION_FUNCTION_ID;
const sourceDirectory = path.resolve('functions/provision-workspace');
const archivePath = path.join(os.tmpdir(), `provision-workspace-${Date.now()}.tar.gz`);
const variables = {
  DATABASE_ID: process.env.VITE_APPWRITE_DATABASE_ID,
  WORKSPACES_TABLE_ID: process.env.VITE_APPWRITE_WORKSPACES_TABLE_ID,
  ALERTS_TABLE_ID: process.env.VITE_APPWRITE_ALERTS_TABLE_ID,
  INCIDENTS_TABLE_ID: process.env.VITE_APPWRITE_INCIDENTS_TABLE_ID,
  NOTES_TABLE_ID: process.env.VITE_APPWRITE_NOTES_TABLE_ID,
  NOTIFICATIONS_TABLE_ID: process.env.VITE_APPWRITE_NOTIFICATIONS_TABLE_ID,
  AUDIT_LOGS_TABLE_ID: process.env.VITE_APPWRITE_AUDIT_LOGS_TABLE_ID,
  WORKSPACE_TTL_HOURS: process.env.WORKSPACE_TTL_HOURS || '168'
};

const emptyVariables = Object.entries(variables).filter(([, value]) => !value).map(([key]) => key);
if (emptyVariables.length) throw new Error(`Missing resource ID values: ${emptyVariables.join(', ')}`);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);

try {
  const fn = await functions.get({ functionId });
  await functions.update({
    functionId,
    name: fn.name,
    execute: [Role.users()],
    entrypoint: 'src/main.js',
    commands: 'npm install',
    scopes: ['rows.read', 'rows.write']
  });

  await syncVariables();
  execFileSync('tar', ['-czf', archivePath, '--exclude=node_modules', '--exclude=code.tar.gz', '-C', sourceDirectory, '.'], { stdio: 'inherit' });

  const deployment = await functions.createDeployment({
    functionId,
    code: InputFile.fromPath(archivePath, 'provision-workspace.tar.gz'),
    activate: true,
    entrypoint: 'src/main.js',
    commands: 'npm install'
  });

  console.log(`✓ Deployment queued for ${fn.name}: ${deployment.$id}`);
  console.log('Function access: authenticated users only; dynamic key scopes: rows.read, rows.write.');
} finally {
  if (fs.existsSync(archivePath)) fs.rmSync(archivePath);
}

async function syncVariables() {
  const current = await functions.listVariables({ functionId });
  const byKey = new Map(current.variables.map((variable) => [variable.key, variable]));

  for (const [key, value] of Object.entries(variables)) {
    const variable = byKey.get(key);
    if (variable) {
      await functions.updateVariable({ functionId, variableId: variable.$id, key, value, secret: false });
    } else {
      await functions.createVariable({ functionId, variableId: ID.unique(), key, value, secret: false });
    }
  }
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
