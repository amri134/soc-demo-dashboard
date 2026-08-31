import { Client, ID, Permission, Query, Role, TablesDB } from 'node-appwrite';

const required = ['DATABASE_ID', 'WORKSPACES_TABLE_ID', 'ALERTS_TABLE_ID', 'INCIDENTS_TABLE_ID', 'NOTES_TABLE_ID', 'NOTIFICATIONS_TABLE_ID', 'AUDIT_LOGS_TABLE_ID'];

export default async ({ req, res, log, error }) => {
  const userId = req.headers['x-appwrite-user-id']; const key = req.headers['x-appwrite-key'];
  if (!userId) return res.json({ message: 'Authentication is required.' }, 401);
  if (!key) return res.json({ message: 'Function key is unavailable.' }, 500);
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) return res.json({ message: `Missing configuration: ${missing.join(', ')}` }, 500);
  const database = new TablesDB(new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(key));
  const ids = resourceIds();
  try {
    const input = parseBody(req.body);
    if (input.action === 'generate-alert') return res.json(await generateAlert(database, ids, userId), 201);
    if (input.action === 'update-incident') return res.json(await updateIncident(database, ids, userId, input), 200);
    if (input.action === 'add-note') return res.json(await addNote(database, ids, userId, input), 201);
    if (input.action === 'reset-workspace') return res.json(await resetWorkspace(database, ids, userId), 201);
    return res.json(await provisionWorkspace(database, ids, userId), 200);
  } catch (caught) { error(`Demo workspace action failed: ${caught.message}`); return res.json({ message: 'Unable to process the demo action.' }, 500); }
};

function resourceIds() { return { database: process.env.DATABASE_ID, workspaces: process.env.WORKSPACES_TABLE_ID, alerts: process.env.ALERTS_TABLE_ID, incidents: process.env.INCIDENTS_TABLE_ID, notes: process.env.NOTES_TABLE_ID, notifications: process.env.NOTIFICATIONS_TABLE_ID, audit: process.env.AUDIT_LOGS_TABLE_ID }; }
function parseBody(body) { try { return body ? JSON.parse(body) : {}; } catch { throw new Error('Invalid JSON body.'); } }
function permissions(userId) { const owner = Role.user(userId); return [Permission.read(owner), Permission.update(owner), Permission.delete(owner)]; }
function ttl() { const value = Number.parseInt(process.env.WORKSPACE_TTL_HOURS ?? '168', 10); return Number.isInteger(value) && value >= 1 && value <= 720 ? value : 168; }

async function activeWorkspace(db, ids, userId) {
  const result = await db.listRows({ databaseId: ids.database, tableId: ids.workspaces, queries: [Query.equal('ownerId', [userId]), Query.equal('status', ['active']), Query.limit(1)] });
  return result.rows[0] ?? null;
}

async function provisionWorkspace(db, ids, userId) {
  const existing = await activeWorkspace(db, ids, userId); if (existing) return { workspaceId: existing.$id, created: false };
  const now = new Date(); const workspaceId = ID.unique(); const rowPermissions = permissions(userId);
  await db.createRow({ databaseId: ids.database, tableId: ids.workspaces, rowId: workspaceId, data: { ownerId: userId, status: 'active', expiresAt: new Date(now.getTime() + ttl() * 3600000).toISOString(), createdAt: now.toISOString() }, permissions: rowPermissions });
  const alerts = seedAlerts(workspaceId, now);
  for (const item of alerts) await db.createRow({ databaseId: ids.database, tableId: ids.alerts, rowId: item.id, data: item.data, permissions: rowPermissions });
  for (const item of seedIncidents(workspaceId, alerts, now)) await db.createRow({ databaseId: ids.database, tableId: ids.incidents, rowId: item.id, data: item.data, permissions: rowPermissions });
  for (const item of seedNotifications(workspaceId, now)) await db.createRow({ databaseId: ids.database, tableId: ids.notifications, rowId: item.id, data: item.data, permissions: rowPermissions });
  await audit(db, ids, workspaceId, userId, 'workspace.provisioned');
  return { workspaceId, created: true };
}

async function generateAlert(db, ids, userId) {
  const workspace = await requireWorkspace(db, ids, userId); const now = new Date(); const templates = [
    ['Unusual DNS request detected', 'medium', '203.0.113.42'], ['Simulated privilege escalation', 'high', '198.51.100.88'], ['Training endpoint policy violation', 'low', '192.0.2.74']
  ]; const [title, severity, sourceIp] = templates[Math.floor(Math.random() * templates.length)]; const rowId = ID.unique();
  await db.createRow({ databaseId: ids.database, tableId: ids.alerts, rowId, data: { workspaceId: workspace.$id, severity, title, description: 'Synthetic alert generated for the isolated demo workspace.', sourceIp, status: 'new', simulatedAt: now.toISOString() }, permissions: permissions(userId) });
  await db.createRow({ databaseId: ids.database, tableId: ids.notifications, rowId: ID.unique(), data: { workspaceId: workspace.$id, channel: 'telegram_simulation', message: `Synthetic ${severity} alert generated: ${title}.`, isRead: false, createdAt: now.toISOString() }, permissions: permissions(userId) });
  await audit(db, ids, workspace.$id, userId, 'alert.generated'); return { alertId: rowId };
}

async function updateIncident(db, ids, userId, input) {
  if (!input.incidentId || !['new', 'investigating', 'resolved'].includes(input.status)) throw new Error('Invalid incident update.');
  const workspace = await requireWorkspace(db, ids, userId); const incident = await db.getRow({ databaseId: ids.database, tableId: ids.incidents, rowId: input.incidentId });
  if (incident.workspaceId !== workspace.$id) throw new Error('Incident is outside the active workspace.');
  await db.updateRow({ databaseId: ids.database, tableId: ids.incidents, rowId: incident.$id, data: { status: input.status, updatedAt: new Date().toISOString() } });
  await audit(db, ids, workspace.$id, userId, 'incident.status_updated'); return { incidentId: incident.$id, status: input.status };
}

async function addNote(db, ids, userId, input) {
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!input.incidentId || !body || body.length > 2000) throw new Error('Invalid incident note.');
  const workspace = await requireWorkspace(db, ids, userId); const incident = await db.getRow({ databaseId: ids.database, tableId: ids.incidents, rowId: input.incidentId });
  if (incident.workspaceId !== workspace.$id) throw new Error('Incident is outside the active workspace.');
  const now = new Date().toISOString(); const noteId = ID.unique();
  await db.createRow({ databaseId: ids.database, tableId: ids.notes, rowId: noteId, data: { workspaceId: workspace.$id, incidentId: incident.$id, authorId: userId, body, createdAt: now }, permissions: permissions(userId) });
  await db.updateRow({ databaseId: ids.database, tableId: ids.incidents, rowId: incident.$id, data: { updatedAt: now } });
  await audit(db, ids, workspace.$id, userId, 'incident.note_added'); return { noteId };
}

async function resetWorkspace(db, ids, userId) {
  const workspace = await requireWorkspace(db, ids, userId); const query = [Query.equal('workspaceId', [workspace.$id])];
  await Promise.all([ids.alerts, ids.incidents, ids.notes, ids.notifications, ids.audit].map((tableId) => db.deleteRows({ databaseId: ids.database, tableId, queries: query })));
  await db.deleteRow({ databaseId: ids.database, tableId: ids.workspaces, rowId: workspace.$id });
  return provisionWorkspace(db, ids, userId);
}

async function requireWorkspace(db, ids, userId) { const workspace = await activeWorkspace(db, ids, userId); if (!workspace) throw new Error('Active workspace not found.'); return workspace; }
async function audit(db, ids, workspaceId, userId, action) { await db.createRow({ databaseId: ids.database, tableId: ids.audit, rowId: ID.unique(), data: { workspaceId, actorId: userId, action, metadata: JSON.stringify({ mode: 'synthetic-demo' }), createdAt: new Date().toISOString() }, permissions: [Permission.read(Role.user(userId))] }); }
function seedAlerts(workspaceId, now) { const items = [['SSH brute-force attempt', 'critical', '192.0.2.10'], ['Suspicious login detected', 'high', '198.51.100.24'], ['Critical file integrity change', 'medium', '203.0.113.7'], ['Malware signature detected', 'high', '192.0.2.88'], ['Repeated authentication failure', 'low', '198.51.100.61']]; return items.map(([title, severity, sourceIp], index) => ({ id: ID.unique(), data: { workspaceId, severity, title, description: 'Synthetic demo event.', sourceIp, status: index === 4 ? 'dismissed' : index === 1 || index === 3 ? 'triaged' : 'new', simulatedAt: new Date(now.getTime() - index * 1080000).toISOString() } })); }
function seedIncidents(workspaceId, alerts, now) { const items = [['Investigate SSH brute-force campaign', 'critical', 'investigating', alerts[0].id], ['Review suspicious administrator login', 'high', 'new', alerts[1].id], ['Validate integrity change on web server', 'medium', 'investigating', alerts[2].id]]; return items.map(([summary, priority, status, alertId], index) => ({ id: ID.unique(), data: { workspaceId, alertId, status, priority, summary, resolution: '', createdAt: new Date(now.getTime() - (index + 1) * 1800000).toISOString(), updatedAt: now.toISOString() } })); }
function seedNotifications(workspaceId, now) { return ['🚨 Critical security alert: SSH brute-force attempt detected from documentation IP 192.0.2.10.', 'Incident updated: SSH brute-force campaign moved to Investigating.'].map((message, index) => ({ id: ID.unique(), data: { workspaceId, channel: 'telegram_simulation', message, isRead: false, createdAt: new Date(now.getTime() - index * 720000).toISOString() } })); }
