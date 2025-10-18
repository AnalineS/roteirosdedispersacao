/**
 * JWT Client - Comunicação com Backend Auth API
 * Substitui Firebase Auth por sistema JWT próprio
 * Uses centralized environment configuration
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import config from '@/config/environment';
import securityConfig from '@/config/security';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'email';
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface GoogleAuthResponse {
  authUrl: string;
  state: string;
}

class JWTClient {
  private api: AxiosInstance;
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private environment: string;

  constructor() {
    this.environment = config.environment;
    this.baseURL = config.api.baseUrl;

    this.api = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Environment-aware logging
    if (config.features.debug) {
      console.log(`[JWT Client] Initialized for ${this.environment} environment`);
      console.log(`[JWT Client] Base URL: ${this.baseURL}`);
      console.log(`[JWT Client] Timeout: ${config.api.timeout}ms`);
    }

    // Interceptor para adicionar token
    this.api.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Interceptor para refresh automático
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            // Retry original request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }
        throw error;
      }
    );

    // Carregar tokens do cookie
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = Cookies.get('auth_token') || null;
      this.refreshToken = Cookies.get('refresh_token') || null;
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      const isSecure = !config.isDevelopment; // Secure cookies for staging and production

      // Environment-aware cookie settings
      const cookieOptions = {
        secure: isSecure,
        sameSite: 'strict' as const,
        httpOnly: false, // Client needs access for API calls
        path: '/',
      };

      Cookies.set('auth_token', tokens.accessToken, {
        ...cookieOptions,
        expires: expiresAt,
      });

      // Refresh token with longer expiration
      const refreshExpiresAt = new Date(Date.now() + securityConfig.auth.refreshTimeout);
      Cookies.set('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        expires: refreshExpiresAt,
      });

      // Environment-aware logging
      if (securityConfig.development.verboseLogging) {
        console.log(`[JWT Client] Tokens saved for ${this.environment} environment`);
        console.log(`[JWT Client] Access token expires:`, expiresAt);
        console.log(`[JWT Client] Refresh token expires:`, refreshExpiresAt);
        console.log(`[JWT Client] Secure cookies:`, isSecure);
      }

      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    }
  }

  private clearTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Iniciar fluxo OAuth Google
   */
  async initiateGoogleAuth(): Promise<GoogleAuthResponse> {
    try {
      const response: AxiosResponse<GoogleAuthResponse> = await this.api.post('/auth/google/initiate');
      return response.data;
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      throw new Error('Failed to initiate Google authentication');
    }
  }

  /**
   * Completar fluxo OAuth Google
   */
  async completeGoogleAuth(code: string, state: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/google/callback', {
        code,
        state
      });

      this.saveTokensToStorage(response.data.tokens);
      return response.data;
    } catch (error) {
      console.error('Error completing Google auth:', error);
      throw new Error('Failed to complete Google authentication');
    }
  }

  /**
   * Login com email/senha (futuro)
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
        email,
        password
      });

      this.saveTokensToStorage(response.data.tokens);
      return response.data;
    } catch (error) {
      console.error('Error logging in with email:', error);
      throw new Error('Failed to login with email');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response: AxiosResponse<{ tokens: AuthTokens }> = await this.api.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });

      this.saveTokensToStorage(response.data.tokens);
      return response.data.tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokensFromStorage();
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Obter usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(updates: Partial<Pick<User, 'name' | 'picture'>>): Promise<User> {
    try {
      const response: AxiosResponse<{ user: User }> = await this.api.patch('/auth/profile', updates);
      return response.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.api.post('/auth/logout', {
          refreshToken: this.refreshToken
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokensFromStorage();
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Obter token atual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Cliente API autenticado
   */
  getAuthenticatedClient(): AxiosInstance {
    return this.api;
  }
}

// Singleton instance
export const jwtClient = new JWTClient();
export default jwtClient;