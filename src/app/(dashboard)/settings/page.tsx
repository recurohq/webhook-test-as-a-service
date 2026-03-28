'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface SettingsGroup {
  title: string;
  description: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'password';
    placeholder: string;
    help?: string;
  }[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'SMTP configuration',
    description: 'Configure SMTP for sending alert emails. Required for email-based alerts.',
    fields: [
      { key: 'smtp_host', label: 'SMTP host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP port', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP username', type: 'text', placeholder: 'you@gmail.com' },
      { key: 'smtp_pass', label: 'SMTP password', type: 'password', placeholder: 'App password or SMTP password' },
      { key: 'smtp_from', label: 'From address', type: 'email', placeholder: 'webhooks@example.com', help: 'The sender address for alert emails.' },
    ],
  },
  {
    title: 'Alert defaults',
    description: 'Default alert settings applied to new endpoints.',
    fields: [
      { key: 'default_alert_email', label: 'Default alert email', type: 'email', placeholder: 'team@example.com', help: 'Pre-filled when creating new endpoints.' },
      { key: 'default_alert_webhook', label: 'Default alert webhook', type: 'text', placeholder: 'https://hooks.slack.com/...', help: 'Pre-filled when creating new endpoints.' },
    ],
  },
  {
    title: 'General',
    description: 'General application settings.',
    fields: [
      { key: 'retention_days', label: 'Request retention (days)', type: 'number', placeholder: '30', help: 'Requests older than this will be cleaned up. 0 = keep forever.' },
      { key: 'max_body_size', label: 'Max request body size (bytes)', type: 'number', placeholder: '1048576', help: 'Maximum request body size to store. Default: 1MB.' },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data.settings || {});
      } catch {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[13px] text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
          Configure application-wide settings for SMTP, alerts, and more.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-[12px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          Settings saved successfully.
        </div>
      )}

      <div className="space-y-5">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">{group.title}</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{group.description}</p>
            </div>
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={settings[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
                />
                {field.help && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{field.help}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-[13px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
        {saved && (
          <span className="text-[12px] text-emerald-600 dark:text-emerald-400">Saved</span>
        )}
      </div>
    </div>
  );
}
