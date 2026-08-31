import { PageHeader } from '../components/ui/PageHeader';

const integrations = [
  { name: 'Wazuh', role: 'Security events, FIM, vulnerability, and endpoint alerts', color: 'wazuh' },
  { name: 'Zabbix', role: 'Infrastructure health, availability, capacity, and service problems', color: 'zabbix' }
];

export function IntegrationsPage() {
  return <><PageHeader title="Integrations" description="Konektor siap diaktifkan, tetapi dashboard ini saat ini tetap berada pada mode demo sintetis." /><div className="integration-notice"><strong>Live ingestion disabled</strong><span>Tidak ada permintaan API, token, atau data Wazuh/Zabbix asli yang digunakan di mode demo.</span></div><section className="integration-grid">{integrations.map((integration) => <article className="panel integration-card" key={integration.name}><span className={`integration-mark ${integration.color}`}>{integration.name[0]}</span><h3>{integration.name}</h3><p>{integration.role}</p><dl><div><dt>Mode</dt><dd><span className="integration-status">Demo / disabled</span></dd></div><div><dt>Adapter</dt><dd>Ready, server-side only</dd></div><div><dt>Credential</dt><dd>Function secret variable</dd></div></dl></article>)}</section><article className="panel integration-next"><h3>Ketika mode produksi disetujui</h3><ol><li>Simpan URL dan token API sebagai secret variable pada Appwrite Function.</li><li>Gunakan HTTPS dan akun API read-only dengan scope minimum.</li><li>Aktifkan sinkronisasi terjadwal, bukan dari browser.</li><li>Normalisasi severity serta host ID sebelum data masuk ke tabel operasional.</li></ol></article></>;
}
