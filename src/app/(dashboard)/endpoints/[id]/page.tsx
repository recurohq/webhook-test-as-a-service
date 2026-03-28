'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo, formatBytes, formatDate, generateCurl, tryParseJSON } from '@/lib/format';
import { usePolling } from '@/hooks/usePolling';
import { CopyButton } from '@/components/CopyButton';
import type { Endpoint, WebhookRequest, ForwardingRule } from '@/lib/types';

export default function EndpointDetailPage() {
  const params = useParams();
  const router = useRouter();
  const endpointId = params.id as string;

  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [totalRequests, setTotalRequests] = useState(0);
  const [todayRequests, setTodayRequests] = useState(0);
  const [forwardingRules, setForwardingRules] = useState<ForwardingRule[]>([]);
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'query' | 'forwarding'>('body');
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [replayUrl, setReplayUrl] = useState('');
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);
  const [newRuleUrl, setNewRuleUrl] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const limit = 50;

  const fetchEndpoint = useCallback(async () => {
    try {
      const data = await api.getEndpoint(endpointId);
      setEndpoint(data.endpoint);
      setBaseUrl(data.base_url);
      setTotalRequests(data.total_requests);
      setTodayRequests(data.today_requests);
      setForwardingRules(data.forwarding_rules || []);
    } catch {
      // handled
    }
  }, [endpointId]);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await api.listRequests(endpointId, {
        limit,
        offset,
        method: methodFilter,
        search: searchFilter,
      });
      setRequests(data.requests);
      setRequestsTotal(data.total);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [endpointId, offset, methodFilter, searchFilter]);

  useEffect(() => {
    fetchEndpoint();
    fetchRequests();
  }, [fetchEndpoint, fetchRequests]);

  usePolling(() => {
    fetchEndpoint();
    fetchRequests();
  }, 5000);

  useEffect(() => {
    setOffset(0);
  }, [methodFilter, searchFilter]);

  const handleDelete = async () => {
    if (!confirm('Delete this endpoint and all its requests?')) return;
    try {
      await api.deleteEndpoint(endpointId);
      router.push('/');
    } catch {
      // ignore
    }
  };

  const handleClearRequests = async () => {
    if (!confirm('Delete all captured requests?')) return;
    try {
      await api.clearRequests(endpointId);
      setRequests([]);
      setRequestsTotal(0);
      setSelectedRequest(null);
      await fetchEndpoint();
    } catch {
      // ignore
    }
  };

  const handleToggle = async () => {
    if (!endpoint) return;
    try {
      await api.toggleEndpoint(endpointId, !endpoint.enabled);
      await fetchEndpoint();
    } catch {
      // ignore
    }
  };

  const handleExportRequests = async () => {
    try {
      const blob = await api.exportRequests(endpointId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requests-${endpointId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleReplay = async () => {
    if (!selectedRequest || !replayUrl.trim()) return;
    setReplayLoading(true);
    setReplayResult(null);
    try {
      const data = await api.replayRequest(endpointId, selectedRequest.id, replayUrl.trim());
      setReplayResult(data.result);
    } catch (err: any) {
      setReplayResult({ error: err.message });
    } finally {
      setReplayLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRuleUrl.trim()) return;
    setAddingRule(true);
    try {
      await api.addForwardingRule(endpointId, newRuleUrl.trim());
      setNewRuleUrl('');
      await fetchEndpoint();
    } catch {
      // ignore
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteForwardingRule(endpointId, ruleId);
      await fetchEndpoint();
    } catch {
      // ignore
    }
  };

  const copyCurl = () => {
    if (!selectedRequest) return;
    const curl = generateCurl(selectedRequest, baseUrl, endpointId);
    navigator.clipboard.writeText(curl);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const totalPages = Math.ceil(requestsTotal / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[13px] text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">Endpoint not found</p>
          <Link href="/" className="text-[13px] font-medium text-gray-900 dark:text-white hover:underline">
            Back to endpoints
          </Link>
        </div>
      </div>
    );
  }

  const webhookUrl = `${baseUrl}/w/${endpointId}`;

  const renderHeaders = (headersStr: string) => {
    try {
      const headers = JSON.parse(headersStr);
      return Object.entries(headers).map(([k, v]) => (
        <div key={k} className="flex gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
          <span className="text-[12px] font-mono font-medium text-gray-900 dark:text-white shrink-0">{k}</span>
          <span className="text-[12px] font-mono text-gray-500 dark:text-gray-400 break-all">{String(v)}</span>
        </div>
      ));
    } catch {
      return <pre className="text-[12px] font-mono text-gray-500 whitespace-pre-wrap">{headersStr}</pre>;
    }
  };

  const renderQueryParams = (qs: string) => {
    if (!qs) return <p className="text-[12px] text-gray-500 dark:text-gray-400">No query parameters</p>;
    const params = new URLSearchParams(qs);
    return Array.from(params.entries()).map(([k, v]) => (
      <div key={k} className="flex gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <span className="text-[12px] font-mono font-medium text-gray-900 dark:text-white shrink-0">{k}</span>
        <span className="text-[12px] font-mono text-gray-500 dark:text-gray-400 break-all">{v}</span>
      </div>
    ));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Endpoints</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{endpoint.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{endpoint.name}</h1>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${endpoint.enabled ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${endpoint.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {endpoint.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          {endpoint.description && (
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{endpoint.description}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <code className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {endpoint.enabled ? 'Disable' : 'Enable'}
          </button>
          <Link
            href={`/endpoints/${endpointId}/edit`}
            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total requests</div>
          <div className="text-[18px] font-semibold text-gray-900 dark:text-white mt-0.5 tabular-nums">{totalRequests}</div>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last 24 hours</div>
          <div className="text-[18px] font-semibold text-gray-900 dark:text-white mt-0.5 tabular-nums">{todayRequests}</div>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last received</div>
          <div className="text-[13px] font-medium text-gray-900 dark:text-white mt-1">{timeAgo(endpoint.last_request_at)}</div>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}>
        {/* Left: request list */}
        <div className="w-[340px] shrink-0 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1 px-2.5 py-1 text-[12px] border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {['', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${
                      methodFilter === m
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {m || 'All'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportRequests}
                  className="px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Export requests"
                >
                  Export
                </button>
                <button
                  onClick={handleClearRequests}
                  className="px-2 py-0.5 text-[11px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                  title="Clear all requests"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[12px] text-gray-500 dark:text-gray-400">No requests yet</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Send a request to {webhookUrl}</p>
              </div>
            ) : (
              requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setActiveTab('body');
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                    selectedRequest?.id === req.id
                      ? 'bg-gray-50 dark:bg-gray-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
                      req.method === 'GET' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                      req.method === 'POST' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                      req.method === 'PUT' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                      req.method === 'DELETE' ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {req.method}
                    </span>
                    <span className="text-[12px] text-gray-900 dark:text-white font-mono truncate flex-1">
                      /{req.path || ''}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                      {formatBytes(req.size_bytes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{req.source_ip}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(req.received_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={currentPage >= totalPages}
                className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right: request detail */}
        <div className="flex-1 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col min-w-0">
          {!selectedRequest ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-gray-400 dark:text-gray-500">Select a request to inspect</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
                      selectedRequest.method === 'GET' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                      selectedRequest.method === 'POST' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                      selectedRequest.method === 'PUT' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                      selectedRequest.method === 'DELETE' ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedRequest.method}
                    </span>
                    <span className="text-[12px] font-mono text-gray-700 dark:text-gray-300 truncate">
                      /{selectedRequest.path || ''}{selectedRequest.query_string ? `?${selectedRequest.query_string}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyCurl}
                      className="px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      {curlCopied ? 'Copied' : 'Copy curl'}
                    </button>
                    <button
                      onClick={() => {
                        setReplayModalOpen(true);
                        setReplayResult(null);
                        setReplayUrl('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      Replay
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{formatDate(selectedRequest.received_at)}</span>
                  <span>{formatBytes(selectedRequest.size_bytes)}</span>
                  <span>{selectedRequest.source_ip}</span>
                  {selectedRequest.content_type && <span>{selectedRequest.content_type}</span>}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-0">
                {(['body', 'headers', 'query', 'forwarding'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-auto p-4">
                {activeTab === 'body' && (
                  <div>
                    {selectedRequest.body ? (
                      <pre className="text-[12px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                        {tryParseJSON(selectedRequest.body)}
                      </pre>
                    ) : (
                      <p className="text-[12px] text-gray-500 dark:text-gray-400">No request body</p>
                    )}
                  </div>
                )}

                {activeTab === 'headers' && (
                  <div>{renderHeaders(selectedRequest.headers)}</div>
                )}

                {activeTab === 'query' && (
                  <div>{renderQueryParams(selectedRequest.query_string)}</div>
                )}

                {activeTab === 'forwarding' && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-2">Forwarding rules</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Incoming requests will be forwarded to these URLs in real-time.</p>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="url"
                          value={newRuleUrl}
                          onChange={(e) => setNewRuleUrl(e.target.value)}
                          placeholder="https://example.com/webhook"
                          className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                        />
                        <button
                          onClick={handleAddRule}
                          disabled={addingRule || !newRuleUrl.trim()}
                          className="px-3 py-1.5 text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {addingRule ? 'Adding...' : 'Add rule'}
                        </button>
                      </div>
                      {forwardingRules.length === 0 ? (
                        <p className="text-[12px] text-gray-400 dark:text-gray-500">No forwarding rules configured</p>
                      ) : (
                        <div className="space-y-2">
                          {forwardingRules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md">
                              <div className="flex items-center gap-1 min-w-0">
                                <code className="text-[12px] font-mono text-gray-700 dark:text-gray-300 truncate">{rule.target_url}</code>
                                <CopyButton text={rule.target_url} />
                              </div>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-[11px] text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors ml-2 shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replay modal */}
      {replayModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg w-full max-w-md p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-3">Replay request</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
              Forward this {selectedRequest.method} request to a target URL.
            </p>
            <div className="mb-4">
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">Target URL</label>
              <input
                type="url"
                value={replayUrl}
                onChange={(e) => setReplayUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
              />
            </div>
            {replayResult && (
              <div className={`mb-4 px-3 py-2 rounded-md text-[12px] font-mono ${replayResult.error ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                {replayResult.error ? (
                  <span>Error: {replayResult.error}</span>
                ) : (
                  <span>Status: {replayResult.status_code} ({replayResult.latency_ms}ms)</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReplayModalOpen(false)}
                className="px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleReplay}
                disabled={replayLoading || !replayUrl.trim()}
                className="px-3 py-1.5 text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {replayLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
