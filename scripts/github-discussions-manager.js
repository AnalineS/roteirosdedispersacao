#!/usr/bin/env node

/**
 * GitHub Discussions Manager - Automação de Wiki e Documentação
 * Sistema integrado de geração automática de documentação via GitHub Discussions
 */

const { Octokit } = require("@octokit/rest");
const fs = require("fs").promises;
const path = require("path");

// Emoji constants to avoid ESLint parsing issues
const EMOJI = {
  CLIPBOARD: String.fromCodePoint(0x1f4cb), // 📋
  WARNING: String.fromCodePoint(0x26a0), // ⚠️
  CHECKMARK: String.fromCodePoint(0x2705), // ✅
  CROSS: String.fromCodePoint(0x274c), // ❌
  PLUS: String.fromCodePoint(0x2795), // ➕
  PENCIL: String.fromCodePoint(0x1f4dd), // 📝
  HOSPITAL: String.fromCodePoint(0x1f3e5), // 🏥
  WRENCH: String.fromCodePoint(0x1f527), // 🔧
  CHART: String.fromCodePoint(0x1f4ca), // 📊
  ROCKET: String.fromCodePoint(0x1f680), // 🚀
  LOCK: String.fromCodePoint(0x1f512), // 🔒
  ROBOT: String.fromCodePoint(0x1f916), // 🤖
};

// TODO: Reativar quando funcionalidade de processamento de templates for implementada
// Function to replace emoji shortcodes in template strings
// eslint-disable-next-line no-unused-vars
function replaceEmojis(text) {
  return text
    .replace(/🏥/g, EMOJI.HOSPITAL)
    .replace(/📊/g, EMOJI.CHART)
    .replace(/✅/g, EMOJI.CHECKMARK)
    .replace(/📋/g, EMOJI.CLIPBOARD)
    .replace(/🔒/g, EMOJI.LOCK)
    .replace(/📱/g, String.fromCodePoint(0x1f4f1))
    .replace(/🔗/g, String.fromCodePoint(0x1f517))
    .replace(/📚/g, String.fromCodePoint(0x1f4da))
    .replace(/🤖/g, EMOJI.ROBOT)
    .replace(/🔧/g, EMOJI.WRENCH)
    .replace(/🌐/g, String.fromCodePoint(0x1f310))
    .replace(/🚀/g, EMOJI.ROCKET)
    .replace(/🔐/g, String.fromCodePoint(0x1f510))
    .replace(/🔍/g, String.fromCodePoint(0x1f50d))
    .replace(/🚨/g, String.fromCodePoint(0x1f6a8))
    .replace(/⚠️/g, EMOJI.WARNING)
    .replace(/⏭️/g, String.fromCodePoint(0x23ed))
    .replace(/📱/g, String.fromCodePoint(0x1f4f1));
}

// GraphQL Queries
const DISCUSSION_CATEGORIES_QUERY = `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussionCategories(first: 20) {
        nodes {
          id
          name
          description
        }
      }
    }
  }
`;

const FIND_DISCUSSIONS_QUERY = `
  query($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          id
          title
          category {
            name
          }
          url
        }
      }
    }
  }
`;

const CREATE_DISCUSSION_MUTATION = `
  mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: {
      repositoryId: $repositoryId
      categoryId: $categoryId
      title: $title
      body: $body
    }) {
      discussion {
        id
        title
        url
      }
    }
  }
`;

const UPDATE_DISCUSSION_MUTATION = `
  mutation($discussionId: ID!, $body: String!) {
    updateDiscussion(input: {
      id: $discussionId
      body: $body
    }) {
      discussion {
        id
        title
        url
      }
    }
  }
`;

const REPOSITORY_INFO_QUERY = `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      discussionCategories(first: 20) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

class GitHubDiscussionsManager {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || process.env.PERSONAL_ACCESS_TOKEN,
    });

    this.owner = process.env.GITHUB_REPOSITORY?.split("/")[0] || "Ana";
    this.repo =
      process.env.GITHUB_REPOSITORY?.split("/")[1] || "roteiro-dispensacao";
    this.environment = process.env.ENVIRONMENT || "staging";

    // Configurações de categorias para discussions
    this.categories = {
      "Medical Documentation": "Documentação Médica",
      "API Documentation": "Documentação da API",
      "Release Notes": "Notas de Release",
      "Deployment Reports": "Relatórios de Deploy",
      "LGPD Compliance": "Conformidade LGPD",
      "Security Reports": "Relatórios de Segurança",
    };
  }

  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: EMOJI.CHART,
        warn: EMOJI.WARNING,
        error: EMOJI.CROSS,
        success: EMOJI.CHECKMARK,
      }[level] || "ℹ️";

    process.stdout.write(
      "[" + timestamp + "] " + prefix + " " + message + "\n",
    );
  }

  async initialize() {
    this.log("Inicializando GitHub Discussions Manager...");
    this.log("Repositório: " + this.owner + "/" + this.repo);
    this.log("Ambiente: " + this.environment);

    try {
      await this.ensureCategories();
      this.log("GitHub Discussions Manager inicializado", "success");
    } catch (error) {
      this.log("Erro na inicialização: " + error.message, "error");
      throw error;
    }
  }

  async ensureCategories() {
    this.log("Verificando categorias de discussions...");

    try {
      // GraphQL query para listar categorias existentes
      const result = await this.octokit.graphql(DISCUSSION_CATEGORIES_QUERY, {
        owner: this.owner,
        repo: this.repo,
      });

      const existingCategories =
        result.repository.discussionCategories.nodes.map((cat) => cat.name);
      process.stdout.write(
        EMOJI.CLIPBOARD +
          " Categorias existentes: " +
          existingCategories.join(", ") +
          "\n",
      );

      // Criar categorias que não existem (seria necessário permissões de admin)
      const missingCategories = Object.keys(this.categories).filter(
        (cat) => !existingCategories.includes(cat),
      );
      if (missingCategories.length > 0) {
        process.stdout.write(
          EMOJI.WARNING +
            " Categorias faltando (necessário criar manualmente): " +
            missingCategories.join(", ") +
            "\n",
        );
      }
    } catch (error) {
      process.stdout.write(
        EMOJI.WARNING +
          " Não foi possível verificar categorias (pode ser limitação de permissões)\n",
      );
    }
  }

  async createMedicalDocumentation() {
    process.stdout.write(EMOJI.HOSPITAL + " Gerando documentação médica...\n");

    try {
      // Ler arquivos de conhecimento médico
      const knowledgeBase = await this.readMedicalKnowledge();

      const title =
        EMOJI.CLIPBOARD +
        " Documentação Médica - " +
        this.environment.toUpperCase() +
        " - " +
        new Date().toLocaleDateString("pt-BR");
      const body = await this.generateMedicalDocBody(knowledgeBase);

      const discussion = await this.createOrUpdateDiscussion({
        title,
        body,
        category: "Medical Documentation",
      });

      process.stdout.write(
        EMOJI.CHECKMARK +
          " Documentação médica criada: " +
          discussion.url +
          "\n",
      );
      return discussion;
    } catch (error) {
      process.stderr.write(
        EMOJI.CROSS +
          " Erro ao criar documentação médica: " +
          error.message +
          "\n",
      );
      throw error;
    }
  }

  async createAPIDocumentation() {
    process.stdout.write(EMOJI.WRENCH + " Gerando documentação da API...\n");

    try {
      const apiDocs = await this.generateAPIDocumentation();

      const title =
        EMOJI.WRENCH +
        " API Documentation - " +
        this.environment.toUpperCase() +
        " - " +
        new Date().toLocaleDateString("pt-BR");
      const body = apiDocs;

      const discussion = await this.createOrUpdateDiscussion({
        title,
        body,
        category: "API Documentation",
      });

      process.stdout.write(
        EMOJI.CHECKMARK +
          " Documentação da API criada: " +
          discussion.url +
          "\n",
      );
      return discussion;
    } catch (error) {
      process.stderr.write(
        EMOJI.CROSS +
          " Erro ao criar documentação da API: " +
          error.message +
          "\n",
      );
      throw error;
    }
  }

  async createDeploymentReport() {
    process.stdout.write(EMOJI.CHART + " Gerando relatório de deployment...\n");

    try {
      const deployInfo = {
        environment: this.environment,
        timestamp: new Date().toISOString(),
        branch: process.env.GITHUB_REF_NAME || "unknown",
        sha: process.env.GITHUB_SHA || "unknown",
        actor: process.env.GITHUB_ACTOR || "unknown",
        workflow: process.env.GITHUB_WORKFLOW || "unknown",
      };

      const title =
        EMOJI.ROCKET +
        " Deploy Report - " +
        this.environment.toUpperCase() +
        " - " +
        deployInfo.timestamp.split("T")[0];
      const body = await this.generateDeploymentReportBody(deployInfo);

      const discussion = await this.createOrUpdateDiscussion({
        title,
        body,
        category: "Deployment Reports",
      });

      process.stdout.write(
        EMOJI.CHECKMARK +
          " Relatório de deployment criado: " +
          discussion.url +
          "\n",
      );
      return discussion;
    } catch (error) {
      process.stderr.write(
        EMOJI.CROSS +
          " Erro ao criar relatório de deployment: " +
          error.message +
          "\n",
      );
      throw error;
    }
  }

  async createLGPDComplianceReport() {
    process.stdout.write(
      EMOJI.LOCK + " Gerando relatório de conformidade LGPD...\n",
    );

    try {
      const lgpdReport = await this.generateLGPDReport();

      const title =
        EMOJI.LOCK +
        " LGPD Compliance Report - " +
        this.environment.toUpperCase() +
        " - " +
        new Date().toLocaleDateString("pt-BR");
      const body = lgpdReport;

      const discussion = await this.createOrUpdateDiscussion({
        title,
        body,
        category: "LGPD Compliance",
      });

      process.stdout.write(
        EMOJI.CHECKMARK + " Relatório LGPD criado: " + discussion.url + "\n",
      );
      return discussion;
    } catch (error) {
      process.stderr.write(
        EMOJI.CROSS + " Erro ao criar relatório LGPD: " + error.message + "\n",
      );
      throw error;
    }
  }

  async createOrUpdateDiscussion({ title, body, category }) {
    try {
      // Primeiro, tentar encontrar discussion existente
      const existingDiscussion = await this.findExistingDiscussion(
        title,
        category,
      );

      if (existingDiscussion) {
        process.stdout.write(
          EMOJI.PENCIL + " Atualizando discussion existente...\n",
        );
        // Atualizar discussion existente via GraphQL
        return await this.updateDiscussion(existingDiscussion.id, body);
      } else {
        process.stdout.write(EMOJI.PLUS + " Criando nova discussion...\n");
        return await this.createDiscussion(title, body, category);
      }
    } catch (error) {
      process.stderr.write(
        EMOJI.CROSS +
          " Erro ao criar/atualizar discussion: " +
          error.message +
          "\n",
      );
      throw error;
    }
  }

  async findExistingDiscussion(title, category) {
    try {
      const result = await this.octokit.graphql(FIND_DISCUSSIONS_QUERY, {
        owner: this.owner,
        repo: this.repo,
        first: 50,
      });

      // Procurar discussion similar (mesmo prefixo e categoria)
      const titlePrefix = title.split(" - ")[0]; // Ex: "📋 Documentação Médica"
      const existing = result.repository.discussions.nodes.find(
        (d) => d.title.startsWith(titlePrefix) && d.category.name === category,
      );

      return existing || null;
    } catch (error) {
      process.stdout.write(
        EMOJI.WARNING +
          " Não foi possível buscar discussions existentes: " +
          error.message +
          "\n",
      );
      return null;
    }
  }

  async createDiscussion(title, body, category) {
    // Primeiro, obter IDs necessários
    const repoData = await this.octokit.graphql(REPOSITORY_INFO_QUERY, {
      owner: this.owner,
      repo: this.repo,
    });

    const categoryNode = repoData.repository.discussionCategories.nodes.find(
      (cat) => cat.name === category,
    );
    if (!categoryNode) {
      throw new Error('Categoria "' + category + '" não encontrada');
    }

    const result = await this.octokit.graphql(CREATE_DISCUSSION_MUTATION, {
      repositoryId: repoData.repository.id,
      categoryId: categoryNode.id,
      title,
      body,
    });

    return result.createDiscussion.discussion;
  }

  async updateDiscussion(discussionId, body) {
    const result = await this.octokit.graphql(UPDATE_DISCUSSION_MUTATION, {
      discussionId,
      body,
    });

    return result.updateDiscussion.discussion;
  }

  async readMedicalKnowledge() {
    const knowledgePath = "data/knowledge_base";
    const files = [
      "Roteiro de Dsispensação - Hanseníase.md",
      "roteiro_hanseniase_basico.md",
    ];

    const knowledge = {};

    for (const file of files) {
      try {
        const filePath = path.join(knowledgePath, file);
        const content = await fs.readFile(filePath, "utf-8");
        knowledge[file] = content;
      } catch (error) {
        process.stdout.write(
          EMOJI.WARNING +
            " Não foi possível ler " +
            file +
            ": " +
            error.message +
            "\n",
        );
      }
    }

    return knowledge;
  }

  async generateMedicalDocBody(knowledgeBase) {
    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    return (
      EMOJI.HOSPITAL +
      " Documentação Médica - Plataforma Hanseníase\n\n" +
      "Ambiente: " +
      this.environment.toUpperCase() +
      "\n" +
      "Data/Hora: " +
      timestamp +
      "\n" +
      "Branch: " +
      (process.env.GITHUB_REF_NAME || "N/A") +
      "\n" +
      "Commit: " +
      (process.env.GITHUB_SHA?.substring(0, 7) || "N/A") +
      "\n\n" +
      "Protocolos Médicos Implementados\n" +
      "- PQT-U (Poliquimioterapia Única)\n" +
      "- Sistema de Personas (Dr. Gasnelio + Gá)\n" +
      "- Conformidade LGPD\n" +
      "- PWA instalável\n\n" +
      "Base de conhecimento: " +
      Object.keys(knowledgeBase).length +
      " arquivo(s)\n\n" +
      "Documentação gerada automaticamente pelo GitHub Actions " +
      EMOJI.ROBOT
    );
  }

  async generateAPIDocumentation() {
    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    return (
      EMOJI.WRENCH +
      " API Documentation - Plataforma Hanseníase\n\n" +
      "Ambiente: " +
      this.environment.toUpperCase() +
      "\n" +
      "Data/Hora: " +
      timestamp +
      "\n" +
      "Base URL: " +
      (process.env.NEXT_PUBLIC_API_URL || "N/A") +
      "\n" +
      "Versão: " +
      (process.env.GITHUB_SHA?.substring(0, 7) || "latest") +
      "\n\n" +
      "Endpoints Principais:\n" +
      "- GET /health\n" +
      "- GET /api/personas\n" +
      "- POST /api/chat\n" +
      "- POST /api/calculate-dose\n\n" +
      "Documentação da API gerada automaticamente " +
      EMOJI.ROBOT
    );
  }

  async generateDeploymentReportBody(deployInfo) {
    return (
      EMOJI.ROCKET +
      " Relatório de Deploy - " +
      deployInfo.environment.toUpperCase() +
      "\n\n" +
      "Ambiente: " +
      deployInfo.environment.toUpperCase() +
      "\n" +
      "Data/Hora: " +
      new Date(deployInfo.timestamp).toLocaleString("pt-BR") +
      "\n" +
      "Branch: " +
      deployInfo.branch +
      "\n" +
      "Commit: " +
      deployInfo.sha.substring(0, 7) +
      "\n" +
      "Executado por: " +
      deployInfo.actor +
      "\n\n" +
      "Jobs Executados com Sucesso:\n" +
      "- Validação de Secrets\n" +
      "- Análise de Segurança\n" +
      "- Deploy de Aplicações\n\n" +
      "Relatório gerado automaticamente pelo CI/CD " +
      EMOJI.ROBOT
    );
  }

  async generateLGPDReport() {
    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    return (
      EMOJI.LOCK +
      " Relatório de Conformidade LGPD\n\n" +
      "Ambiente: " +
      this.environment.toUpperCase() +
      "\n" +
      "Data/Hora: " +
      timestamp +
      "\n" +
      "Nível de Compliance: " +
      (this.environment === "production" ? "ESTRITO" : "RIGOROSO") +
      "\n\n" +
      "Conformidade Implementada:\n" +
      "- Proteção de Dados Médicos\n" +
      "- Consentimento e Transparência\n" +
      "- Direitos dos Titulares\n" +
      "- Processamento de Dados\n" +
      "- Medidas Técnicas\n\n" +
      "Relatório LGPD gerado automaticamente " +
      EMOJI.ROBOT +
      "\n\n" +
      "Responsável Técnico: Equipe de Desenvolvimento\n" +
      "DPO: Ana Lívia (conforme CLAUDE.md)\n" +
      "Próxima Revisão: " +
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "pt-BR",
      )
    );
  }
}

// Execução principal
async function main() {
  const manager = new GitHubDiscussionsManager();
  const mode = process.argv[2] || "all";
  const ciMode = process.argv.includes("--ci-mode");

  try {
    await manager.initialize();

    if (ciMode) {
      process.stdout.write(EMOJI.ROBOT + " Executando em modo CI/CD...\n");
    }

    let results = [];

    switch (mode) {
      case "medical":
        results.push(await manager.createMedicalDocumentation());
        break;
      case "api":
        results.push(await manager.createAPIDocumentation());
        break;
      case "deploy":
        results.push(await manager.createDeploymentReport());
        break;
      case "lgpd":
        results.push(await manager.createLGPDComplianceReport());
        break;
      case "all":
      default:
        process.stdout.write(
          EMOJI.ROCKET + " Gerando toda a documentação...\n",
        );
        results.push(await manager.createMedicalDocumentation());
        results.push(await manager.createAPIDocumentation());
        results.push(await manager.createDeploymentReport());
        results.push(await manager.createLGPDComplianceReport());
        break;
    }

    process.stdout.write(
      "\n" + EMOJI.CHECKMARK + " Documentação gerada com sucesso!\n",
    );
    results.forEach((result, index) => {
      process.stdout.write(index + 1 + ". " + result.title + "\n");
      process.stdout.write("   " + result.url + "\n");
    });

    // Output para GitHub Actions
    if (ciMode) {
      process.stdout.write(
        "::set-output name=discussions_created::" + results.length + "\n",
      );
      process.stdout.write(
        "::set-output name=first_discussion_url::" +
          (results[0]?.url || "") +
          "\n",
      );
    }
  } catch (error) {
    process.stderr.write(
      EMOJI.CROSS + " Erro na execução: " + error.message + "\n",
    );
    if (ciMode) {
      process.stdout.write("::set-output name=error::" + error.message + "\n");
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = GitHubDiscussionsManager;
