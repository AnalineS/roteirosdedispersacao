/**
 * Admin Analytics Page - ETAPA 5.1
 * Página administrativa para acesso ao dashboard de métricas
 * 
 * ROTA: /admin/analytics
 * FUNCIONALIDADES:
 * - Dashboard completo de métricas administrativas
 * - Controles de período e visualização
 * - Exportação de relatórios
 * - Autenticação administrativa (simulada)
 */

'use client';

import React, { useState, useEffect } from 'react';
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard';
import ABTestManager from '@/components/admin/ABTestManager';

// Simulação de autenticação administrativa
interface AdminAuth {
  isAuthenticated: boolean;
  user?: {
    name: string;
    role: 'admin' | 'manager' | 'analyst';
    permissions: string[];
  };
}

const AdminAnalyticsPage: React.FC = () => {
  const [auth, setAuth] = useState<AdminAuth>({ isAuthenticated: false });
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minuto
  const [activeTab, setActiveTab] = useState<'dashboard' | 'abtests'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulação de verificação de autenticação
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    // Em produção, verificar token/sessão administrativa
    // Para demonstração, simular autenticação bem-sucedida
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasAdminAccess = isDevelopment || localStorage.getItem('admin_access') === 'granted';
    
    if (hasAdminAccess) {
      setAuth({
        isAuthenticated: true,
        user: {
          name: 'Administrador do Sistema',
          role: 'admin',
          permissions: ['analytics', 'export', 'users', 'system']
        }
      });
    }
    
    setIsLoading(false);
  };

  const handleLogin = () => {
    // Simulação de login administrativo
    const password = prompt('Digite a senha administrativa:');
    
    // Em produção, verificar credenciais no backend
    if (password === 'admin123' || process.env.NODE_ENV === 'development') {
      localStorage.setItem('admin_access', 'granted');
      setAuth({
        isAuthenticated: true,
        user: {
          name: 'Administrador do Sistema',
          role: 'admin',
          permissions: ['analytics', 'export', 'users', 'system']
        }
      });
    } else {
      alert('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_access');
    setAuth({ isAuthenticated: false });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Acesso Administrativo
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Dashboard de Analytics - Roteiros de Dispensação
            </p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Autenticação Necessária
                </h3>
                <p className="text-gray-600 mb-6">
                  Acesso restrito a administradores do sistema
                </p>
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fazer Login Administrativo
              </button>
              
              <div className="mt-6 text-xs text-gray-500 text-center">
                <p>💡 Para desenvolvimento: senha = "admin123"</p>
                <p>🔒 Em produção: integração com sistema de autenticação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header administrativo */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🏥</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Roteiros de Dispensação - Admin
                </h1>
                <p className="text-sm text-gray-600">
                  {activeTab === 'dashboard' ? 'Dashboard de Analytics e Métricas' : 'Gerenciamento de Testes A/B'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Controls */}
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Período:</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="text-sm border rounded-md px-3 py-1 bg-white"
                >
                  <option value="day">Últimas 24h</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                  <option value="quarter">Último trimestre</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Atualização:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border rounded-md px-3 py-1 bg-white"
                >
                  <option value={30000}>30s</option>
                  <option value={60000}>1min</option>
                  <option value={300000}>5min</option>
                  <option value={0}>Manual</option>
                </select>
              </div>
              
              {/* User info */}
              <div className="flex items-center space-x-3 border-l pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {auth.user?.name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {auth.user?.role}
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded"
                  title="Sair"
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('abtests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'abtests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🧪 Testes A/B
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'dashboard' ? (
        <AdminAnalyticsDashboard
          timeframe={timeframe}
          refreshInterval={refreshInterval}
          showExportOptions={auth.user?.permissions.includes('export')}
        />
      ) : (
        <div className="p-6">
          <ABTestManager
            allowManagement={auth.user?.permissions.includes('analytics')}
            showDetailedStats={true}
          />
        </div>
      )}

      {/* Footer administrativo */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <p>© 2025 Roteiros de Dispensação - Tese de Doutorado UnB</p>
              <p>Sistema Administrativo - Monitoramento e Analytics</p>
            </div>
            <div className="text-right">
              <p>Versão: 1.0.0 | Build: {new Date().toISOString().split('T')[0]}</p>
              <p>Ambiente: {process.env.NODE_ENV || 'development'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

// NOTA: Metadata removida pois componente usa 'use client'
// Para SEO, considere criar um layout.tsx separado ou remover 'use client'