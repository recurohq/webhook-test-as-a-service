'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { dark, toggle } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.login(password); router.push('/'); }
    catch (err: any) { setError(err.message || 'Invalid password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <div className="absolute top-4 right-4">
        <button onClick={toggle} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {dark ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[340px] px-4">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">webhook-as-a-service</h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Sign in to your dashboard</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" autoFocus />
            {error && <p className="text-red-600 dark:text-red-400 text-[13px] mt-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full mt-4 py-2 text-sm bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
      <div className="py-6 text-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">Made by <a href="https://recurohq.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2">Recuro</a></span>
      </div>
    </div>
  );
}
