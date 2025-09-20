/**
 * Serviço de Sanitização de Dados Pessoais
 * Conformidade LGPD para Plataforma Educacional Médica
 *
 * Remove ou mascara dados pessoais sensíveis antes de logs,
 * analytics ou qualquer transmissão de dados.
 */

"use client";

// Padrões de dados pessoais sensíveis
const SENSITIVE_PATTERNS = {
  // CPF: xxx.xxx.xxx-xx
  CPF: /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g,

  // Telefone: (xx) xxxxx-xxxx, xx xxxxx-xxxx, etc.
  PHONE: /(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}/g,

  // Email: xxx@xxx.xxx
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // CEP: xxxxx-xxx
  CEP: /\d{5}-?\d{3}/g,

  // Nomes próprios comuns (baseado em padrões brasileiros)
  NAMES:
    /\b(Maria|João|José|Ana|Antonio|Francisco|Carlos|Paulo|Pedro|Lucas|Marcos|Luis|Gabriel|Rafael|Daniel|Felipe|Bruno|André|Rodrigo|Diego|Mateus|Guilherme|Gustavo|Leonardo|Eduardo|Thiago|Henrique|Alexandre|Fernando|Vinícius|Júlio|Igor|Márcio|Fábio|Sérgio|Roberto|Ricardo|Renato|Cristiano|Adriano|Leandro|Maurício|Juliano|César|Raul|Nelson|Antônio|Luiz|José|João|Francisco|Carlos|Paulo|Pedro|Marcos|Daniel|Rafael|Felipe|Bruno|André|Rodrigo|Diego|Mateus|Guilherme|Gustavo|Leonardo|Eduardo|Thiago|Henrique|Alexandre|Fernando|Vinícius|Júlio|Igor|Márcio|Fábio|Sérgio|Roberto|Ricardo|Renato|Cristiano|Adriano|Leandro|Maurício|Juliano|César|Raul|Nelson|Francisca|Antônia|Adriana|Juliana|Márcia|Fernanda|Patricia|Aline|Sandra|Camila|Amanda|Bruna|Jéssica|Letícia|Luciana|Vanessa|Mariana|Gabriela|Valeria|Adriane|Denise|Tatiane|Cristiane|Josiane|Fabiane|Luciane|Viviane|Andreia|Claudia|Simone|Carla|Daniela|Monica|Alessandra|Franciele|Michele|Sabrina|Raquel|Silvia|Elaine|Regina|Rosana|Solange|Vera|Rosa|Rita|Alice|Célia|Gloria|Helena|Irene|Isabel|Lúcia|Marta|Vera|Lídia|Cíntia|Sônia|Terezinha|Aparecida)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/gi,

  // RG: xx.xxx.xxx-x
  RG: /\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]/g,

  // Cartão Nacional de Saúde: xxx xxxx xxxx xxxx
  CNS: /\d{3}\s?\d{4}\s?\d{4}\s?\d{4}/g,

  // Endereços (Rua, Av, etc.)
  ADDRESS:
    /(Rua|Av|Avenida|Travessa|Alameda|Praça|Rodovia|Estrada)\s+[^,\n]{10,}/gi,
};

export interface SanitizationOptions {
  maskEmails?: boolean;
  maskPhones?: boolean;
  maskCPF?: boolean;
  maskNames?: boolean;
  maskAddresses?: boolean;
  preserveFormat?: boolean;
  customMask?: string;
}

export interface SanitizationResult {
  sanitized: string;
  detectedPatterns: string[];
  violationsCount: number;
}

class DataSanitizerService {
  private readonly DEFAULT_MASK = "***";

  /**
   * Sanitiza texto removendo ou mascarando dados pessoais
   */
  sanitizeText(
    text: string,
    options: SanitizationOptions = {},
  ): SanitizationResult {
    if (!text || typeof text !== "string") {
      return {
        sanitized: text || "",
        detectedPatterns: [],
        violationsCount: 0,
      };
    }

    let sanitized = text;
    const detectedPatterns: string[] = [];
    let violationsCount = 0;

    const {
      maskEmails = true,
      maskPhones = true,
      maskCPF = true,
      maskNames = true,
      maskAddresses = true,
      preserveFormat = false,
      customMask = this.DEFAULT_MASK,
    } = options;

    // Sanitizar CPF
    if (maskCPF && SENSITIVE_PATTERNS.CPF.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.CPF, (match) => {
        detectedPatterns.push("CPF");
        violationsCount++;
        return preserveFormat ? "XXX.XXX.XXX-XX" : customMask;
      });
    }

    // Sanitizar telefone
    if (maskPhones && SENSITIVE_PATTERNS.PHONE.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.PHONE, (match) => {
        detectedPatterns.push("TELEFONE");
        violationsCount++;
        return preserveFormat ? "(XX) XXXXX-XXXX" : customMask;
      });
    }

    // Sanitizar email
    if (maskEmails && SENSITIVE_PATTERNS.EMAIL.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, (match) => {
        detectedPatterns.push("EMAIL");
        violationsCount++;
        if (preserveFormat) {
          const [local, domain] = match.split("@");
          return `${local.charAt(0)}***@${domain}`;
        }
        return customMask;
      });
    }

    // Sanitizar nomes
    if (maskNames && SENSITIVE_PATTERNS.NAMES.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.NAMES, (match) => {
        detectedPatterns.push("NOME");
        violationsCount++;
        return preserveFormat
          ? match
              .split(" ")
              .map((word) => word.charAt(0) + "***")
              .join(" ")
          : customMask;
      });
    }

    // Sanitizar endereços
    if (maskAddresses && SENSITIVE_PATTERNS.ADDRESS.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.ADDRESS, (match) => {
        detectedPatterns.push("ENDERECO");
        violationsCount++;
        return preserveFormat
          ? match.split(" ").slice(0, 2).join(" ") + " ***"
          : customMask;
      });
    }

    // Sanitizar RG
    if (SENSITIVE_PATTERNS.RG.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.RG, (match) => {
        detectedPatterns.push("RG");
        violationsCount++;
        return preserveFormat ? "XX.XXX.XXX-X" : customMask;
      });
    }

    // Sanitizar CNS
    if (SENSITIVE_PATTERNS.CNS.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.CNS, (match) => {
        detectedPatterns.push("CNS");
        violationsCount++;
        return preserveFormat ? "XXX XXXX XXXX XXXX" : customMask;
      });
    }

    // Sanitizar CEP
    if (SENSITIVE_PATTERNS.CEP.test(sanitized)) {
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.CEP, (match) => {
        detectedPatterns.push("CEP");
        violationsCount++;
        return preserveFormat ? "XXXXX-XXX" : customMask;
      });
    }

    return {
      sanitized,
      detectedPatterns: [...new Set(detectedPatterns)],
      violationsCount,
    };
  }

  /**
   * Sanitiza objeto removendo campos sensíveis
   */
  sanitizeObject<T extends Record<string, string | number | boolean | null>>(
    obj: T,
    sensitiveFields: (keyof T)[] = [
      "email",
      "phone",
      "cpf",
      "nome",
      "endereco",
    ] as (keyof T)[],
  ): T {
    if (!obj || typeof obj !== "object") return obj;

    const sanitized = { ...obj };

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        const value = sanitized[field];
        if (typeof value === "string") {
          const result = this.sanitizeText(value);
          (sanitized as Record<keyof T, string | number | boolean | null>)[
            field
          ] = result.sanitized;
        } else {
          delete sanitized[field];
        }
      }
    });

    return sanitized;
  }

  /**
   * Sanitiza logs antes do envio para analytics
   */
  sanitizeForLogging<
    T extends
      | string
      | number
      | boolean
      | null
      | Record<string, string | number | boolean | null>
      | Array<string | number | boolean | null>,
  >(data: T): T {
    if (typeof data === "string") {
      return this.sanitizeText(data).sanitized as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForLogging(item)) as T;
    }

    if (data && typeof data === "object") {
      const sanitized: Record<string, string | number | boolean | null> = {};
      const obj = data as Record<string, string | number | boolean | null>;

      Object.keys(obj).forEach((key) => {
        // Campos sempre removidos em logs
        if (
          ["password", "token", "secret", "key", "authorization"].includes(
            key.toLowerCase(),
          )
        ) {
          sanitized[key] = "[REDACTED]";
        } else {
          const value = obj[key];
          if (typeof value === "string") {
            sanitized[key] = this.sanitizeText(value).sanitized;
          } else {
            sanitized[key] = value;
          }
        }
      });

      return sanitized as T;
    }

    return data;
  }

  /**
   * Valida se texto contém dados pessoais
   */
  containsPersonalData(text: string): boolean {
    if (!text || typeof text !== "string") return false;

    return Object.values(SENSITIVE_PATTERNS).some((pattern) =>
      pattern.test(text),
    );
  }

  /**
   * Gera relatório de conformidade LGPD
   */
  generateComplianceReport(
    data:
      | string
      | number
      | boolean
      | null
      | Record<string, string | number | boolean | null>
      | Array<string | number | boolean | null>,
  ): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    const checkData = (
      obj:
        | string
        | number
        | boolean
        | null
        | Record<string, string | number | boolean | null>
        | Array<string | number | boolean | null>,
      path = "",
    ): void => {
      if (typeof obj === "string") {
        const result = this.sanitizeText(obj);
        if (result.violationsCount > 0) {
          violations.push(
            `Dados pessoais detectados em: ${path || "root"} - ${result.detectedPatterns.join(", ")}`,
          );
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => checkData(item, `${path}[${index}]`));
      } else if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          checkData(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };

    checkData(data);

    if (violations.length > 0) {
      recommendations.push("Implementar sanitização antes de logs/analytics");
      recommendations.push("Adicionar consentimento explícito do usuário");
      recommendations.push("Revisar políticas de retenção de dados");
      recommendations.push("Implementar criptografia para dados sensíveis");
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
    };
  }
}

// Singleton instance
export const dataSanitizer = new DataSanitizerService();

// Hook para componentes React
export const useDataSanitizer = () => {
  return {
    sanitizeText: dataSanitizer.sanitizeText.bind(dataSanitizer),
    sanitizeObject: dataSanitizer.sanitizeObject.bind(dataSanitizer),
    sanitizeForLogging: dataSanitizer.sanitizeForLogging.bind(dataSanitizer),
    containsPersonalData:
      dataSanitizer.containsPersonalData.bind(dataSanitizer),
    generateComplianceReport:
      dataSanitizer.generateComplianceReport.bind(dataSanitizer),
  };
};

export default dataSanitizer;
