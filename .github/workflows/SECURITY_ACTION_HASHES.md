# GitHub Actions - Commit Hashes para Segurança

Este arquivo documenta os commit hashes exatos das GitHub Actions usadas neste projeto, seguindo as melhores práticas de segurança OWASP.

**Data de Atualização**: 2025-01-19
**Referência**: [GitHub Advisory Database](https://github.com/advisories) | [OWASP Supply Chain Security](https://owasp.org/www-project-top-10/2021/A08_2021-Software_and_Data_Integrity_Failures/)

## Ações Oficiais do GitHub

### actions/checkout@v4
- **Tag**: v4.2.2 (latest stable v4.x)
- **Commit Hash**: `11bd71901bbe5b1630ceea73d27597364c9af683`
- **Data**: 2024-12-16
- **Uso**: Checkout do repositório

### actions/setup-node@v4
- **Tag**: v4.2.0 (latest stable v4.x)
- **Commit Hash**: `1d0ff469b7ec7b3cb9d8673fde0c81c44821de2a`
- **Data**: 2025-01-19
- **Uso**: Setup ambiente Node.js

### actions/setup-python@v5
- **Tag**: v5.4.0 (latest stable - v4 deprecated)
- **Commit Hash**: `42375524e23c412d93fb67b49958b491fce71c38`
- **Data**: 2025-01-19
- **Uso**: Setup ambiente Python

### actions/cache@v4
- **Tag**: v4.2.0 (latest stable v4.x)
- **Commit Hash**: `6849a6489940f00c2f30c0fb92c6274307ccb58a`
- **Data**: 2024-12-11
- **Uso**: Cache de dependências

### actions/upload-artifact@v4
- **Tag**: v4.5.0 (latest stable v4.x)
- **Commit Hash**: `b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882`
- **Data**: 2024-12-02
- **Uso**: Upload de artefatos de build

### actions/download-artifact@v4
- **Tag**: v4.2.0 (latest stable v4.x)
- **Commit Hash**: `fa0a91b85d4f404e444e00e005971372dc801d16`
- **Data**: 2024-11-12
- **Uso**: Download de artefatos

## Ações de Segurança

### github/codeql-action/init@v3
- **Tag**: v3.28.1 (latest stable v3.x)
- **Commit Hash**: `ea9e4e37992a54ee68a9622e985e60c8e8f12d9f`
- **Data**: 2025-01-13
- **Uso**: Inicialização CodeQL

### github/codeql-action/autobuild@v3
- **Tag**: v3.28.1 (latest stable v3.x)
- **Commit Hash**: `ea9e4e37992a54ee68a9622e985e60c8e8f12d9f`
- **Data**: 2025-01-13
- **Uso**: Auto-build CodeQL

### github/codeql-action/analyze@v3
- **Tag**: v3.28.1 (latest stable v3.x)
- **Commit Hash**: `ea9e4e37992a54ee68a9622e985e60c8e8f12d9f`
- **Data**: 2025-01-13
- **Uso**: Análise CodeQL

### sonarsource/sonarcloud-github-action@v3
- **Tag**: v3.2.0 (latest stable v3.x)
- **Commit Hash**: `42e69ba06f4ca18e92aabb7aed3bbdc77e2fbfaa`
- **Data**: 2024-12-05
- **Uso**: SonarCloud quality gate

## Ações Google Cloud

### google-github-actions/auth@v2
- **Tag**: v2.1.9 (latest stable v2.x)
- **Commit Hash**: `6fc4af4b145ae7821d527454aa9bd537d1f2dc5f`
- **Data**: 2024-12-19
- **Uso**: Autenticação Google Cloud

### google-github-actions/setup-gcloud@v2
- **Tag**: v2.1.5 (latest stable v2.x)
- **Commit Hash**: `4d9be00c5d95aa5db5da002e36cf1e0b4b8e83ca`
- **Data**: 2024-11-08
- **Uso**: Setup Google Cloud SDK

## Ações de Terceiros

### dorny/paths-filter@v3
- **Tag**: v3.0.2 (latest stable v3.x)
- **Commit Hash**: `de90cc6fb38fc0963ad72b210f1f284cd68cea36`
- **Data**: 2024-03-20
- **Uso**: Filtrar mudanças por path

## Motivação de Segurança

**Problema**: Usar tags móveis (`@v4`, `@main`) permite que atacantes modifiquem o código da action sem que os usuários percebam.

**Solução**: Pin com commit hash completo garante que:
1. O código executado é exatamente o que foi revisado
2. Não há modificações silenciosas via tag hijacking
3. Compliance com OWASP Top 10 2021 - A8 (Software and Data Integrity Failures)

**Referências**:
- [GitHub Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [STIG V-222645](https://www.stigviewer.com/stig/application_security_and_development/2023-06-08/finding/V-222645)
- [CVE-2025-30066](https://github.com/advisories/GHSA-8v34-2qmf-g8w7) - Example supply chain attack via tag hijacking

## Processo de Atualização

1. Verificar novas versões: `gh api repos/{owner}/{repo}/releases | jq '.[0]'`
2. Obter commit hash: `gh api repos/{owner}/{repo}/git/ref/tags/{tag} | jq -r '.object.sha'`
3. Testar em branch separado antes de aplicar
4. Atualizar este documento com novas informações
