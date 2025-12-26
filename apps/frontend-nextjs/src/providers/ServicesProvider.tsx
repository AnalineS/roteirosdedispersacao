"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useActiveServices } from "@/services/ActiveServicesHub";
import Analytics from "@/services/analytics";
import type {
  ServiceResponse,
  ServiceError,
} from "@/services/ActiveServicesHub";

// ============================================
// SERVICES PROVIDER CONTEXT
// ============================================

interface APIRequestData {
  [key: string]: unknown;
}

interface AnalyticsProperties {
  [key: string]: unknown;
}

interface ServicesContextType {
  // Hub de Serviços
  services: ReturnType<typeof useActiveServices>;

  // Estados
  isHealthy: boolean;
  lastHealthCheck: Date | null;

  // Métodos de conveniência
  callAPI: <T>(
    endpoint: string,
    method?: "GET" | "POST" | "PUT" | "DELETE",
    data?: APIRequestData,
  ) => Promise<ServiceResponse<T>>;
  trackAnalytics: (event: string, properties?: AnalyticsProperties) => void;

  // Status dos serviços
  servicesStatus: {
    api: boolean;
    analytics: boolean;
    auth: boolean;
  };
}

const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined,
);

// ============================================
// SERVICES PROVIDER COMPONENT
// ============================================

interface ServicesProviderProps {
  children: React.ReactNode;
}

export function ServicesProvider({ children }: ServicesProviderProps) {
  const services = useActiveServices();
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [servicesStatus, setServicesStatus] = useState({
    api: true,
    analytics: true,
    auth: true,
  });

  // ============================================
  // HEALTH MONITORING
  // ============================================

  const checkServicesHealth = useCallback(async () => {
    try {
      const healthResults = await services.performHealthCheck();

      setServicesStatus({
        api: services.isServiceHealthy("api"),
        analytics: services.isServiceHealthy("analytics"),
        auth: services.isServiceHealthy("auth"),
      });

      setLastHealthCheck(new Date());

      // Track health status
      Analytics.metrics({
        apiResponseTime: 0, // Será atualizado por outros métodos
        errorCount: Object.values(healthResults).filter((healthy) => !healthy)
          .length,
        fallbackCount: 0,
      });
    } catch (error) {
      console.error("Health check failed:", error);
      Analytics.exception(
        `Health check failed: ${(error as Error).message}`,
        false,
      );
    }
  }, [services]);

  // Health check periódico
  useEffect(() => {
    if (services.isInitialized) {
      // Health check inicial
      checkServicesHealth();

      // Health check periódico (5 minutos)
      const interval = setInterval(checkServicesHealth, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [services.isInitialized, checkServicesHealth]);

  // ============================================
  // API CONVENIENCE METHODS
  // ============================================

  const callAPI = async <T,>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: APIRequestData,
  ): Promise<ServiceResponse<T>> => {
    const startTime = Date.now();

    try {
      const apiMethod = services.api[
        method.toLowerCase() as keyof typeof services.api
      ] as Function;
      const result = (await apiMethod(endpoint, data)) as ServiceResponse<T>;

      // Track successful API call
      const duration = Date.now() - startTime;
      Analytics.timing("api", endpoint, duration);
      Analytics.metrics({
        apiResponseTime: duration,
        errorCount: 0,
        fallbackCount: 0,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      Analytics.exception(
        `API call failed: ${endpoint} - ${(error as Error).message}`,
        false,
      );
      Analytics.metrics({
        apiResponseTime: duration,
        errorCount: 1,
        fallbackCount: 0,
      });

      throw error;
    }
  };

  const trackAnalytics = (
    event: string,
    properties: AnalyticsProperties = {},
  ) => {
    // Track no GA4
    Analytics.event("USER", event, JSON.stringify(properties));

    // Track via services hub
    services.analytics
      .track(event, {
        ...properties,
        timestamp: Date.now(),
        service: "frontend",
      })
      .catch((error) => {
        console.warn("Failed to track analytics via services hub:", error);
      });
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: ServicesContextType = {
    services,
    isHealthy: Object.values(servicesStatus).every((status) => status),
    lastHealthCheck,
    callAPI,
    trackAnalytics,
    servicesStatus,
  };

  return (
    <ServicesContext.Provider value={contextValue}>
      {children}
    </ServicesContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useServices(): ServicesContextType {
  const context = useContext(ServicesContext);

  // SSR-safe: Only throw error if we're in browser and context is missing
  if (context === undefined && typeof window !== "undefined") {
    throw new Error("useServices must be used within a ServicesProvider");
  }

  // Return a default context for SSR
  if (context === undefined) {
    // Retorna um objeto mínimo mas válido para SSR funcionar
    return {
      services: {
        // Status
        isInitialized: false,
        healthStatus: {},

        // Core methods
        callService: async <T,>() => ({
          data: {} as T,
          status: 503,
          message: "SSR",
          timestamp: Date.now(),
          cached: false,
        }),
        callIntegration: async <T,>() => ({}) as T,
        performHealthCheck: async () => ({}),

        // Specialized services
        api: {
          get: async <T,>() => ({
            data: {} as T,
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          post: async <T,>() => ({
            data: {} as T,
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          put: async <T,>() => ({
            data: {} as T,
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          delete: async <T,>() => ({
            data: {} as T,
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
        },
        auth: {
          login: async () => ({
            data: { success: false },
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          logout: async () => ({
            data: {},
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          refresh: async () => ({
            data: {},
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          verify: async () => ({
            data: { valid: false },
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
        },
        analytics: {
          track: async () => ({
            data: {},
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          page: async () => ({
            data: {},
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
          identify: async () => ({
            data: {},
            status: 503,
            message: "SSR",
            timestamp: Date.now(),
            cached: false,
          }),
        },

        // Management
        registerService: () => {},
        registerIntegration: () => {},
        getStats: (serviceName?: string) => {
          if (serviceName) {
            return {
              service: undefined,
              circuitBreaker: undefined,
              rateLimit: undefined,
              cacheEntries: 0,
            };
          }
          return {
            totalServices: 0,
            totalIntegrations: 0,
            totalCacheEntries: 0,
            circuitBreakers: {},
            rateLimits: {},
          };
        },
        clearCache: () => {},
        resetCircuitBreaker: () => {},

        // Utilities
        isServiceHealthy: () => false,
        getAllServices: () => [],
        getAllIntegrations: () => [],
      },
      isHealthy: false,
      lastHealthCheck: null,
      callAPI: async <T,>() => ({
        data: {} as T,
        status: 503,
        message: "SSR",
        timestamp: Date.now(),
        cached: false,
      }),
      trackAnalytics: () => {},
      servicesStatus: {
        api: false,
        analytics: false,
        auth: false,
      },
    };
  }

  return context;
}

// ============================================
// HIGH-ORDER COMPONENT
// ============================================

export function withServices<P extends object>(
  Component: React.ComponentType<P>,
) {
  const WithServicesComponent = (props: P) => {
    return (
      <ServicesProvider>
        <Component {...props} />
      </ServicesProvider>
    );
  };

  WithServicesComponent.displayName = `withServices(${Component.displayName || Component.name})`;
  return WithServicesComponent;
}

// ============================================
// UTILITY HOOKS
// ============================================

// Hook para chamadas de API simples
export function useAPI() {
  const { callAPI } = useServices();

  return {
    get: <T,>(endpoint: string) => callAPI<T>(endpoint, "GET"),
    post: <T,>(endpoint: string, data: APIRequestData) =>
      callAPI<T>(endpoint, "POST", data),
    put: <T,>(endpoint: string, data: APIRequestData) => callAPI<T>(endpoint, "PUT", data),
    delete: <T,>(endpoint: string) => callAPI<T>(endpoint, "DELETE"),
  };
}

// Hook para analytics
export function useAnalytics() {
  const { trackAnalytics } = useServices();

  return {
    track: trackAnalytics,
    trackPageView: (path: string, title?: string) => {
      Analytics.pageView(path, title);
      trackAnalytics("page_view", { path, title });
    },
    trackUserAction: (action: string, category = "user", properties = {}) => {
      trackAnalytics(`${category}_${action}`, properties);
    },
    trackEducational: (
      moduleId: string,
      action: "start" | "complete",
      score?: number,
    ) => {
      Analytics.education(moduleId, action === "complete", score);
      trackAnalytics(`module_${action}`, { moduleId, score });
    },
    trackPersona: (persona: string, action: string, properties = {}) => {
      trackAnalytics(`persona_${action}`, { persona, ...properties });
    },
  };
}

// Hook para status dos serviços
export function useServicesHealth() {
  const { servicesStatus, isHealthy, lastHealthCheck } = useServices();

  return {
    isHealthy,
    lastHealthCheck,
    services: servicesStatus,
    api: servicesStatus.api,
    analytics: servicesStatus.analytics,
    auth: servicesStatus.auth,
  };
}

export default ServicesProvider;
