'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.checkAuth().then(() => setLoading(false)).catch(() => router.push('/login'));
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div></div>;

  const navLink = (path: string, label: string) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
    return <Link href={path} className={`text-[13px] px-3 py-1.5 rounded-md transition-colors ${active ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{label}</Link>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-12 items-center">
            <div className="flex items-center gap-1">
              <Link href="/" className="text-[15px] font-semibold text-gray-900 dark:text-white mr-4 tracking-tight">webhook-as-a-service</Link>
              {navLink('/', 'Endpoints')}
              {navLink('/docs', 'Docs')}
              {navLink('/settings', 'Settings')}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggle} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Toggle theme">
                {dark ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
              </button>
              <button onClick={() => { api.logout(); router.push('/login'); }} className="text-[13px] px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Log out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">Made by <a href="https://recurohq.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2">Recuro</a></span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Open source &middot; <a href="https://github.com/recurohq/webhook-as-a-service" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2">GitHub</a></span>
        </div>
      </footer>
    </div>
  );
}
