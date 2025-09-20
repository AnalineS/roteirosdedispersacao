import Link from "next/link";
import Image from "next/image";
import StaticEducationalLayout from "@/components/layout/StaticEducationalLayout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PersonaSelectorUnified from "@/components/home/PersonaSelectorUnified";
import TrustBadges from "@/components/home/TrustBadges";
import ClientToastContainer from "@/components/ui/ClientToastContainer";
import ClientAnalytics from "@/components/analytics/ClientAnalytics";
import GamificationWidget from "@/components/gamification/GamificationWidget";
import React, { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Force dynamic rendering for Cloud Run SSR
export const dynamic = "force-dynamic";

// Server-side components
import {
  HierarchyHeading,
  HierarchyText,
} from "@/components/layout/VisualHierarchyOptimizer";

// Components are now imported directly

// Icons
import {
  CheckIcon,
  ChatIcon,
  BookIcon,
  SupportIcon,
  TargetIcon,
  DoctorIcon,
  QuestionIcon,
  GovernmentIcon,
  HospitalIcon,
  UniversityIcon,
  AlertIcon,
  BulbIcon,
  HeartIcon,
  FamilyIcon,
  EmailIcon,
  ClipboardIcon,
  PillIcon,
} from "@/components/icons/FlatOutlineIcons";

export default function HomePage() {
  return (
    <StaticEducationalLayout>
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Trust Badges Section */}
      <section
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "0",
          padding: "2rem 0",
          margin: "0",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(1rem, 3vw, 4rem)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "2rem",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            <span
              style={{
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <GovernmentIcon size={16} color="#003366" /> Ministério da Saúde
            </span>
            <span>•</span>
            <span
              style={{
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <HospitalIcon size={16} color="#003366" /> Sistema Único de Saúde
              (SUS)
            </span>
            <span>•</span>
            <span
              style={{
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <UniversityIcon size={16} color="#003366" /> Universidade de
              Brasília (UnB)
            </span>
          </div>
        </div>
      </section>

      {/* Persona Selector - Client Component */}
      <Suspense
        fallback={
          <div
            style={{
              width: "100%",
              margin: "3rem auto",
              padding: "2.5rem clamp(1rem, 3vw, 4rem)",
              textAlign: "center",
            }}
          >
            <LoadingSpinner />
            <p>Carregando assistentes virtuais...</p>
          </div>
        }
      >
        <PersonaSelectorUnified />
      </Suspense>

      {/* Gamification Widget - Sistema de Progresso Educacional */}
      <section
        style={{
          width: "100%",
          margin: "2rem auto",
          padding: "0 clamp(1rem, 3vw, 4rem)",
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
                margin: "1rem 0",
              }}
            >
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          }
        >
          <GamificationWidget compact={true} className="max-w-4xl mx-auto" />
        </Suspense>
      </section>

      {/* Features Section Ativada */}
      <FeaturesSection />

      {/* Static Features Section */}
      <section
        style={{
          width: "100%",
          margin: "3rem auto",
          padding: "2rem clamp(1rem, 3vw, 4rem)",
        }}
      >
        <div
          className="text-center hierarchy-component"
          style={{ marginBottom: "3rem" }}
        >
          <HierarchyHeading
            level="h2"
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#003366",
              marginBottom: "1rem",
            }}
          >
            Recursos Educacionais
          </HierarchyHeading>
          <HierarchyText
            size="large"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              color: "#6b7280",
              fontSize: "1.125rem",
            }}
          >
            Ferramentas e conteúdo desenvolvidos para apoiar o cuidado
            farmacêutico na hanseníase
          </HierarchyText>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            marginTop: "2rem",
          }}
        >
          {/* Módulos Educacionais */}
          <Link
            href="/modules"
            style={{
              display: "block",
              padding: "2rem",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#003366",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookIcon size={24} color="white" />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#003366",
                  margin: 0,
                }}
              >
                Módulos Educacionais
              </h3>
            </div>
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.6",
                margin: "0 0 1rem 0",
              }}
            >
              Conteúdo estruturado sobre hanseníase, tratamento PQT-U e cuidado
              farmacêutico
            </p>
            {/* Features destacadas com ícones ativos */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                fontSize: "0.875rem",
                color: "#10b981",
                fontWeight: "500",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckIcon size={16} color="#10b981" />
                <span>Validado</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <TargetIcon size={16} color="#10b981" />
                <span>Focado</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <DoctorIcon size={16} color="#10b981" />
                <span>Profissional</span>
              </div>
            </div>
          </Link>

          {/* Recursos Práticos */}
          <Link
            href="/resources"
            style={{
              display: "block",
              padding: "2rem",
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
              borderRadius: "16px",
              border: "1px solid #e0f2fe",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#0284c7",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ClipboardIcon size={24} color="white" />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#0284c7",
                  margin: 0,
                }}
              >
                Recursos Práticos
              </h3>
            </div>
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.6",
                margin: "0 0 1rem 0",
              }}
            >
              Calculadora de doses, checklist de dispensação e ferramentas
              práticas
            </p>
            {/* Features destacadas com ícones ativos */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                fontSize: "0.875rem",
                color: "#0284c7",
                fontWeight: "500",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <PillIcon size={16} color="#0284c7" />
                <span>PQT-U</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <BulbIcon size={16} color="#0284c7" />
                <span>Inteligente</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <SupportIcon size={16} color="#0284c7" />
                <span>Suporte 24h</span>
              </div>
            </div>
          </Link>

          {/* Chat Interativo */}
          <Link
            href="/chat"
            style={{
              display: "block",
              padding: "2rem",
              background: "linear-gradient(135deg, #fef3e2 0%, #fde68a 100%)",
              borderRadius: "16px",
              border: "1px solid #fde68a",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#f59e0b",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChatIcon size={24} color="white" />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#92400e",
                  margin: 0,
                }}
              >
                Chat Interativo
              </h3>
            </div>
            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.6",
                margin: "0 0 1rem 0",
              }}
            >
              Converse com assistentes virtuais especializados em hanseníase
            </p>
            {/* Features destacadas com ícones ativos */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                fontSize: "0.875rem",
                color: "#92400e",
                fontWeight: "500",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <QuestionIcon size={16} color="#92400e" />
                <span>Dúvidas</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <HeartIcon size={16} color="#92400e" />
                <span>Cuidado</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <FamilyIcon size={16} color="#92400e" />
                <span>Humanizado</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Alertas e Status do Sistema */}
      <section
        style={{
          background: "linear-gradient(135deg, #fef9e7 0%, #fde68a 100%)",
          padding: "2rem 0",
          margin: "3rem 0",
          borderRadius: "16px",
          border: "1px solid #f59e0b",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(1rem, 3vw, 4rem)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <AlertIcon size={24} color="#f59e0b" />
            <HierarchyHeading
              level="h3"
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#92400e",
                margin: 0,
              }}
            >
              Status do Sistema
            </HierarchyHeading>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "2rem",
              fontSize: "0.9rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#10b981",
              }}
            >
              <CheckIcon size={16} color="#10b981" />
              <span>Sistema Operacional</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#10b981",
              }}
            >
              <HeartIcon size={16} color="#10b981" />
              <span>Monitoramento Ativo</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#10b981",
                marginTop: "0.5rem",
              }}
            >
              <Image
                src="/images/logo-sistema.png"
                alt="Sistema Certificado"
                width={16}
                height={16}
                style={{ borderRadius: "2px" }}
              />
              <span>Sistema Certificado</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#10b981",
              }}
            >
              <BulbIcon size={16} color="#10b981" />
              <span>IA Disponível</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Footer de Contato */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #003366 100%)",
          color: "white",
          padding: "3rem 0",
          marginTop: "4rem",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(1rem, 3vw, 4rem)",
            textAlign: "center",
          }}
        >
          <HierarchyHeading
            level="h2"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "white",
            }}
          >
            Precisa de Ajuda?
          </HierarchyHeading>
          <p
            style={{
              fontSize: "1.1rem",
              marginBottom: "2rem",
              color: "#cbd5e1",
            }}
          >
            Nossa equipe está disponível para apoiar profissionais de saúde
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <EmailIcon size={20} color="#cbd5e1" />
              <span>Disque Saúde: 136</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <HospitalIcon size={20} color="#cbd5e1" />
              <span>Unidade de Saúde mais próxima</span>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Container - Client Component */}
      <Suspense fallback={null}>
        <ClientToastContainer />
      </Suspense>

      {/* Analytics Components - Development Only */}
      <ClientAnalytics />
    </StaticEducationalLayout>
  );
}
