export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDeadmanLoop, startCleanupLoop } = await import('./lib/background');
    startDeadmanLoop();
    startCleanupLoop();
  }
}
