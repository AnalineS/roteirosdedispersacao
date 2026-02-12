import React from 'react';

/**
 * Parse inline **bold** markers within a text string into React elements.
 */
function parseInlineBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Render markdown-like content strings used in module pages.
 *
 * Handles:
 * - **title:** lines as <h4> headings
 * - Inline **bold** within any line
 * - Lines starting with "•" as list items
 * - Empty lines as paragraph separators
 * - Plain text as <p> elements
 */
export default function renderMarkdownContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: React.ReactNode[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
          {bulletBuffer}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushBullets();
      return;
    }

    // Header line: starts and ends with ** and contains a colon (e.g. **Marcos históricos:**)
    if (/^\*\*.+:\*\*$/.test(trimmed)) {
      flushBullets();
      const title = trimmed.replace(/\*\*/g, '');
      elements.push(
        <h4 key={index} style={{ fontWeight: 'bold', fontSize: '1.05rem', margin: '16px 0 8px', color: '#1976d2' }}>
          {title}
        </h4>
      );
      return;
    }

    // Bullet line
    if (trimmed.startsWith('•')) {
      const text = trimmed.substring(1).trim();
      bulletBuffer.push(
        <li key={index} style={{ marginBottom: '4px', color: '#444', lineHeight: '1.6' }}>
          {parseInlineBold(text)}
        </li>
      );
      return;
    }

    // Regular paragraph with possible inline bold
    flushBullets();
    elements.push(
      <p key={index} style={{ margin: '0 0 8px', lineHeight: '1.6', color: '#444' }}>
        {parseInlineBold(trimmed)}
      </p>
    );
  });

  flushBullets();
  return elements;
}
