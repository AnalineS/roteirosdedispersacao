"use client";

import { useState } from "react";
import { modernChatTheme } from "@/config/modernTheme";

export interface MedicalTerm {
  id: string;
  technical: string;
  simple: string;
  example?: string;
  pronunciation?: string;
  category: "medication" | "condition" | "procedure" | "anatomy" | "general";
}

const medicalTerms: MedicalTerm[] = [
  {
    id: "pqt-u",
    technical: "Poliquimioterapia Única (PQT-U)",
    simple: "Tratamento com vários remédios juntos",
    example:
      "É como tomar vitaminas diferentes ao mesmo tempo para tratar a hanseníase",
    pronunciation: "Po-li-qui-mio-te-ra-pia Ú-ni-ca",
    category: "medication",
  },
  {
    id: "hanseniase",
    technical: "Hanseníase",
    simple: "Doença de pele e nervos que tem cura",
    example: "Uma doença que pode ser completamente curada com remédios",
    pronunciation: "Han-se-ní-a-se",
    category: "condition",
  },
  {
    id: "mycobacterium-leprae",
    technical: "Mycobacterium leprae",
    simple: "Micróbio que causa a hanseníase",
    example: 'É o "bichinho" muito pequeno que causa a doença',
    pronunciation: "Mai-co-bac-té-ri-um lé-prae",
    category: "general",
  },
  {
    id: "dispensacao",
    technical: "Dispensação farmacêutica",
    simple: "Entrega do remédio com orientações",
    example: "Quando o farmacêutico te entrega o remédio e explica como tomar",
    pronunciation: "Dis-pen-sa-ção far-ma-cêu-ti-ca",
    category: "procedure",
  },
  {
    id: "farmacovigilancia",
    technical: "Farmacovigilância",
    simple: "Acompanhamento dos efeitos do remédio",
    example: "Como o médico observa se o remédio está fazendo bem ou mal",
    pronunciation: "Far-ma-co-vi-gi-lân-cia",
    category: "procedure",
  },
  {
    id: "rifampicina",
    technical: "Rifampicina",
    simple: "Remédio principal contra hanseníase",
    example:
      "O remédio mais importante do tratamento, que deixa a urina vermelha",
    pronunciation: "Ri-fam-pi-ci-na",
    category: "medication",
  },
  {
    id: "clofazimina",
    technical: "Clofazimina",
    simple: "Remédio que deixa a pele mais escura",
    example:
      "Um dos remédios do tratamento que pode escurecer a pele temporariamente",
    pronunciation: "Clo-fa-zi-mi-na",
    category: "medication",
  },
  {
    id: "dapsona",
    technical: "Dapsona",
    simple: "Remédio diário do tratamento",
    example: "O remédio que você toma todos os dias durante o tratamento",
    pronunciation: "Dap-so-na",
    category: "medication",
  },
  {
    id: "reacao-reversa",
    technical: "Reação reversa",
    simple: "Inflamação que pode aparecer durante o tratamento",
    example:
      "Quando a pele fica mais vermelha e dolorida, mas é sinal que o tratamento está funcionando",
    pronunciation: "Re-a-ção re-ver-sa",
    category: "condition",
  },
  {
    id: "eritema-nodoso",
    technical: "Eritema nodoso hansênico",
    simple: "Caroços doloridos na pele",
    example:
      'Quando aparecem "bolinhas" vermelhas e doloridas na pele durante o tratamento',
    pronunciation: "E-ri-te-ma no-do-so han-sê-ni-co",
    category: "condition",
  },
];

interface MedicalGlossaryProps {
  term?: string;
  inline?: boolean;
  showSearch?: boolean;
  maxResults?: number;
  compact?: boolean;
  children?: React.ReactNode;
}

export default function MedicalGlossary({
  term,
  inline = false,
  showSearch = true,
  maxResults = 5,
  compact = false,
  children,
}: MedicalGlossaryProps) {
  const [searchTerm, setSearchTerm] = useState(term || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filtrar termos baseado na pesquisa
  const filteredTerms = medicalTerms
    .filter((medicalTerm) => {
      const matchesSearch =
        searchTerm === "" ||
        medicalTerm.technical
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        medicalTerm.simple.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || medicalTerm.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .slice(0, maxResults);

  // Encontrar termo específico
  const specificTerm = medicalTerms.find(
    (t) =>
      t.technical.toLowerCase() === searchTerm.toLowerCase() ||
      t.simple.toLowerCase() === searchTerm.toLowerCase(),
  );

  // Renderização inline para termos específicos
  if (inline && specificTerm) {
    return (
      <span
        className="medical-term-inline"
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "none",
            border: "none",
            color: modernChatTheme.colors.unb.primary,
            textDecoration: "underline",
            cursor: "help",
            fontSize: "inherit",
            padding: 0,
          }}
          aria-expanded={isOpen}
          aria-describedby={`tooltip-${specificTerm.id}`}
          title={`Clique para ver explicação simples de "${specificTerm.technical}"`}
        >
          {children || specificTerm.technical}
        </button>

        {isOpen && (
          <div
            id={`tooltip-${specificTerm.id}`}
            role="tooltip"
            style={{
              position: "absolute",
              top: "100%",
              left: "0",
              zIndex: 1000,
              background: "white",
              border: `2px solid ${modernChatTheme.colors.unb.primary}`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.md,
              boxShadow: modernChatTheme.shadows.moderate,
              minWidth: "300px",
              maxWidth: "400px",
            }}
          >
            <div style={{ marginBottom: modernChatTheme.spacing.sm }}>
              <strong style={{ color: modernChatTheme.colors.unb.primary }}>
                Em linguagem simples:
              </strong>
            </div>
            <p
              style={{
                margin: 0,
                marginBottom: modernChatTheme.spacing.sm,
                fontSize: "16px",
                lineHeight: "1.5",
              }}
            >
              {specificTerm.simple}
            </p>

            {specificTerm.example && (
              <>
                <div
                  style={{
                    marginBottom: modernChatTheme.spacing.xs,
                    fontSize: "14px",
                    fontWeight: "600",
                    color: modernChatTheme.colors.neutral.textSecondary,
                  }}
                >
                  Exemplo:
                </div>
                <p
                  style={{
                    margin: 0,
                    marginBottom: modernChatTheme.spacing.sm,
                    fontSize: "14px",
                    fontStyle: "italic",
                    color: modernChatTheme.colors.neutral.textMuted,
                  }}
                >
                  {specificTerm.example}
                </p>
              </>
            )}

            {specificTerm.pronunciation && (
              <>
                <div
                  style={{
                    marginBottom: modernChatTheme.spacing.xs,
                    fontSize: "14px",
                    fontWeight: "600",
                    color: modernChatTheme.colors.neutral.textSecondary,
                  }}
                >
                  Como pronunciar:
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: modernChatTheme.colors.neutral.textMuted,
                  }}
                >
                  {specificTerm.pronunciation}
                </p>
              </>
            )}

            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: modernChatTheme.colors.neutral.textMuted,
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Fechar explicação"
              title="Fechar"
            >
              ×
            </button>
          </div>
        )}
      </span>
    );
  }

  // Renderização completa do glossário
  return (
    <div
      role="region"
      aria-label="Glossário de termos médicos"
      style={{
        background: "white",
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        padding: modernChatTheme.spacing.xl,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: modernChatTheme.spacing.lg,
          color: modernChatTheme.colors.unb.primary,
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        📚 Glossário Médico Acessível
      </h2>

      <p
        style={{
          margin: 0,
          marginBottom: modernChatTheme.spacing.lg,
          color: modernChatTheme.colors.neutral.textSecondary,
          fontSize: "16px",
          lineHeight: "1.5",
        }}
      >
        Entenda os termos médicos em linguagem simples e acessível.
      </p>

      {showSearch && (
        <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
          <label
            htmlFor="medical-search"
            style={{
              display: "block",
              marginBottom: modernChatTheme.spacing.sm,
              fontWeight: "600",
              color: modernChatTheme.colors.neutral.text,
            }}
          >
            Buscar termo médico:
          </label>
          <input
            id="medical-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o termo que deseja entender..."
            style={{
              width: "100%",
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: "16px",
            }}
            aria-describedby="search-help"
          />
          <div
            id="search-help"
            style={{
              fontSize: "14px",
              color: modernChatTheme.colors.neutral.textMuted,
              marginTop: modernChatTheme.spacing.xs,
            }}
          >
            Digite qualquer termo médico para encontrar sua explicação simples
          </div>
        </div>
      )}

      <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
        <label
          htmlFor="category-filter"
          style={{
            display: "block",
            marginBottom: modernChatTheme.spacing.sm,
            fontWeight: "600",
            color: modernChatTheme.colors.neutral.text,
          }}
        >
          Filtrar por categoria:
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: modernChatTheme.spacing.sm,
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.sm,
            fontSize: "14px",
            minWidth: "200px",
          }}
        >
          <option value="all">Todas as categorias</option>
          <option value="medication">Medicamentos</option>
          <option value="condition">Condições médicas</option>
          <option value="procedure">Procedimentos</option>
          <option value="general">Termos gerais</option>
        </select>
      </div>

      <div
        role="list"
        aria-label={`${filteredTerms.length} termos encontrados`}
      >
        {filteredTerms.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: modernChatTheme.spacing.xl,
              color: modernChatTheme.colors.neutral.textMuted,
            }}
          >
            <p>Nenhum termo encontrado. Tente uma busca diferente.</p>
          </div>
        ) : (
          filteredTerms.map((medicalTerm) => (
            <div
              key={medicalTerm.id}
              role="listitem"
              style={{
                marginBottom: modernChatTheme.spacing.lg,
                padding: modernChatTheme.spacing.lg,
                background: modernChatTheme.colors.background.secondary,
                borderRadius: modernChatTheme.borderRadius.md,
                border: `1px solid ${modernChatTheme.colors.neutral.borderLight}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: modernChatTheme.spacing.md,
                  marginBottom: modernChatTheme.spacing.sm,
                }}
              >
                <div
                  style={{
                    padding: "4px 8px",
                    background: modernChatTheme.colors.unb.primary,
                    color: "white",
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {medicalTerm.category}
                </div>
              </div>

              <h3
                style={{
                  margin: 0,
                  marginBottom: modernChatTheme.spacing.sm,
                  color: modernChatTheme.colors.unb.primary,
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {medicalTerm.technical}
              </h3>

              {medicalTerm.pronunciation && (
                <p
                  style={{
                    margin: 0,
                    marginBottom: modernChatTheme.spacing.sm,
                    fontSize: "14px",
                    color: modernChatTheme.colors.neutral.textMuted,
                    fontStyle: "italic",
                  }}
                >
                  Pronuncia: {medicalTerm.pronunciation}
                </p>
              )}

              <div
                style={{
                  marginBottom: modernChatTheme.spacing.xs,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: modernChatTheme.colors.neutral.textSecondary,
                }}
              >
                Em linguagem simples:
              </div>

              <p
                style={{
                  margin: 0,
                  marginBottom: medicalTerm.example
                    ? modernChatTheme.spacing.sm
                    : 0,
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: modernChatTheme.colors.neutral.text,
                }}
              >
                {medicalTerm.simple}
              </p>

              {medicalTerm.example && (
                <>
                  <div
                    style={{
                      marginBottom: modernChatTheme.spacing.xs,
                      fontSize: "14px",
                      fontWeight: "600",
                      color: modernChatTheme.colors.neutral.textSecondary,
                    }}
                  >
                    Exemplo prático:
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      lineHeight: "1.5",
                      color: modernChatTheme.colors.neutral.textMuted,
                      fontStyle: "italic",
                      background: "white",
                      padding: modernChatTheme.spacing.sm,
                      borderRadius: modernChatTheme.borderRadius.sm,
                      border: `1px solid ${modernChatTheme.colors.neutral.borderLight}`,
                    }}
                  >
                    {medicalTerm.example}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para uso inline em textos
export function GlossaryTerm({
  children,
  term,
}: {
  children: React.ReactNode;
  term: string;
}) {
  return (
    <MedicalGlossary term={term} inline={true} showSearch={false}>
      {children}
    </MedicalGlossary>
  );
}
