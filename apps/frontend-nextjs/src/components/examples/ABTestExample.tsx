/**
 * Exemplo de uso do sistema A/B Testing real
 * Demonstra como usar o hook useABTest na prática
 */

import React from 'react';
import useABTest from '@/hooks/useABTest';

export function DoseCalculatorExample() {
  const { variant, isActive, config, loading, trackConversion, isVariant } = useABTest('exp_calculadora_de_dose___layout_20250923');

  const handleCalculateClick = () => {
    // Rastrear conversão quando usuário calcula dose
    trackConversion('dose_calculation_completed', 1.0, {
      layout_version: variant,
      user_flow: 'calculate_button'
    });

    console.log('Dose calculada!');
  };

  const handleTimeSpent = (seconds: number) => {
    // Rastrear tempo gasto na calculadora
    trackConversion('time_to_complete', seconds, {
      layout_version: variant
    });
  };

  if (loading) {
    return <div>Carregando experimento...</div>;
  }

  // Renderização baseada na variante
  if (isVariant('improved')) {
    return (
      <div className="calculator-enhanced">
        <h2 style={{ color: config.color_scheme as string }}>
          Calculadora de Dose PQT-U (Layout Melhorado)
        </h2>

        {(config.helper_text as boolean) && (
          <div className="helper-text">
            💡 Dica: Use os campos abaixo para calcular a dose correta
          </div>
        )}

        <div className="form-container">
          {/* Campos do formulário */}
          <input type="number" placeholder="Peso do paciente (kg)" />
          <input type="number" placeholder="Idade" />

          <button
            onClick={handleCalculateClick}
            className={`btn-${config.button_size}`}
            style={{
              backgroundColor: config.color_scheme === 'green' ? '#28a745' : '#007bff',
              padding: config.button_size === 'large' ? '15px 30px' : '10px 20px'
            }}
          >
            Calcular Dose
          </button>
        </div>

        <div className="layout-info">
          <small>Versão: {variant} | Ativo: {isActive ? 'Sim' : 'Não'}</small>
        </div>
      </div>
    );
  }

  // Variante de controle (padrão)
  return (
    <div className="calculator-standard">
      <h2 style={{ color: (config.color_scheme as string) || 'blue' }}>
        Calculadora de Dose PQT-U
      </h2>

      <div className="form-container">
        <input type="number" placeholder="Peso (kg)" />
        <input type="number" placeholder="Idade" />

        <button
          onClick={handleCalculateClick}
          className="btn-medium"
          style={{ backgroundColor: '#007bff' }}
        >
          Calcular
        </button>
      </div>

      <div className="layout-info">
        <small>Versão: {variant} | Ativo: {isActive ? 'Sim' : 'Não'}</small>
      </div>
    </div>
  );
}

export function ChatPersonaExample() {
  const { variant, config, trackConversion, isVariant } = useABTest('exp_chat_persona___dr._gasnelio_vs_gá_20250923');

  const handleChatStart = () => {
    trackConversion('chat_engagement', 1.0, {
      default_persona: config.default_persona,
      technical_level: config.technical_detail_level
    });
  };

  const handlePersonaSwitch = (fromPersona: string, toPersona: string) => {
    trackConversion('persona_switches', 1.0, {
      from: fromPersona,
      to: toPersona,
      technical_level: config.technical_detail_level
    });
  };

  return (
    <div className="chat-interface">
      <h3>Chat Educacional - Teste de Persona</h3>

      <div className="persona-selector">
        {(config.show_persona_switch as boolean) && (
          <div className="persona-buttons">
            <button
              className={config.default_persona === 'dr_gasnelio' ? 'active' : ''}
              onClick={() => handlePersonaSwitch(config.default_persona as string, 'dr_gasnelio')}
            >
              Dr. Gasnelio (Técnico)
            </button>
            <button
              className={config.default_persona === 'ga' ? 'active' : ''}
              onClick={() => handlePersonaSwitch(config.default_persona as string, 'ga')}
            >
              Gá (Empático)
            </button>
          </div>
        )}
      </div>

      <div className="chat-container">
        <p>Persona padrão: <strong>{config.default_persona as string}</strong></p>
        <p>Nível técnico: <strong>{config.technical_detail_level as string}</strong></p>
        <p>Variante: <strong>{variant}</strong></p>

        <button onClick={handleChatStart}>
          Iniciar Conversa
        </button>
      </div>
    </div>
  );
}

export function OnboardingExample() {
  const { variant, config, trackConversion } = useABTest('exp_onboarding_flow___educacional_20250923');

  const handleTutorialStart = () => {
    trackConversion('onboarding_completion', 0.0, {
      tutorial_type: config.tutorial_type || 'standard',
      steps_total: config.tutorial_steps
    });
  };

  const handleStepCompleted = (stepNumber: number) => {
    const progress = stepNumber / (config.tutorial_steps as number);
    trackConversion('tutorial_engagement', progress, {
      step: stepNumber,
      tutorial_type: config.tutorial_type || 'standard'
    });
  };

  const handleFirstAction = () => {
    trackConversion('time_to_first_action', Date.now(), {
      tutorial_type: config.tutorial_type || 'standard'
    });
  };

  return (
    <div className="onboarding-flow">
      <h3>Tutorial de Onboarding - Variante: {variant}</h3>

      {variant === 'video_tutorial' ? (
        <div className="video-tutorial">
          <h4>Tutorial em Vídeo</h4>
          <div className="video-placeholder">
            📹 Vídeo de {config.video_duration as string}
          </div>
          {(config.skip_option as boolean) && <button>Pular Tutorial</button>}
        </div>
      ) : (
        <div className="step-tutorial">
          <h4>Tutorial Interativo</h4>
          <p>Total de passos: {config.tutorial_steps as number}</p>
          <p>Elementos interativos: {config.interactive_elements ? 'Sim' : 'Não'}</p>

          {(config.progress_tracking as boolean) && (
            <div className="progress-bar">
              <div>Progresso será rastreado</div>
            </div>
          )}

          <div className="tutorial-controls">
            <button onClick={handleTutorialStart}>Iniciar Tutorial</button>
            <button onClick={() => handleStepCompleted(1)}>Completar Passo 1</button>
            <button onClick={handleFirstAction}>Primeira Ação</button>
            {(config.skip_option as boolean) && <button>Pular</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente principal com todos os exemplos
export default function ABTestExample() {
  return (
    <div className="ab-test-examples">
      <h1>Exemplos de A/B Testing Real</h1>

      <section>
        <h2>1. Calculadora de Dose</h2>
        <DoseCalculatorExample />
      </section>

      <section>
        <h2>2. Chat Persona</h2>
        <ChatPersonaExample />
      </section>

      <section>
        <h2>3. Onboarding Flow</h2>
        <OnboardingExample />
      </section>

      <style jsx>{`
        .ab-test-examples {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        section {
          margin: 40px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .calculator-enhanced, .calculator-standard {
          padding: 20px;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .helper-text {
          background: #e7f3ff;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .form-container {
          margin: 20px 0;
        }

        .form-container input {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 10px 0;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .btn-medium {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }

        .btn-large {
          padding: 15px 30px;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        .layout-info {
          margin-top: 15px;
          color: #666;
        }

        .persona-buttons button {
          margin: 0 10px;
          padding: 10px 15px;
          border: 1px solid #007bff;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .persona-buttons button.active {
          background: #007bff;
          color: white;
        }

        .chat-container {
          margin: 20px 0;
          padding: 15px;
          background: #f1f1f1;
          border-radius: 4px;
        }

        .video-placeholder {
          width: 100%;
          height: 200px;
          background: #000;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          margin: 10px 0;
        }

        .tutorial-controls button {
          margin: 5px 10px 5px 0;
          padding: 8px 15px;
          border: 1px solid #28a745;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .tutorial-controls button:hover {
          background: #28a745;
          color: white;
        }
      `}</style>
    </div>
  );
}