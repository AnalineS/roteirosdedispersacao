'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import { Shield, Users, BarChart3, Settings, Database, Activity, Lock, AlertCircle } from 'lucide-react';

// Emails de administradores autorizados
const ADMIN_EMAILS = [
  'neeliogomes@hotmail.com',
  'sousa.analine@gmail.com',
  'roteirosdedispensacao@gmail.com',
  'neliogmoura@gmail.com',
];

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalConversations: number;
  avgResponseTime: number;
  systemHealth: 'operational' | 'degraded' | 'down';
  lastUpdate: Date;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeToday: 0,
    totalConversations: 0,
    avgResponseTime: 0,
    systemHealth: 'operational',
    lastUpdate: new Date(),
  });

  useEffect(() => {
    if (!loading) {
      // Verificar se o usuário está autenticado e é admin
      if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
      loadAdminStats();
    }
  }, [user, loading, router]);

  const loadAdminStats = async () => {
    // Simular carregamento de estatísticas
    // Em produção, isso viria de uma API
    setStats({
      totalUsers: 3247,
      activeToday: 156,
      totalConversations: 15892,
      avgResponseTime: 1.2,
      systemHealth: 'operational',
      lastUpdate: new Date(),
    });
  };

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
              +12% em relação ao mês anterior
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
              Média de 5.2 conversas/usuário
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
              {[
                { user: 'João Silva', action: 'Completou módulo', time: '5 min atrás' },
                { user: 'Maria Santos', action: 'Iniciou conversa com Dr. Gasnelio', time: '12 min atrás' },
                { user: 'Pedro Oliveira', action: 'Baixou material PDF', time: '18 min atrás' },
                { user: 'Ana Costa', action: 'Criou nova conta', time: '25 min atrás' },
                { user: 'Carlos Souza', action: 'Utilizou calculadora PQT-U', time: '32 min atrás' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}