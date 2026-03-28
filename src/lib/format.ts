export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function formatDate(dateStr: string): string { return new Date(dateStr).toLocaleString(); }
export function generateCurl(req: { method: string; headers: string; body: string; query_string: string; path: string }, baseUrl: string, endpointId: string): string {
  let url = `${baseUrl}/w/${endpointId}/${req.path}`;
  if (req.query_string) url += `?${req.query_string}`;
  let cmd = `curl -X ${req.method} '${url}'`;
  try {
    const headers = JSON.parse(req.headers);
    for (const [k, v] of Object.entries(headers)) {
      if (!['host', 'content-length', 'connection'].includes(k.toLowerCase())) cmd += ` \\\n  -H '${k}: ${v}'`;
    }
  } catch {}
  if (req.body) cmd += ` \\\n  -d '${req.body.replace(/'/g, "'\\''")}'`;
  return cmd;
}
export function tryParseJSON(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}
