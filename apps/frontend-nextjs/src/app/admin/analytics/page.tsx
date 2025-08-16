'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Analytics from '@/services/analytics';

// Placeholder component - será substituído por integração com Google Data Studio
export default function AnalyticsDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    avgSessionDuration: 0,
    topQuestions: [] as string[],
    personaUsage: {
      dr_gasnelio: 0,
      ga: 0,
    },
    peakHours: [] as number[],
    resolutionRate: 0,
    fallbackRate: 0,
  });

  useEffect(() => {
    // TODO: Verificar se usuário é admin
    // Por enquanto, simular dados para demonstração
    setIsAdmin(true);
    
    // Simular carregamento de métricas
    setMetrics({
      totalSessions: 1247,
      avgSessionDuration: 185, // segundos
      topQuestions: [
        'Como fazer o cálculo de dose para PQT-U?',
        'Quais são os efeitos colaterais da clofazimina?',
        'Como orientar paciente sobre manchas na pele?',
        'Protocolo para gestantes com hanseníase',
        'Diferença entre PQT-PB e PQT-MB',
      ],
      personaUsage: {
        dr_gasnelio: 723,
        ga: 524,
      },
      peakHours: [9, 10, 14, 15, 16, 20], // horas do dia
      resolutionRate: 87.5,
      fallbackRate: 12.5,
    });

    // Track page view
    Analytics.pageView('/admin/analytics', 'Dashboard Analytics');
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="mb-4">Esta página é apenas para administradores.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard de Analytics</h1>
        
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Sessões Totais"
            value={metrics.totalSessions.toLocaleString()}
            icon="📊"
          />
          <MetricCard
            title="Duração Média"
            value={`${Math.floor(metrics.avgSessionDuration / 60)}m ${metrics.avgSessionDuration % 60}s`}
            icon="⏱️"
          />
          <MetricCard
            title="Taxa de Resolução"
            value={`${metrics.resolutionRate}%`}
            icon="✅"
          />
          <MetricCard
            title="Taxa de Fallback"
            value={`${metrics.fallbackRate}%`}
            icon="⚠️"
          />
        </div>

        {/* Uso por Persona */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Uso por Persona</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.personaUsage.dr_gasnelio}
              </div>
              <div className="text-gray-600">Dr. Gasnelio</div>
              <div className="text-sm text-gray-500">
                {((metrics.personaUsage.dr_gasnelio / (metrics.personaUsage.dr_gasnelio + metrics.personaUsage.ga)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {metrics.personaUsage.ga}
              </div>
              <div className="text-gray-600">Gá</div>
              <div className="text-sm text-gray-500">
                {((metrics.personaUsage.ga / (metrics.personaUsage.dr_gasnelio + metrics.personaUsage.ga)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Perguntas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Top 5 Perguntas Mais Frequentes</h2>
          <ol className="space-y-2">
            {metrics.topQuestions.map((question, index) => (
              <li key={index} className="flex items-start">
                <span className="font-bold mr-2">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Horários de Pico */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Horários de Pico</h2>
          <div className="flex flex-wrap gap-2">
            {metrics.peakHours.map((hour) => (
              <span
                key={hour}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
              >
                {hour}:00
              </span>
            ))}
          </div>
        </div>

        {/* Google Data Studio Embed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard Completo</h2>
          <div className="bg-gray-100 p-8 rounded text-center">
            <p className="text-gray-600 mb-4">
              Para visualizar o dashboard completo com gráficos interativos,
              acesse o Google Data Studio:
            </p>
            <a
              href="https://datastudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Abrir Google Data Studio
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Configure seu ID de visualização no Google Data Studio para embedar aqui
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Métrica
function MetricCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}