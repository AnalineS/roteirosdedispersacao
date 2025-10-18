'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContextHub';
import { useSimpleTrack } from '@/components/tracking/IntegratedTrackingProvider';

// ============================================
// TYPES PARA SERVICES
// ============================================

export interface ServiceConfig {
  name: string;
  endpoint?: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  rateLimit?: { requests: number; window: number };
  auth?: boolean;
  transform?: {
    request?: <T>(data: T) => unknown;
    response?: <T>(data: T) => unknown;
  };
}

export interface ServiceResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: number;
  cached: boolean;
  retryCount?: number;
}

export interface ServiceError {
  code: string;
  message: string;
  status?: number;
  timestamp: number;
  service: string;
  retryable: boolean;
}

export interface IntegrationConfig {
  name: string;
  type: 'rest' | 'graphql' | 'websocket' | 'webhook';
  url: string;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'api-key' | 'basic';
    token?: string;
    username?: string;
    password?: string;
  };
  healthCheck?: string;
  fallback?: {
    endpoint?: string;
    staticData?: unknown;
    handler?: () => unknown;
  };
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  maxAge: number;
}

interface APIPayload {
  [key: string]: unknown;
}

interface RequestData {
  [key: string]: unknown;
}

// ============================================
// ACTIVE SERVICES HUB
// ============================================

class ActiveServicesHub {
  private static instance: ActiveServicesHub;
  private services = new Map<string, ServiceConfig>();
  private integrations = new Map<string, IntegrationConfig>();
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, { count: number; window: number; lastReset: number }>();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; state: 'open' | 'closed' | 'half-open' }>();

  static getInstance(): ActiveServicesHub {
    if (!ActiveServicesHub.instance) {
      ActiveServicesHub.instance = new ActiveServicesHub();
    }
    return ActiveServicesHub.instance;
  }

  // ============================================
  // SERVICE MANAGEMENT
  // ============================================

  registerService(config: ServiceConfig): void {
    this.services.set(config.name, config);
    
    // Initialize circuit breaker
    this.circuitBreakers.set(config.name, {
      failures: 0,
      lastFailure: 0,
      state: 'closed'
    });

    // Initialize rate limit
    if (config.rateLimit) {
      this.rateLimits.set(config.name, {
        count: 0,
        window: config.rateLimit.window,
        lastReset: Date.now()
      });
    }
  }

  unregisterService(name: string): boolean {
    const deleted = this.services.delete(name);
    this.circuitBreakers.delete(name);
    this.rateLimits.delete(name);
    return deleted;
  }

  // ============================================
  // INTEGRATION MANAGEMENT
  // ============================================

  registerIntegration(config: IntegrationConfig): void {
    this.integrations.set(config.name, config);
  }

  unregisterIntegration(name: string): boolean {
    return this.integrations.delete(name);
  }

  // ============================================
  // HTTP CLIENT
  // ============================================

  async request<T = unknown>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    endpoint: string = '',
    data?: RequestData,
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    // Check circuit breaker
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker && breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure < 60000) { // 1 minute timeout
        throw new Error(JSON.stringify({
          code: 'CIRCUIT_BREAKER_OPEN',
          message: 'Service temporarily unavailable',
          service: serviceName,
          retryable: false,
          timestamp: Date.now()
        }));
      } else {
        breaker.state = 'half-open';
      }
    }

    // Check rate limit
    if (service.rateLimit) {
      const rateLimit = this.rateLimits.get(serviceName);
      if (rateLimit) {
        const now = Date.now();
        
        // Reset window if needed
        if (now - rateLimit.lastReset > rateLimit.window) {
          rateLimit.count = 0;
          rateLimit.lastReset = now;
        }

        if (rateLimit.count >= service.rateLimit.requests) {
          throw new Error(JSON.stringify({
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            service: serviceName,
            retryable: true,
            timestamp: Date.now()
          }));
        }

        rateLimit.count++;
      }
    }

    // Check cache for GET requests
    const cacheKey = `${serviceName}_${method}_${endpoint}_${JSON.stringify(data)}`;
    if (method === 'GET' && service.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.maxAge) {
        return {
          data: cached.data as T,
          status: 200,
          message: 'Success (cached)',
          timestamp: cached.timestamp,
          cached: true
        };
      }
    }

    const url = service.endpoint ? `${service.endpoint}${endpoint}` : endpoint;
    let requestData = data;

    // Transform request
    if (service.transform?.request && data) {
      requestData = service.transform.request(data) as RequestData;
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (requestData && method !== 'GET') {
      requestOptions.body = JSON.stringify(requestData);
    }

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), service.timeout || 10000);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let responseData = await response.json();

      // Transform response
      if (service.transform?.response) {
        responseData = service.transform.response(responseData);
      }

      // Cache successful GET requests
      if (method === 'GET' && service.cache) {
        this.cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now(),
          maxAge: 5 * 60 * 1000 // 5 minutes default
        });
      }

      // Reset circuit breaker on success
      if (breaker) {
        breaker.failures = 0;
        breaker.state = 'closed';
      }

      return {
        data: responseData,
        status: response.status,
        message: 'Success',
        timestamp: Date.now(),
        cached: false
      };

    } catch (error) {
      clearTimeout(timeout);

      // Handle circuit breaker
      if (breaker) {
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        if (breaker.failures >= 5) {
          breaker.state = 'open';
        }
      }

      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      const errorName = error instanceof Error ? error.name : 'REQUEST_FAILED';
      const errorStatus = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : undefined;

      throw new Error(JSON.stringify({
        code: errorName,
        message: errorMessage,
        service: serviceName,
        retryable: true,
        timestamp: Date.now(),
        status: errorStatus
      }));
    }
  }

  // ============================================
  // INTEGRATION METHODS
  // ============================================

  async callIntegration<T>(integrationName: string, payload?: APIPayload): Promise<T> {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      throw new Error(`Integration '${integrationName}' not found`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...integration.headers
    };

    // Add authentication
    if (integration.auth) {
      switch (integration.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${integration.auth.token}`;
          break;
        case 'api-key':
          headers['X-API-Key'] = integration.auth.token || '';
          break;
        case 'basic':
          const credentials = btoa(`${integration.auth.username}:${integration.auth.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          break;
      }
    }

    try {
      const response = await fetch(integration.url, {
        method: payload ? 'POST' : 'GET',
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      if (!response.ok) {
        throw new Error(`Integration ${integrationName} failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (integration.fallback) {
        return integration.fallback as T;
      }
      throw error;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, integration] of this.integrations.entries()) {
      if (integration.healthCheck) {
        try {
          const response = await fetch(integration.healthCheck, { method: 'GET' });
          results[name] = response.ok;
        } catch {
          results[name] = false;
        }
      }
    }

    return results;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getServiceStats(serviceName?: string): {
    totalServices?: number;
    totalIntegrations?: number;
    totalCacheEntries?: number;
    circuitBreakers?: Record<string, unknown>;
    rateLimits?: Record<string, unknown>;
    service?: ServiceConfig | undefined;
    circuitBreaker?: unknown;
    rateLimit?: unknown;
    cacheEntries?: number;
  } {
    if (serviceName) {
      const service = this.services.get(serviceName);
      const breaker = this.circuitBreakers.get(serviceName);
      const rateLimit = this.rateLimits.get(serviceName);

      return {
        service,
        circuitBreaker: breaker,
        rateLimit,
        cacheEntries: Array.from(this.cache.keys()).filter(key => key.startsWith(serviceName)).length
      };
    }

    return {
      totalServices: this.services.size,
      totalIntegrations: this.integrations.size,
      totalCacheEntries: this.cache.size,
      circuitBreakers: Object.fromEntries(this.circuitBreakers.entries()),
      rateLimits: Object.fromEntries(this.rateLimits.entries())
    };
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  resetCircuitBreaker(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      breaker.lastFailure = 0;
    }
  }
}

// ============================================
// HOOK PARA SERVICES ATIVOS
// ============================================

export const useActiveServices = () => {
  const [servicesHub] = useState(() => ActiveServicesHub.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const globalContext = useGlobalContext();
  const tracking = useSimpleTrack();
  const healthCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    if (!isInitialized) {
      // Register default services
      servicesHub.registerService({
        name: 'api',
        endpoint: '/api',
        timeout: 10000,
        retries: 3,
        cache: true,
        rateLimit: { requests: 100, window: 60000 }
      });

      servicesHub.registerService({
        name: 'auth',
        endpoint: '/api/auth',
        timeout: 5000,
        retries: 1,
        cache: false,
        auth: true
      });

      servicesHub.registerService({
        name: 'analytics',
        endpoint: '/api/analytics',
        timeout: 15000,
        retries: 2,
        cache: true,
        rateLimit: { requests: 50, window: 60000 }
      });

      // Register integrations
      servicesHub.registerIntegration({
        name: 'google-analytics',
        type: 'rest',
        url: 'https://www.google-analytics.com',
        healthCheck: 'https://www.google.com'
      });

      servicesHub.registerIntegration({
        name: 'external-api',
        type: 'rest',
        url: process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'https://api.example.com',
        headers: {
          'User-Agent': 'PQT-U Educational Platform'
        }
      });

      setIsInitialized(true);

      // Track initialization
      const stats = servicesHub.getServiceStats();
      tracking.track('click', 'services_initialized', {
        services: stats.totalServices || 0,
        integrations: stats.totalIntegrations || 0
      });
    }
  }, [isInitialized, servicesHub, tracking]);

  // ============================================
  // HEALTH MONITORING
  // ============================================

  const performHealthCheck = useCallback(async () => {
    try {
      const status = await servicesHub.healthCheck();
      setHealthStatus(status);
      
      const unhealthyServices = Object.entries(status)
        .filter(([_, healthy]) => !healthy)
        .map(([name]) => name);

      if (unhealthyServices.length > 0) {
        globalContext.addError({
          message: `Unhealthy services: ${unhealthyServices.join(', ')}`,
          context: 'health-check',
          severity: 'medium'
        });
      }

      return status;
    } catch (error) {
      globalContext.addError({
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        context: 'health-check',
        severity: 'high'
      });
      return {};
    }
  }, [servicesHub, globalContext]);

  useEffect(() => {
    if (isInitialized) {
      // Initial health check
      performHealthCheck();

      // Set up periodic health checks
      healthCheckInterval.current = setInterval(performHealthCheck, 5 * 60 * 1000); // 5 minutes

      return () => {
        if (healthCheckInterval.current) {
          clearInterval(healthCheckInterval.current);
        }
      };
    }
  }, [isInitialized, performHealthCheck]);

  // ============================================
  // SERVICE METHODS
  // ============================================

  const callService = useCallback(async <T>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    endpoint: string = '',
    data?: RequestData,
    options?: RequestInit
  ): Promise<ServiceResponse<T>> => {
    try {
      const result = await servicesHub.request<T>(serviceName, method, endpoint, data, options);
      
      tracking.track('click', 'service_call_success', {
        service: serviceName,
        method,
        endpoint,
        cached: result.cached
      });

      return result;
    } catch (error) {
      tracking.trackError('service_call_failed', error instanceof Error ? error.message : String(error), serviceName);
      throw error;
    }
  }, [servicesHub, tracking]);

  const callIntegration = useCallback(async <T>(
    integrationName: string,
    payload?: APIPayload
  ): Promise<T> => {
    try {
      const result = await servicesHub.callIntegration<T>(integrationName, payload);
      
      tracking.track('click', 'integration_call_success', {
        integration: integrationName,
        hasPayload: !!payload
      });

      return result;
    } catch (error) {
      tracking.trackError('integration_call_failed', error instanceof Error ? error.message : String(error), integrationName);
      throw error;
    }
  }, [servicesHub, tracking]);

  // ============================================
  // SPECIALIZED SERVICES
  // ============================================

  const apiService = useMemo(() => ({
    get: <T>(endpoint: string, options?: RequestInit) => 
      callService<T>('api', 'GET', endpoint, undefined, options),
    post: <T>(endpoint: string, data: RequestData, options?: RequestInit) => 
      callService<T>('api', 'POST', endpoint, data, options),
    put: <T>(endpoint: string, data: RequestData, options?: RequestInit) => 
      callService<T>('api', 'PUT', endpoint, data, options),
    delete: <T>(endpoint: string, options?: RequestInit) => 
      callService<T>('api', 'DELETE', endpoint, undefined, options)
  }), [callService]);

  const authService = useMemo(() => ({
    login: (credentials: { username: string; password: string }) =>
      callService('auth', 'POST', '/login', credentials),
    logout: () =>
      callService('auth', 'POST', '/logout'),
    refresh: () =>
      callService('auth', 'POST', '/refresh'),
    verify: (token: string) =>
      callService('auth', 'POST', '/verify', { token })
  }), [callService]);

  const analyticsService = useMemo(() => ({
    track: (event: string, properties: Record<string, any>) =>
      callService('analytics', 'POST', '/track', { event, properties }),
    identify: (userId: string, traits: Record<string, any>) =>
      callService('analytics', 'POST', '/identify', { userId, traits }),
    page: (name: string, properties: Record<string, any>) =>
      callService('analytics', 'POST', '/page', { name, properties })
  }), [callService]);

  // ============================================
  // MANAGEMENT METHODS
  // ============================================

  const registerService = useCallback((config: ServiceConfig) => {
    servicesHub.registerService(config);
    
    tracking.track('click', 'service_registered', {
      name: config.name,
      hasEndpoint: !!config.endpoint,
      hasCache: !!config.cache,
      hasRateLimit: !!config.rateLimit
    });
  }, [servicesHub, tracking]);

  const registerIntegration = useCallback((config: IntegrationConfig) => {
    servicesHub.registerIntegration(config);
    
    tracking.track('click', 'integration_registered', {
      name: config.name,
      type: config.type,
      hasAuth: !!config.auth,
      hasHealthCheck: !!config.healthCheck
    });
  }, [servicesHub, tracking]);

  const getStats = useCallback((serviceName?: string) => {
    return servicesHub.getServiceStats(serviceName);
  }, [servicesHub]);

  const clearCache = useCallback((pattern?: string) => {
    servicesHub.clearCache(pattern);
    tracking.track('click', 'cache_cleared', { pattern: pattern || 'all' });
  }, [servicesHub, tracking]);

  const resetCircuitBreaker = useCallback((serviceName: string) => {
    servicesHub.resetCircuitBreaker(serviceName);
    tracking.track('click', 'circuit_breaker_reset', { service: serviceName });
  }, [servicesHub, tracking]);

  // ============================================
  // RETURN INTERFACE
  // ============================================

  return {
    // Status
    isInitialized,
    healthStatus,
    
    // Core methods
    callService,
    callIntegration,
    performHealthCheck,
    
    // Specialized services
    api: apiService,
    auth: authService,
    analytics: analyticsService,
    
    // Management
    registerService,
    registerIntegration,
    getStats,
    clearCache,
    resetCircuitBreaker,
    
    // Utilities
    isServiceHealthy: (serviceName: string) => healthStatus[serviceName] !== false,
    getAllServices: () => Array.from(servicesHub['services'].keys()),
    getAllIntegrations: () => Array.from(servicesHub['integrations'].keys())
  };
};