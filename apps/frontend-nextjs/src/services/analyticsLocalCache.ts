/**
 * Analytics Local Cache
 * Cache local para analytics com TTL
 */

import { LocalCache } from './simpleCache';

// Cache específico para analytics
export const analyticsLocalCache = new LocalCache('analytics', 5 * 60 * 1000);

// Exportações compatíveis
export default analyticsLocalCache;
export { analyticsLocalCache as analyticsCache };
export { analyticsLocalCache as AnalyticsLocalCache };
