import { useEffect, useState } from 'react';
import { getSettings } from '../lib/api';

function SettingsPage() {
  const [settings, setSettings] = useState<{
    app_version: string;
    database_status: string;
    testing_environment_status: string;
    github_integration: { configured: boolean; provider: string; mode: string };
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getSettings();
        setSettings(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load settings');
      }
    }

    load();
  }, []);

  if (error) {
    return <div className="error-state" role="alert">{error}</div>;
  }

  if (!settings) {
    return <div className="surface-card p-5 text-sm text-slate-400" role="status">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">SYSTEM</div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Review the current local setup and available integrations.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Application version" value={settings.app_version} />
        <Card title="Local database status" value={settings.database_status} />
        <Card title="Testing environment status" value={settings.testing_environment_status} />
        <Card title="GitHub integration" value={`${settings.github_integration.provider} · ${settings.github_integration.configured ? 'Configured' : 'Not configured'}`} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-3 text-lg font-medium text-white">{value}</div>
    </div>
  );
}

export default SettingsPage;
