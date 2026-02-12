'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import { Shield, Users, BarChart3, Settings, Database, Activity, Lock, AlertCircle } from 'lucide-react';

// Admin authorization checked via backend /api/v1/auth/role

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalConversations: number;
  avgResponseTime: number;
  systemHealth: 'operational' | 'degraded' | 'down';
  lastUpdate: Date;
}

interface RecentActivity {
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeToday: 0,
    totalConversations: 0,
    avgResponseTime: 0,
    systemHealth: 'operational',
    lastUpdate: new Date(),
  });

  const loadAdminStats = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;

      const res = await fetch('/api/v1/analytics/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStatsError(null);
        setStats({
          totalUsers: data.totalUsers || 0,
          activeToday: data.activeToday || 0,
          totalConversations: data.totalConversations || 0,
          avgResponseTime: data.avgResponseTime || 0,
          systemHealth: data.systemHealth || 'operational',
          lastUpdate: new Date(),
        });
      } else {
        setStatsError('Servico de estatisticas indisponivel. Os dados exibidos podem estar desatualizados.');
      }

      // Load recent activity from real endpoint
      try {
        const activityRes = await fetch('/api/v1/analytics/admin/recent-activity', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (activityData.success && Array.isArray(activityData.data)) {
            setRecentActivity(activityData.data);
          }
        }
      } catch {
        // Recent activity is non-critical - keep empty array
      }
    } catch {
      setStatsError('Nao foi possivel conectar ao servidor de estatisticas.');
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || !user.roles?.includes('admin')) {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
      loadAdminStats();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Acesso Restrito
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Você não tem permissão para acessar esta área administrativa.
          </p>
          <Link
            href="/"
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-gray-500">
                  Sistema de Gestão - Roteiros de Dispensação
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                stats.systemHealth === 'operational' 
                  ? 'bg-green-100 text-green-800'
                  : stats.systemHealth === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                Sistema {stats.systemHealth === 'operational' ? 'Operacional' : 
                        stats.systemHealth === 'degraded' ? 'Degradado' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {statsError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">{statsError}</p>
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers.toLocaleString('pt-BR')}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Usuarios registrados
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos Hoje</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeToday}
                </p>
              </div>
              <Activity className="w-12 h-12 text-green-500 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas Totais</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalConversations.toLocaleString('pt-BR')}
                </p>
              </div>
              <Database className="w-12 h-12 text-purple-500 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Total de feedbacks registrados
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.avgResponseTime}s
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-orange-500 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Média das últimas 24 horas
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Métricas detalhadas e relatórios
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gestão de Usuários</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gerenciar perfis e permissões
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/content"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Conteúdo</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Atualizar base de conhecimento
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/monitoring"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Monitoramento</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Status do sistema em tempo real
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/feedback"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Feedback</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Avaliações e sugestões dos usuários
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Configurações</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Preferências e integrações
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Atividade Recente
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma atividade recente registrada.
                </p>
              )}
              {recentActivity.map((activity, index) => (
                <div key={`${activity.userId}-${index}`} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}