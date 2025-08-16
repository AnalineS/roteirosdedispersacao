/**
 * Medical Term Popup Component
 * Popup inline + Modal para terminologia médica
 * Mobile-optimized com acordeons
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { MedicalTerm } from '@/types/disclosure';
import { useMedicalTerminology } from '@/hooks/useProgressiveDisclosure';

interface MedicalTermPopupProps {
  term: MedicalTerm;
  children: React.ReactNode;
  className?: string;
}

export function MedicalTermPopup({ term, children, className = '' }: MedicalTermPopupProps) {
  const { activePopup, showPopup, hidePopup, showModal } = useMedicalTerminology();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isActive = activePopup === term.term;

  // Calcular posição do popup
  useEffect(() => {
    if (isActive && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 120; // Altura estimada do popup
      const popupWidth = 280;   // Largura do popup
      
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;

      // Ajustar se sair da tela (bottom)
      if (top + popupHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - popupHeight - 8;
      }

      // Ajustar se sair da tela (right)
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16;
      }

      // Ajustar se sair da tela (left)
      if (left < 16) {
        left = 16;
      }

      setPosition({ top, left });
    }
  }, [isActive]);

  // Fechar popup ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isActive &&
        popupRef.current &&
        triggerRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        hidePopup();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive, hidePopup]);

  const handleTermClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isActive) {
      hidePopup();
    } else {
      showPopup(term.term);
    }
  };

  const handleShowMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showModal(term.term);
  };

  return (
    <>
      {/* Trigger - termo clicável */}
      <span
        ref={triggerRef}
        onClick={handleTermClick}
        className={`
          medical-term-trigger
          cursor-pointer
          underline
          decoration-dashed
          decoration-blue-400
          underline-offset-2
          hover:decoration-blue-600
          hover:bg-blue-50
          transition-colors
          duration-200
          px-1
          py-0.5
          rounded
          ${isActive ? 'bg-blue-100 decoration-blue-600' : ''}
          ${className}
        `}
        role="button"
        tabIndex={0}
        aria-expanded={isActive}
        aria-describedby={`popup-${term.term}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTermClick(e as any);
          }
        }}
      >
        {children}
      </span>

      {/* Popup inline */}
      {isActive && (
        <div
          ref={popupRef}
          id={`popup-${term.term}`}
          className="medical-term-popup fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs"
          style={{
            top: position.top,
            left: position.left,
            animation: 'fadeInUp 0.2s ease-out'
          }}
          role="tooltip"
          aria-live="polite"
        >
          {/* Definição concisa (1-2 linhas) */}
          <div className="text-sm font-medium text-gray-900 mb-2">
            {term.term}
          </div>
          
          <div className="text-sm text-gray-700 mb-3 leading-relaxed">
            {term.simple}
          </div>

          {/* Categoria visual */}
          <div className="flex items-center justify-between mb-3">
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${getCategoryStyle(term.category)}
            `}>
              {getCategoryIcon(term.category)}
              {getCategoryName(term.category)}
            </span>
          </div>

          {/* Link "Ver mais" para modal */}
          {term.detailed && (
            <button
              onClick={handleShowMore}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 min-h-[44px]"
              aria-label={`Ver informações detalhadas sobre ${term.term}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ver mais detalhes
            </button>
          )}

          {/* Seta indicativa */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        </div>
      )}

      {/* Estilos CSS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .medical-term-popup {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
}

// Componente Modal para informações detalhadas
export function MedicalTermModal({ term, isOpen, onClose }: {
  term: MedicalTerm;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${term.term}`}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id={`modal-title-${term.term}`} className="text-xl font-semibold text-gray-900">
              {term.term}
            </h2>
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2
              ${getCategoryStyle(term.category)}
            `}>
              {getCategoryIcon(term.category)}
              {getCategoryName(term.category)}
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-6">
            {/* Definição completa */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Definição</h3>
              <p className="text-gray-700 leading-relaxed">
                {term.detailed}
              </p>
            </div>

            {/* Contexto clínico */}
            {term.context && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contexto Clínico</h3>
                <p className="text-gray-700 leading-relaxed">
                  {term.context}
                </p>
              </div>
            )}

            {/* Imagens */}
            {term.images && term.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Imagens de Referência</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {term.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${term.term} - Imagem ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 min-h-[44px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilities para categorias
function getCategoryStyle(category: string): string {
  const styles = {
    dosage: 'bg-green-100 text-green-800',
    symptom: 'bg-red-100 text-red-800', 
    procedure: 'bg-blue-100 text-blue-800',
    anatomy: 'bg-purple-100 text-purple-800',
    drug: 'bg-orange-100 text-orange-800',
    condition: 'bg-yellow-100 text-yellow-800'
  };
  return styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800';
}

function getCategoryIcon(category: string): string {
  const icons = {
    dosage: '💊',
    symptom: '🔴',
    procedure: '🔬',
    anatomy: '🫀',
    drug: '💉',
    condition: '📋'
  };
  return icons[category as keyof typeof icons] || '📖';
}

function getCategoryName(category: string): string {
  const names = {
    dosage: 'Dosagem',
    symptom: 'Sintoma',
    procedure: 'Procedimento', 
    anatomy: 'Anatomia',
    drug: 'Medicamento',
    condition: 'Condição'
  };
  return names[category as keyof typeof names] || 'Termo Médico';
}

export default MedicalTermPopup;