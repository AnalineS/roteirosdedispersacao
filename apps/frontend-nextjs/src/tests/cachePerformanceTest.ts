/**
 * Cache Performance Test Stub
 * Testes básicos de performance do cache
 */

interface PerformanceResult {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
}

export async function runCachePerformanceTest(): Promise<PerformanceResult[]> {
  const results: PerformanceResult[] = [];

  try {
    // Test localStorage write
    const start1 = performance.now();
    localStorage.setItem('test-cache-perf', JSON.stringify({ test: 'data' }));
    const end1 = performance.now();
    results.push({
      operation: 'localStorage.setItem',
      duration: end1 - start1,
      success: true
    });

    // Test localStorage read
    const start2 = performance.now();
    const data = localStorage.getItem('test-cache-perf');
    const end2 = performance.now();
    results.push({
      operation: 'localStorage.getItem',
      duration: end2 - start2,
      success: !!data
    });

    // Cleanup
    localStorage.removeItem('test-cache-perf');

  } catch (error) {
    results.push({
      operation: 'cache-test',
      duration: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

export default runCachePerformanceTest;