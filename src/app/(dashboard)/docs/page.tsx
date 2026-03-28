'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';

export default function DocsPage() {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    api.getConfig().then((data) => setBaseUrl(data.base_url)).catch(() => {});
  }, []);

  const displayUrl = baseUrl || 'https://your-instance.example.com';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Documentation</h1>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
          Learn how to use webhook-as-a-service to receive, inspect, and forward webhooks.
        </p>
      </div>

      <div className="space-y-8">
        {/* How it works */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">How it works</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">1</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">Create an endpoint</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">Each endpoint gets a unique URL that accepts any HTTP method.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">2</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">Send webhooks to the URL</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">Point your service at the generated webhook URL. All requests are captured.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">3</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">Inspect and forward</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">View request details, replay them, or set up auto-forwarding to your server.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Webhook URLs */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Webhook URLs</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              Each endpoint is assigned a unique URL in the format:
            </p>
            <div className="relative">
              <code className="block px-3 py-2 pr-9 text-[12px] font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                {displayUrl}/w/&#123;endpoint_id&#125;
              </code>
              <div className="absolute top-1.5 right-1.5">
                <CopyButton text={`${displayUrl}/w/{endpoint_id}`} />
              </div>
            </div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              You can append any path after the endpoint ID. For example:
            </p>
            <div className="relative">
              <code className="block px-3 py-2 pr-9 text-[12px] font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                {displayUrl}/w/&#123;endpoint_id&#125;/any/custom/path?query=value
              </code>
              <div className="absolute top-1.5 right-1.5">
                <CopyButton text={`${displayUrl}/w/{endpoint_id}/any/custom/path?query=value`} />
              </div>
            </div>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              All HTTP methods are accepted: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD.
            </p>
          </div>
        </section>

        {/* Quick test */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Quick test</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-[13px] text-gray-700 dark:text-gray-300 mb-3">
              After creating an endpoint, test it with curl:
            </p>
            <div className="relative">
              <pre className="px-3 py-2 pr-9 text-[12px] font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-pre-wrap">{`curl -X POST '${displayUrl}/w/{endpoint_id}' \\
  -H 'Content-Type: application/json' \\
  -d '{"event": "test", "data": {"message": "Hello"}}'`}</pre>
              <div className="absolute top-1.5 right-1.5">
                <CopyButton text={`curl -X POST '${displayUrl}/w/{endpoint_id}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"event": "test", "data": {"message": "Hello"}}'`} />
              </div>
            </div>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-3">
              The endpoint will respond with the configured status code and body. The captured request will appear in the dashboard immediately.
            </p>
          </div>
        </section>

        {/* Forwarding */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Forwarding</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              Set up forwarding rules to automatically relay incoming requests to one or more target URLs. This is useful for:
            </p>
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
              <li>Debugging webhooks while still delivering them to your production server</li>
              <li>Fanning out a single webhook to multiple services</li>
              <li>Testing webhook handling in development environments</li>
            </ul>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Forwarding happens asynchronously and does not affect the response time of the webhook endpoint. Failed forwarding attempts are logged for review.
            </p>
          </div>
        </section>

        {/* Replay */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Request replay</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              Any captured request can be replayed to a target URL. This allows you to:
            </p>
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
              <li>Re-send a failed webhook to your server after fixing a bug</li>
              <li>Test how your application handles specific payloads</li>
              <li>Forward a request to a different environment (staging, development)</li>
            </ul>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              The replay sends the original method, headers, and body to the specified target URL.
            </p>
          </div>
        </section>

        {/* Deadman's switch */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Deadman&apos;s switch</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              The deadman&apos;s switch alerts you when an endpoint has not received any requests within a configured timeout. This is useful for monitoring critical webhooks that should arrive regularly.
            </p>
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              To enable it, set the &quot;Deadman&apos;s switch timeout&quot; on an endpoint to a value greater than 0 minutes. When the timeout elapses without a request, an alert is sent via the configured email and/or webhook URL.
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              The alert fires once and resets when a new request arrives. Configure SMTP settings on the Settings page for email alerts.
            </p>
          </div>
        </section>

        {/* Configuration reference */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Configuration reference</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Field</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">name</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">string</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Display name for the endpoint (required)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">description</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">string</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Optional description</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">response_code</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">number</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">HTTP status code returned to callers (default: 200)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">response_headers</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">JSON</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Response headers as a JSON object</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">response_body</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">string</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Response body returned to callers</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">alert_email</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">string</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Email address for alert notifications</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">alert_webhook</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">string</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Webhook URL for alert notifications (e.g., Slack)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">alert_timeout_minutes</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-gray-400">number</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">Deadman&apos;s switch timeout in minutes (0 = disabled)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Authentication</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              The dashboard and API are protected by password authentication. Set the <code className="text-[12px] font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">AUTH_PASSWORD</code> environment variable to configure the login password.
            </p>
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              Webhook endpoints (<code className="text-[12px] font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/w/...</code>) are publicly accessible and do not require authentication, so external services can send webhooks without credentials.
            </p>
          </div>
        </section>

        {/* API */}
        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">API endpoints</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {[
                  ['GET', '/api/endpoints', 'List all endpoints'],
                  ['POST', '/api/endpoints', 'Create a new endpoint'],
                  ['GET', '/api/endpoints/:id', 'Get endpoint details'],
                  ['PUT', '/api/endpoints/:id', 'Update an endpoint'],
                  ['DELETE', '/api/endpoints/:id', 'Delete an endpoint'],
                  ['POST', '/api/endpoints/:id/toggle', 'Enable/disable an endpoint'],
                  ['POST', '/api/endpoints/bulk', 'Bulk enable/disable/delete'],
                  ['GET', '/api/endpoints/:id/requests', 'List captured requests'],
                  ['DELETE', '/api/endpoints/:id/requests', 'Clear captured requests'],
                  ['POST', '/api/endpoints/:id/requests/:rid/replay', 'Replay a request'],
                  ['GET', '/api/endpoints/export', 'Export all endpoints'],
                  ['POST', '/api/endpoints/import', 'Import endpoints'],
                  ['GET', '/api/settings', 'Get application settings'],
                  ['PUT', '/api/settings', 'Update application settings'],
                ].map(([method, path, desc]) => (
                  <tr key={`${method}-${path}`}>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
                        method === 'GET' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                        method === 'POST' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                        method === 'PUT' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                        'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                      }`}>
                        {method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-mono text-gray-900 dark:text-white">{path}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
