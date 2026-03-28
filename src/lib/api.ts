async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (password: string) => request<{ ok: boolean }>('/api/login', { method: 'POST', body: JSON.stringify({ password }) }),
  checkAuth: () => request<{ ok: boolean }>('/api/me'),
  logout: () => request<{ ok: boolean }>('/api/logout', { method: 'POST' }),
  listEndpoints: () => request<{ endpoints: any[]; base_url: string }>('/api/endpoints'),
  getEndpoint: (id: string) => request<any>(`/api/endpoints/${id}`),
  createEndpoint: (data: any) => request<any>('/api/endpoints', { method: 'POST', body: JSON.stringify(data) }),
  updateEndpoint: (id: string, data: any) => request<any>(`/api/endpoints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEndpoint: (id: string) => request<any>(`/api/endpoints/${id}`, { method: 'DELETE' }),
  toggleEndpoint: (id: string, enabled: boolean) => request<any>(`/api/endpoints/${id}/toggle`, { method: 'POST', body: JSON.stringify({ enabled }) }),
  bulkAction: (ids: string[], action: string) => request<any>('/api/endpoints/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) }),
  listRequests: (eid: string, p?: { limit?: number; offset?: number; method?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (p?.limit) qs.set('limit', String(p.limit));
    if (p?.offset) qs.set('offset', String(p.offset));
    if (p?.method) qs.set('method', p.method);
    if (p?.search) qs.set('search', p.search);
    return request<any>(`/api/endpoints/${eid}/requests?${qs}`);
  },
  getRequest: (eid: string, rid: string) => request<any>(`/api/endpoints/${eid}/requests/${rid}`),
  clearRequests: (eid: string) => request<any>(`/api/endpoints/${eid}/requests`, { method: 'DELETE' }),
  replayRequest: (eid: string, rid: string, url: string) => request<any>(`/api/endpoints/${eid}/requests/${rid}/replay`, { method: 'POST', body: JSON.stringify({ target_url: url }) }),
  addForwardingRule: (eid: string, url: string) => request<any>(`/api/endpoints/${eid}/forwarding-rules`, { method: 'POST', body: JSON.stringify({ target_url: url }) }),
  deleteForwardingRule: (eid: string, rid: string) => request<any>(`/api/endpoints/${eid}/forwarding-rules/${rid}`, { method: 'DELETE' }),
  exportEndpoints: () => fetch('/api/endpoints/export', { credentials: 'include' }).then(r => r.blob()),
  importEndpoints: (data: string) => request<any>('/api/endpoints/import', { method: 'POST', body: data }),
  exportRequests: (eid: string) => fetch(`/api/endpoints/${eid}/requests/export`, { credentials: 'include' }).then(r => r.blob()),
  getSettings: () => request<{ settings: Record<string, string> }>('/api/settings'),
  updateSettings: (data: Record<string, string>) => request<{ ok: boolean }>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getConfig: () => request<{ base_url: string }>('/api/config'),
};
