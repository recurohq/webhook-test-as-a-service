'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Endpoint } from '@/lib/types';

export default function EditEndpointPage() {
  const params = useParams();
  const router = useRouter();
  const endpointId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [responseCode, setResponseCode] = useState(200);
  const [responseHeaders, setResponseHeaders] = useState('{"Content-Type":"application/json"}');
  const [responseBody, setResponseBody] = useState('{"ok":true}');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertWebhook, setAlertWebhook] = useState('');
  const [alertTimeoutMinutes, setAlertTimeoutMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEndpoint = async () => {
      try {
        const data = await api.getEndpoint(endpointId);
        const ep: Endpoint = data.endpoint;
        setName(ep.name);
        setDescription(ep.description || '');
        setResponseCode(ep.response_code);
        setResponseHeaders(ep.response_headers || '{"Content-Type":"application/json"}');
        setResponseBody(ep.response_body || '{"ok":true}');
        setAlertEmail(ep.alert_email || '');
        setAlertWebhook(ep.alert_webhook || '');
        setAlertTimeoutMinutes(ep.alert_timeout_minutes || 0);
      } catch {
        setError('Failed to load endpoint');
      } finally {
        setLoading(false);
      }
    };
    loadEndpoint();
  }, [endpointId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.updateEndpoint(endpointId, {
        name: name.trim(),
        description: description.trim(),
        response_code: responseCode,
        response_headers: responseHeaders,
        response_body: responseBody,
        alert_email: alertEmail.trim(),
        alert_webhook: alertWebhook.trim(),
        alert_timeout_minutes: alertTimeoutMinutes,
      });
      router.push(`/endpoints/${endpointId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update endpoint');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[13px] text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Endpoints</Link>
          <span>/</span>
          <Link href={`/endpoints/${endpointId}`} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">{name || 'Endpoint'}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Edit</span>
        </div>
        <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Edit endpoint</h1>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-[12px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">General</h2>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My webhook"
              className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">Response configuration</h2>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Status code</label>
            <input
              type="number"
              value={responseCode}
              onChange={(e) => setResponseCode(parseInt(e.target.value) || 200)}
              className="w-24 px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Response headers (JSON)</label>
            <textarea
              value={responseHeaders}
              onChange={(e) => setResponseHeaders(e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-[13px] font-mono border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1 resize-none"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Response body</label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-1.5 text-[13px] font-mono border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1 resize-none"
            />
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">Alerts</h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400">Get notified when webhooks arrive or when no requests are received (deadman&apos;s switch).</p>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Alert email</label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Alert webhook URL</label>
            <input
              type="url"
              value={alertWebhook}
              onChange={(e) => setAlertWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/..."
              className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Deadman&apos;s switch timeout (minutes)</label>
            <input
              type="number"
              value={alertTimeoutMinutes}
              onChange={(e) => setAlertTimeoutMinutes(parseInt(e.target.value) || 0)}
              min={0}
              placeholder="0 = disabled"
              className="w-32 px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Alert if no requests received within this window. 0 to disable.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            href={`/endpoints/${endpointId}`}
            className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
