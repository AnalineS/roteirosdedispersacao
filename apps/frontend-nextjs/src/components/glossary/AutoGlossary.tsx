'use client';

import React from 'react';
import MedicalTermTooltip from './MedicalTermTooltip';

interface AutoGlossaryProps {
  children: string;
  className?: string;
}

// Lista de termos para detecção automática (em ordem de prioridade - mais específicos primeiro)
const medicalTermsToDetect = [
  'Mycobacterium leprae',
  'dermatoneurológico',
  'estado reacional',
  'eritema nodoso',
  'reação reversa',
  'dose supervisionada',
  'baciloscopia',
  'rifampicina',
  'clofazimina',
  'dapsona',
  'PQT-U',
  'PCDT',
  'SINAN',
  'neurite',
  'neuropatia',
  'bactericida',
  'bacteriostático',
  'hiperpigmentação',
  'hanseníase',
  'lepra',
  'BAAR',
  'IB', // Índice Baciloscópico
  'MB', // Multibacilar
  'PB', // Paucibacilar
  'OMS',
  'SUS',
  'INSS',
  'MORHAN'
];

export default function AutoGlossary({ children, className = '' }: AutoGlossaryProps) {
  // Função para processar o texto e adicionar tooltips
  const processText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    let keyIndex = 0;

    // Criar regex que detecta termos médicos (case-insensitive, palavra completa)
    const termsPattern = medicalTermsToDetect
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escapar caracteres especiais
      .join('|');
    
    const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');

    let lastIndex = 0;
    let match;

    // Processar todas as ocorrências
    while ((match = regex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      // Adicionar texto antes do match
      if (matchStart > lastIndex) {
        const beforeText = text.slice(lastIndex, matchStart);
        if (beforeText) {
          parts.push(
            <span key={`text-${keyIndex++}`}>
              {beforeText}
            </span>
          );
        }
      }

      // Adicionar o termo com tooltip
      const matchedTerm = match[0];
      parts.push(
        <MedicalTermTooltip key={`term-${keyIndex++}`} term={matchedTerm}>
          {matchedTerm}
        </MedicalTermTooltip>
      );

      lastIndex = matchEnd;
    }

    // Adicionar texto restante
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={`text-${keyIndex++}`}>
            {remainingText}
          </span>
        );
      }
    }

    // Se não encontrou nenhum termo, retornar o texto original
    if (parts.length === 0) {
      return [<span key="original">{text}</span>];
    }

    return parts;
  };

  return (
    <span className={`auto-glossary ${className}`}>
      {processText(children)}
    </span>
  );
}

// Hook para aplicar AutoGlossary em conteúdo existente
export function useAutoGlossary(enabled: boolean = true) {
  const wrapWithGlossary = (text: string): React.ReactNode => {
    if (!enabled || typeof text !== 'string') {
      return text;
    }
    return <AutoGlossary>{text}</AutoGlossary>;
  };

  return { wrapWithGlossary };
}

// Componente para aplicar em blocos de texto maiores
export function GlossaryWrapper({ children, enabled = true }: { 
  children: React.ReactNode; 
  enabled?: boolean; 
}) {
  if (!enabled) {
    return <>{children}</>;
  }

  // Recursivamente processar filhos
  const processChildren = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return <AutoGlossary>{node}</AutoGlossary>;
    }

    if (React.isValidElement(node)) {
      // Se é um elemento React, processar seus filhos
      const nodeWithProps = node as React.ReactElement<any>;
      const processedChildren = React.Children.map(nodeWithProps.props.children, processChildren);
      return React.cloneElement(nodeWithProps, {}, processedChildren);
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>
          {processChildren(child)}
        </React.Fragment>
      ));
    }

    return node;
  };

  return <>{processChildren(children)}</>;
}