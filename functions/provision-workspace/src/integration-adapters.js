// Integration-ready adapters. They are intentionally not invoked while DEMO_MODE is true.
// Keep credentials in Appwrite Function secret variables, never in VITE_* variables.

export function assertLiveIntegrationsEnabled() {
  if (process.env.DEMO_MODE !== 'false' || process.env.LIVE_INTEGRATIONS_ENABLED !== 'true') {
    throw new Error('Live integrations are disabled. Synthetic demo mode is active.');
  }
}

export async function fetchWazuhAlerts() {
  assertLiveIntegrationsEnabled();
  const baseUrl = requireUrl('WAZUH_API_URL');
  const token = requireValue('WAZUH_API_TOKEN');
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/alerts`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Wazuh request failed: ${response.status}`);
  const payload = await response.json();
  return (payload.data?.affected_items ?? []).map(normalizeWazuhAlert);
}

export async function fetchZabbixProblems() {
  assertLiveIntegrationsEnabled();
  const endpoint = requireUrl('ZABBIX_API_URL');
  const token = requireValue('ZABBIX_API_TOKEN');
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json-rpc' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'problem.get', params: { output: ['eventid', 'name', 'severity', 'clock'], recent: true, sortfield: ['eventid'], sortorder: 'DESC', limit: 100 }, id: 1 }) });
  if (!response.ok) throw new Error(`Zabbix request failed: ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`Zabbix API error: ${payload.error.message}`);
  return (payload.result ?? []).map(normalizeZabbixProblem);
}

export function normalizeWazuhAlert(item) { return { provider: 'wazuh', externalId: String(item.id ?? item.rule?.id ?? 'unknown'), title: item.rule?.description ?? 'Wazuh alert', severity: wazuhSeverity(item.rule?.level), sourceIp: item.data?.srcip ?? '', occurredAt: item.timestamp ?? new Date().toISOString(), raw: item }; }
export function normalizeZabbixProblem(item) { return { provider: 'zabbix', externalId: String(item.eventid ?? 'unknown'), title: item.name ?? 'Zabbix problem', severity: zabbixSeverity(item.severity), sourceIp: '', occurredAt: new Date(Number(item.clock ?? 0) * 1000 || Date.now()).toISOString(), raw: item }; }

function wazuhSeverity(level) { if (Number(level) >= 12) return 'critical'; if (Number(level) >= 8) return 'high'; if (Number(level) >= 4) return 'medium'; return 'low'; }
function zabbixSeverity(level) { return ['low', 'low', 'medium', 'high', 'critical', 'critical'][Number(level)] ?? 'medium'; }
function requireValue(key) { if (!process.env[key]) throw new Error(`Missing secret variable: ${key}`); return process.env[key]; }
function requireUrl(key) { const value = requireValue(key); if (!/^https:\/\//.test(value)) throw new Error(`${key} must use HTTPS.`); return value; }
