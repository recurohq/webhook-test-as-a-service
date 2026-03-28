'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { usePolling } from '@/hooks/usePolling';
import { CopyButton } from '@/components/CopyButton';
import type { Endpoint } from '@/lib/types';

export default function EndpointsListPage() {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await api.listEndpoints();
      setEndpoints(data.endpoints);
      setBaseUrl(data.base_url);
    } catch {
      // handled by api redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  usePolling(fetchEndpoints, 30000);

  const filtered = endpoints.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selected.size} endpoint(s)?`)) return;
    setBulkLoading(true);
    try {
      await api.bulkAction(Array.from(selected), action);
      setSelected(new Set());
      await fetchEndpoints();
    } catch {
      // ignore
    } finally {
      setBulkLoading(false);
    }
  };

  const handleToggle = async (ep: Endpoint) => {
    try {
      await api.toggleEndpoint(ep.id, !ep.enabled);
      await fetchEndpoints();
    } catch {
      // ignore
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportEndpoints();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'endpoints-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await api.importEndpoints(text);
        setImportError('');
        await fetchEndpoints();
      } catch (err: any) {
        setImportError(err.message || 'Import failed');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[13px] text-gray-500">Loading endpoints...</div>
      </div>
    );
  }

  if (endpoints.length === 0 && !search) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.257" />
          </svg>
        </div>
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">No endpoints yet</h2>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">Create your first webhook endpoint to start receiving requests.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push('/endpoints/new')}
            className="px-4 py-2 text-[13px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Create endpoint
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">Endpoints</h1>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Export
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => router.push('/endpoints/new')}
            className="px-3 py-1.5 text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Create endpoint
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 px-3 py-2 text-[12px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          {importError}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-1"
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500">{selected.size} selected</span>
            <button
              onClick={() => handleBulkAction('enable')}
              disabled={bulkLoading}
              className="px-2.5 py-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Enable
            </button>
            <button
              onClick={() => handleBulkAction('disable')}
              disabled={bulkLoading}
              className="px-2.5 py-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Disable
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkLoading}
              className="px-2.5 py-1 text-[12px] font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="text-left px-3 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</th>
              <th className="text-right px-3 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last request</th>
              <th className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.map((ep) => (
              <tr
                key={ep.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/endpoints/${ep.id}`)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(ep.id)}
                    onChange={() => toggleSelect(ep.id)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/endpoints/${ep.id}`}
                    className="text-[13px] font-medium text-gray-900 dark:text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ep.name}
                  </Link>
                  {ep.description && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">{ep.description}</div>
                  )}
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                      {baseUrl}/w/{ep.id}
                    </code>
                    <CopyButton text={`${baseUrl}/w/${ep.id}`} />
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-[13px] text-gray-900 dark:text-white font-medium tabular-nums">
                    {ep.request_count_24h || 0}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[12px] text-gray-500 dark:text-gray-400">
                    {timeAgo(ep.last_request_at)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggle(ep)}
                    className="inline-flex items-center gap-1.5"
                    title={ep.enabled ? 'Active - click to disable' : 'Disabled - click to enable'}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ep.enabled
                          ? 'bg-emerald-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    <span className={`text-[11px] ${ep.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {ep.enabled ? 'Active' : 'Off'}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && search && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">No endpoints match &quot;{search}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
