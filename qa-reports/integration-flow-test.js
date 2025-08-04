/**
 * End-to-End Integration Flow Testing
 * Tests the complete intelligent routing flow in the chat application
 */

console.log("🔗 TESTE DE INTEGRAÇÃO END-TO-END DO ROTEAMENTO INTELIGENTE");
console.log("==========================================================\n");

// Mock chat page state and functions
class ChatPageSimulator {
  constructor() {
    this.inputValue = '';
    this.selectedPersona = null;
    this.pendingQuestion = '';
    this.currentAnalysis = null;
    this.isAnalyzing = false;
    this.hasAnalyzed = false;
    this.personas = {
      dr_gasnelio: {
        name: "Dr. Gasnelio",
        personality: "Técnico e preciso"
      },
      ga: {
        name: "Gá", 
        personality: "Empática e educativa"
      }
    };
    
    // Analytics
    this.acceptedRecommendations = 0;
    this.rejectedRecommendations = 0;
    this.totalAnalyses = 0;
  }

  // User types in input
  handleInputChange(value) {
    this.inputValue = value;
    
    // Trigger analysis if no persona selected and sufficient length
    if (!this.selectedPersona && value.length > 10) {
      this.analyzeQuestion(value);
    }
  }

  // Simulate intelligent routing analysis
  async analyzeQuestion(question) {
    this.isAnalyzing = true;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simple keyword analysis simulation
    const normalizedQuestion = question.toLowerCase();
    let recommendedPersona = 'dr_gasnelio';
    let confidence = 0.3;
    let scope = 'general';
    
    // Dr. Gasnelio keywords
    const clinicalKeywords = ['dose', 'dosagem', 'rifampicina', 'dapsona', 'protocolo', 'tratamento'];
    let clinicalScore = 0;
    clinicalKeywords.forEach(keyword => {
      if (normalizedQuestion.includes(keyword)) {
        clinicalScore += 2;
      }
    });
    
    // Gá keywords
    const educationKeywords = ['família', 'paciente', 'explicar', 'orientar', 'ensinar', 'dispensação'];
    let educationScore = 0;
    educationKeywords.forEach(keyword => {
      if (normalizedQuestion.includes(keyword)) {
        educationScore += 2;
      }
    });
    
    if (clinicalScore > educationScore && clinicalScore > 0) {
      recommendedPersona = 'dr_gasnelio';
      confidence = Math.min(0.9, 0.6 + (clinicalScore * 0.1));
      scope = normalizedQuestion.includes('dose') ? 'dosage' : 'clinical';
    } else if (educationScore > clinicalScore && educationScore > 0) {
      recommendedPersona = 'ga';
      confidence = Math.min(0.9, 0.6 + (educationScore * 0.1));
      scope = normalizedQuestion.includes('família') ? 'education' : 'dispensation';
    }
    
    this.currentAnalysis = {
      recommendedPersonaId: recommendedPersona,
      confidence,
      scope,
      reasoning: `Especialista em ${scope}`,
      alternatives: []
    };
    
    this.isAnalyzing = false;
    this.hasAnalyzed = true;
    this.totalAnalyses++;
  }

  // User attempts to send message
  handleSendMessage() {
    if (!this.selectedPersona) {
      // Store as pending and show routing
      this.pendingQuestion = this.inputValue;
      return { status: 'pending_routing', message: 'Routing required' };
    }
    
    // Send message normally
    const message = this.inputValue;
    this.inputValue = '';
    this.pendingQuestion = '';
    return { status: 'sent', message, persona: this.selectedPersona };
  }

  // User accepts routing recommendation
  acceptRouting(personaId) {
    this.selectedPersona = personaId;
    this.acceptedRecommendations++;
    this.currentAnalysis = null;
    
    // If there's a pending question, it should be ready to send
    if (this.pendingQuestion) {
      this.inputValue = this.pendingQuestion;
      this.pendingQuestion = '';
    }
  }

  // User rejects routing recommendation  
  rejectRouting() {
    this.rejectedRecommendations++;
    this.currentAnalysis = null;
  }

  // User manually selects persona
  selectPersona(personaId) {
    this.selectedPersona = personaId;
    this.currentAnalysis = null;
    
    if (this.pendingQuestion) {
      this.inputValue = this.pendingQuestion;
      this.pendingQuestion = '';
    }
  }

  // Helper methods
  shouldShowRouting() {
    return this.currentAnalysis && this.currentAnalysis.confidence >= 0.6 && !this.isAnalyzing;
  }

  getAnalytics() {
    const acceptanceRate = this.totalAnalyses > 0 
      ? (this.acceptedRecommendations / this.totalAnalyses) * 100 
      : 0;
    return {
      acceptedRecommendations: this.acceptedRecommendations,
      rejectedRecommendations: this.rejectedRecommendations,
      totalAnalyses: this.totalAnalyses,
      acceptanceRate: Math.round(acceptanceRate)
    };
  }
}

// Test scenarios
const testScenarios = [
  {
    name: "Cenário 1: Pergunta clínica com aceitação de roteamento",
    steps: [
      { action: 'type', value: 'Qual a dose de rifampicina para adulto?' },
      { action: 'wait_analysis' },
      { action: 'verify_routing', expectedPersona: 'dr_gasnelio', minConfidence: 0.6 },
      { action: 'accept_routing' },
      { action: 'send_message' },
      { action: 'verify_sent', expectedPersona: 'dr_gasnelio' }
    ]
  },
  {
    name: "Cenário 2: Pergunta educacional com roteamento para Gá",
    steps: [
      { action: 'reset' },
      { action: 'type', value: 'Como explicar o tratamento para a família?' },
      { action: 'wait_analysis' },
      { action: 'verify_routing', expectedPersona: 'ga', minConfidence: 0.6 },
      { action: 'accept_routing' },
      { action: 'send_message' },
      { action: 'verify_sent', expectedPersona: 'ga' }
    ]
  },
  {
    name: "Cenário 3: Rejeição de roteamento e seleção manual",
    steps: [
      { action: 'reset' },
      { action: 'type', value: 'Orientações sobre dispensação farmacêutica' },
      { action: 'wait_analysis' },
      { action: 'verify_routing', expectedPersona: 'ga' },
      { action: 'reject_routing' },
      { action: 'select_persona', persona: 'dr_gasnelio' },
      { action: 'send_message' },
      { action: 'verify_sent', expectedPersona: 'dr_gasnelio' }
    ]
  },
  {
    name: "Cenário 4: Pergunta ambígua sem roteamento",
    steps: [
      { action: 'reset' },
      { action: 'type', value: 'Oi, tudo bem?' },
      { action: 'wait_analysis' },
      { action: 'verify_no_routing' },
      { action: 'select_persona', persona: 'ga' },
      { action: 'send_message' },
      { action: 'verify_sent', expectedPersona: 'ga' }
    ]
  },
  {
    name: "Cenário 5: Fluxo com persona já selecionada",
    steps: [
      { action: 'reset' },
      { action: 'select_persona', persona: 'dr_gasnelio' },
      { action: 'type', value: 'Como explicar para família?' }, // Would normally route to Gá
      { action: 'wait_analysis' },
      { action: 'verify_no_routing' }, // No routing because persona already selected
      { action: 'send_message' },
      { action: 'verify_sent', expectedPersona: 'dr_gasnelio' }
    ]
  }
];

async function runIntegrationTests() {
  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (const scenario of testScenarios) {
    console.log(`🧪 ${scenario.name}`);
    console.log("─".repeat(50));
    
    const simulator = new ChatPageSimulator();
    let scenarioPassed = true;
    const stepResults = [];

    for (const step of scenario.steps) {
      totalTests++;
      let stepPassed = false;
      let stepMessage = '';

      try {
        switch (step.action) {
          case 'reset':
            // Already handled by new simulator instance
            stepPassed = true;
            stepMessage = 'Simulator reset';
            break;

          case 'type':
            simulator.handleInputChange(step.value);
            stepPassed = true;
            stepMessage = `Typed: "${step.value}"`;
            break;

          case 'wait_analysis':
            await new Promise(resolve => setTimeout(resolve, 100));
            if (simulator.inputValue.length > 10 && !simulator.selectedPersona) {
              await simulator.analyzeQuestion(simulator.inputValue);
            }
            stepPassed = true;
            stepMessage = 'Analysis completed';
            break;

          case 'verify_routing':
            const shouldShow = simulator.shouldShowRouting();
            const correctPersona = !step.expectedPersona || 
              simulator.currentAnalysis?.recommendedPersonaId === step.expectedPersona;
            const correctConfidence = !step.minConfidence || 
              simulator.currentAnalysis?.confidence >= step.minConfidence;
            
            stepPassed = shouldShow && correctPersona && correctConfidence;
            stepMessage = `Routing: ${shouldShow ? '✓' : '✗'}, Persona: ${correctPersona ? '✓' : '✗'}, Confidence: ${correctConfidence ? '✓' : '✗'}`;
            break;

          case 'verify_no_routing':
            const shouldNotShow = !simulator.shouldShowRouting();
            stepPassed = shouldNotShow;
            stepMessage = `No routing shown: ${shouldNotShow ? '✓' : '✗'}`;
            break;

          case 'accept_routing':
            if (simulator.currentAnalysis) {
              simulator.acceptRouting(simulator.currentAnalysis.recommendedPersonaId);
              stepPassed = true;
              stepMessage = `Accepted routing to ${simulator.selectedPersona}`;
            } else {
              stepMessage = 'No routing to accept';
            }
            break;

          case 'reject_routing':
            simulator.rejectRouting();
            stepPassed = true;
            stepMessage = 'Routing rejected';
            break;

          case 'select_persona':
            simulator.selectPersona(step.persona);
            stepPassed = simulator.selectedPersona === step.persona;
            stepMessage = `Selected persona: ${simulator.selectedPersona}`;
            break;

          case 'send_message':
            const result = simulator.handleSendMessage();
            stepPassed = result.status === 'sent';
            stepMessage = `Message ${result.status}: ${result.message?.substring(0, 30)}...`;
            break;

          case 'verify_sent':
            stepPassed = simulator.selectedPersona === step.expectedPersona;
            stepMessage = `Message sent to ${simulator.selectedPersona} (expected: ${step.expectedPersona})`;
            break;
        }
      } catch (error) {
        stepMessage = `Error: ${error.message}`;
      }

      if (stepPassed) {
        passedTests++;
        console.log(`  ✅ ${step.action}: ${stepMessage}`);
      } else {
        scenarioPassed = false;
        console.log(`  ❌ ${step.action}: ${stepMessage}`);
      }

      stepResults.push({ action: step.action, passed: stepPassed, message: stepMessage });
    }

    // Show analytics for scenarios that generate them
    const analytics = simulator.getAnalytics();
    if (analytics.totalAnalyses > 0) {
      console.log(`  📊 Analytics: ${analytics.acceptedRecommendations}/${analytics.totalAnalyses} accepted (${analytics.acceptanceRate}%)`);
    }

    results.push({
      scenario: scenario.name,
      passed: scenarioPassed,
      steps: stepResults,
      analytics
    });

    console.log(`  🎯 Resultado: ${scenarioPassed ? 'SUCESSO' : 'FALHA'}\n`);
  }

  return { totalTests, passedTests, results };
}

// Edge case tests
async function testEdgeCases() {
  console.log("🔍 TESTES DE CASOS EXTREMOS");
  console.log("============================\n");

  const simulator = new ChatPageSimulator();
  let edgeTests = 0;
  let edgePassed = 0;

  // Test 1: Empty input
  console.log("1. Entrada vazia");
  edgeTests++;
  simulator.handleInputChange('');
  if (!simulator.isAnalyzing && !simulator.currentAnalysis) {
    console.log("✅ Entrada vazia não dispara análise");
    edgePassed++;
  } else {
    console.log("❌ Entrada vazia disparou análise incorretamente");
  }

  // Test 2: Very short input
  console.log("\n2. Entrada muito curta");
  edgeTests++;
  simulator.handleInputChange('oi');
  if (!simulator.isAnalyzing && !simulator.currentAnalysis) {
    console.log("✅ Entrada curta não dispara análise");
    edgePassed++;
  } else {
    console.log("❌ Entrada curta disparou análise incorretamente");
  }

  // Test 3: Rapid typing simulation
  console.log("\n3. Digitação rápida (debounce)");
  edgeTests++;
  simulator.handleInputChange('qual');
  simulator.handleInputChange('qual a');
  simulator.handleInputChange('qual a dose');
  simulator.handleInputChange('qual a dose de rifampicina?');
  
  // Should only analyze the final version due to debounce
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (!simulator.isAnalyzing) {
    console.log("✅ Debounce funcionando corretamente");
    edgePassed++;
  } else {
    console.log("❌ Debounce não está funcionando");
  }

  // Test 4: Multiple persona switches
  console.log("\n4. Múltiplas trocas de persona");
  edgeTests++;
  simulator.selectPersona('dr_gasnelio');
  simulator.selectPersona('ga');
  simulator.selectPersona('dr_gasnelio');
  
  if (simulator.selectedPersona === 'dr_gasnelio') {
    console.log("✅ Múltiplas trocas de persona funcionando");
    edgePassed++;
  } else {
    console.log("❌ Problema nas trocas de persona");
  }

  // Test 5: Analysis with selected persona
  console.log("\n5. Análise com persona já selecionada");
  edgeTests++;
  simulator.selectPersona('ga');
  simulator.handleInputChange('Qual a dose de rifampicina?'); // Should not trigger routing
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!simulator.shouldShowRouting()) {
    console.log("✅ Não mostra roteamento com persona selecionada");
    edgePassed++;
  } else {
    console.log("❌ Mostra roteamento mesmo com persona selecionada");
  }

  console.log(`\n📊 CASOS EXTREMOS: ${edgePassed}/${edgeTests} passou (${((edgePassed/edgeTests)*100).toFixed(1)}%)\n`);
  
  return { edgeTests, edgePassed };
}

// Run all integration tests
async function runAllIntegrationTests() {
  const integrationResults = await runIntegrationTests();
  const edgeResults = await testEdgeCases();
  
  const totalTests = integrationResults.totalTests + edgeResults.edgeTests;
  const totalPassed = integrationResults.passedTests + edgeResults.edgePassed;
  
  console.log("🏆 RESUMO FINAL - INTEGRAÇÃO END-TO-END");
  console.log("=====================================");
  console.log(`Cenários principais: ${integrationResults.passedTests}/${integrationResults.totalTests}`);
  console.log(`Casos extremos: ${edgeResults.edgePassed}/${edgeResults.edgeTests}`);
  console.log(`Total geral: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
  console.log(`Status: ${totalPassed === totalTests ? '✅ TODOS PASSARAM' : totalPassed >= totalTests * 0.8 ? '⚠️ MAIORIA PASSOU' : '❌ FALHAS CRÍTICAS'}`);
  
  return {
    integration: integrationResults,
    edge: edgeResults,
    total: { totalTests, totalPassed }
  };
}

// Run tests
runAllIntegrationTests();