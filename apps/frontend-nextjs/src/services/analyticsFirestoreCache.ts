/**
 * Analytics Firestore Cache Stub
 * Substitui o sistema de cache Firebase Analytics
 */

import { FirestoreCache } from './firestoreCache';

// Cache específico para analytics
export const analyticsFirestoreCache = new FirestoreCache('analytics', 5 * 60 * 1000);

// Exportações compatíveis
export default analyticsFirestoreCache;
export { analyticsFirestoreCache as analyticsCache };
export { analyticsFirestoreCache as AnalyticsFirestoreCache };