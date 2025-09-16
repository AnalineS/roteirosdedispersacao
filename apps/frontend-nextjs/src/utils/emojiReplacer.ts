/**
 * Emoji Replacer - Utilitário para converter emojis em ícones
 * Usa o mapeamento existente do emojiToIconConverter
 */

import React from 'react';
import { getIconForEmoji, COMPREHENSIVE_EMOJI_TO_ICON_MAP } from '@/utils/emojiToIconConverter';

/**
 * Converter emoji string para componente ícone
 */
export function replaceEmojiWithIcon(text: string, size = 16, className = ''): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Regex para encontrar emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{E000}-\u{F8FF}]/gu;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    // Adicionar texto antes do emoji
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Obter componente ícone para o emoji
    const IconComponent = getIconForEmoji(match[0]);

    if (IconComponent) {
      parts.push(
        React.createElement(IconComponent, {
          key: `icon-${match.index}`,
          size: size,
          className: `inline mr-1 ${className}`,
          'aria-label': match[0] // Manter acessibilidade
        })
      );
    } else {
      // Fallback: manter o emoji original
      parts.push(match[0]);
    }

    lastIndex = emojiRegex.lastIndex;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Converter JSX que contém emojis
 */
export function convertEmojiInJSX(content: string, size = 16): string {
  let converted = content;

  // Substituir emojis conhecidos por imports de ícones
  Object.entries(COMPREHENSIVE_EMOJI_TO_ICON_MAP).forEach(([emoji, IconComponent]) => {
    const iconName = IconComponent.name;
    const iconRegex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

    converted = converted.replace(iconRegex, `<${iconName} size={${size}} className="inline mr-1" />`);
  });

  return converted;
}

/**
 * Extrair todos os emojis de uma string para análise
 */
export function extractAllEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{E000}-\u{F8FF}]/gu;
  return text.match(emojiRegex) || [];
}

export default {
  replaceEmojiWithIcon,
  convertEmojiInJSX,
  extractAllEmojis
};