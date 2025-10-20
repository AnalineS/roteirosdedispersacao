module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "commonjs",
    ecmaFeatures: {
      // Permitir caracteres Unicode/emojis
      jsx: false,
      globalReturn: false,
      impliedStrict: false,
    },
  },
  rules: {
    "no-console": "off", // Scripts podem usar console para output
    "no-process-exit": "off", // Scripts podem usar process.exit
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Permitir template literals com GraphQL
    "no-unused-expressions": ["error", { allowTaggedTemplates: true }],
    // Relaxar regras para queries GraphQL em template strings
    "no-template-curly-in-string": "off",
    // Permitir caracteres Unicode em strings (emojis)
    "no-irregular-whitespace": [
      "error",
      { skipStrings: true, skipComments: true, skipTemplates: true },
    ],
  },
  // Configuração específica para arquivos com GraphQL e emojis
  overrides: [
    {
      files: [
        "**/github-discussions-manager.js",
        "**/google-monitoring-integration.js",
      ],
      rules: {
        // Permitir template literals complexos para GraphQL
        quotes: ["error", "double", { allowTemplateLiterals: true }],
        "no-multi-str": "off",
        // Permitir caracteres especiais em strings (emojis)
        "no-irregular-whitespace": "off",
      },
    },
  ],
};
