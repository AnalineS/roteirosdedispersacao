/**
 * EducationalQuiz - Sistema de Quiz Interativo sobre Hanseníase
 * Questões mistas com feedback adaptativo por personas
 * Sistema híbrido de pontuação com imagens médicas (placeholders)
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { 
  EducationalQuiz as EducationalQuizType, 
  QuizQuestion, 
  QuizAttempt, 
  QuizAnswer, 
  GamificationNotification 
} from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';

interface EducationalQuizProps {
  quiz: EducationalQuizType;
  userLevel: UserLevel;
  onQuizComplete: (attempt: QuizAttempt) => void;
  onQuizExit: () => void;
  className?: string;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  startTime: number;
  timeRemaining: number;
  isCompleted: boolean;
  showResults: boolean;
  score: number;
  isSubmitting: boolean;
}

export default function EducationalQuiz({
  quiz,
  userLevel,
  onQuizComplete,
  onQuizExit,
  className = ''
}: EducationalQuizProps) {

  // ============================================================================
  // QUIZ STATE MANAGEMENT
  // ============================================================================

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    timeRemaining: (quiz.timeLimit || 30) * 60, // Convert to seconds
    isCompleted: false,
    showResults: false,
    score: 0,
    isSubmitting: false
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;
  const totalQuestions = quiz.questions.length;

  // ============================================================================
  // TIMER MANAGEMENT
  // ============================================================================

  useEffect(() => {
    if (quizState.isCompleted || quizState.showResults) return;

    const timer = setInterval(() => {
      setQuizState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          // Auto-submit quiz when time runs out
          submitQuiz(true);
          return { ...prev, timeRemaining: 0, isCompleted: true };
        }
        
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.isCompleted, quizState.showResults]); // submitQuiz removed to avoid hoisting issues

  // Reset question timer when moving to next question
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setSelectedAnswer('');
    setShowExplanation(false);
  }, [quizState.currentQuestionIndex]);

  // ============================================================================
  // ANSWER HANDLING
  // ============================================================================

  const handleAnswerChange = (answer: string | string[]) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = checkAnswer(currentQuestion, selectedAnswer);
    
    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent,
      hintsUsed: 0 // Can be extended later
    };

    setQuizState(prev => ({
      ...prev,
      answers: [...prev.answers, answer]
    }));

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setQuizState(prev => ({ ...prev, isCompleted: true }));
      submitQuiz(false);
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  // ============================================================================
  // ANSWER VALIDATION
  // ============================================================================

  const checkAnswer = (question: QuizQuestion, answer: string | string[]): boolean => {
    if (question.type === 'true_false') {
      return answer === question.correctAnswer;
    }
    
    if (question.type === 'multiple_choice') {
      return answer === question.correctAnswer;
    }
    
    if (question.type === 'text_input') {
      // Case-insensitive comparison for text inputs
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      
      return correctAnswers.some(correct => 
        String(answer).toLowerCase().trim() === String(correct).toLowerCase().trim()
      );
    }

    return false;
  };

  // ============================================================================
  // QUIZ SUBMISSION
  // ============================================================================

  const submitQuiz = async (isTimeout: boolean = false) => {
    if (quizState.isSubmitting) return;

    setQuizState(prev => ({ ...prev, isSubmitting: true }));

    const totalTime = Math.round((Date.now() - quizState.startTime) / 1000);
    const correctAnswers = quizState.answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = quiz.passingScore || 70; // Default 70%
    const isPassed = score >= passingScore;
    
    const baseXpReward = quiz.xpReward || 100; // Default 100 XP
    const xpEarned = isPassed ? baseXpReward : Math.round(baseXpReward * 0.3);

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: quiz.id,
      userId: 'current_user', // Should come from auth context
      startedAt: new Date(quizState.startTime).toISOString(),
      completedAt: new Date().toISOString(),
      answers: quizState.answers,
      score,
      xpEarned,
      timeSpent: totalTime,
      isPassed,
      feedbackPersona: getFeedbackPersona()
    };

    setQuizState(prev => ({
      ...prev,
      score,
      showResults: true,
      isSubmitting: false
    }));

    onQuizComplete(attempt);
  };

  // ============================================================================
  // FEEDBACK PERSONA SELECTION
  // ============================================================================

  const getFeedbackPersona = (): 'ga' | 'dr-gasnelio' => {
    if (quiz.feedbackPersona === 'ga') return 'ga';
    if (quiz.feedbackPersona === 'dr-gasnelio') return 'dr-gasnelio';
    
    // Adaptive feedback based on user level
    switch (userLevel) {
      case 'paciente':
        return 'ga'; // Empathetic feedback for patients
      case 'estudante':
        return Math.random() > 0.5 ? 'ga' : 'dr-gasnelio'; // Mixed approach
      case 'profissional':
      case 'especialista':
        return 'dr-gasnelio'; // Technical feedback for professionals
      default:
        return 'ga';
    }
  };

  // ============================================================================
  // EXPLANATION RENDERING
  // ============================================================================

  const renderExplanation = () => {
    if (!showExplanation || !currentQuestion) return null;

    const lastAnswer = quizState.answers[quizState.answers.length - 1];
    const feedbackPersona = getFeedbackPersona();
    const isCorrect = lastAnswer?.isCorrect || false;

    let explanation = isCorrect 
      ? currentQuestion.explanation.correct 
      : currentQuestion.explanation.incorrect;

    // Add technical explanation for higher levels
    if ((userLevel === 'profissional' || userLevel === 'especialista') && 
        currentQuestion.explanation.technical) {
      explanation += '\n\n' + currentQuestion.explanation.technical;
    }

    return (
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${
        isCorrect 
          ? 'bg-green-50 border-green-500' 
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="text-2xl">
            {feedbackPersona === 'ga' ? '🤗' : '👨‍⚕️'}
          </div>
          <div className="flex-1">
            <div className={`font-medium mb-2 ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCorrect ? '✅ Resposta Correta!' : '❌ Resposta Incorreta'}
              {feedbackPersona === 'ga' ? ' - Gá explica:' : ' - Dr. Gasnelio explica:'}
            </div>
            <p className={`text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {explanation}
            </p>
            
            {!isCorrect && (
              <div className="mt-3 p-3 bg-white rounded border">
                <div className="font-medium text-sm text-gray-800 mb-1">
                  Resposta correta:
                </div>
                <div className="text-sm text-gray-700">
                  {currentQuestion.correctAnswer}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            +{currentQuestion.xpValue} XP {isCorrect ? 'ganhos' : 'parciais'}
          </div>
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isLastQuestion ? 'Finalizar Quiz' : 'Próxima Questão'}
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // QUESTION RENDERING
  // ============================================================================

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        {/* Question header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Questão {quizState.currentQuestionIndex + 1} de {totalQuestions}
          </h3>
          <div className="text-sm text-gray-600">
            {currentQuestion.xpValue} XP
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((quizState.currentQuestionIndex + 1) / totalQuestions) * 100}%`
            }}
          />
        </div>

        {/* Question content */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {/* Image placeholder */}
          {currentQuestion.image && (
            <div className="mb-4">
              <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-sm">{currentQuestion.image.caption}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Placeholder: {currentQuestion.image.alt}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question text */}
          <h4 className="text-xl font-medium mb-6 text-gray-800">
            {currentQuestion.question}
          </h4>

          {/* Answer options */}
          {renderAnswerOptions()}

          {/* Action buttons */}
          {!showExplanation && (
            <div className="mt-6 flex justify-between">
              <button
                onClick={onQuizExit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sair do Quiz
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedAnswer
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirmar Resposta
              </button>
            </div>
          )}
        </div>

        {/* Explanation */}
        {renderExplanation()}
      </div>
    );
  };

  // ============================================================================
  // ANSWER OPTIONS RENDERING
  // ============================================================================

  const renderAnswerOptions = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className={`
                  block p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-800">{option}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['true', 'false'].map((option) => (
              <label
                key={option}
                className={`
                  block p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-800">
                    {option === 'true' ? '✅ Verdadeiro' : '❌ Falso'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'text_input':
        return (
          <div>
            <input
              type="text"
              value={selectedAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Digite sua resposta..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RESULTS RENDERING
  // ============================================================================

  const renderResults = () => {
    const correctAnswers = quizState.answers.filter(a => a.isCorrect).length;
    const passingScore = quiz.passingScore || 70; // Default 70%
    const isPassed = quizState.score >= passingScore;
    
    return (
      <div className="text-center space-y-6">
        <div className={`text-6xl ${isPassed ? 'text-green-500' : 'text-orange-500'}`}>
          {isPassed ? '🎉' : '📚'}
        </div>
        
        <h2 className="text-2xl font-bold">
          {isPassed ? 'Parabéns!' : 'Continue Estudando!'}
        </h2>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {quizState.score}%
              </div>
              <div className="text-sm text-gray-600">Pontuação</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Acertos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(quizState.score >= passingScore 
                  ? (quiz.xpReward || 100) 
                  : (quiz.xpReward || 100) * 0.3
                )}
              </div>
              <div className="text-sm text-gray-600">XP Ganhos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((Date.now() - quizState.startTime) / 60000)}min
              </div>
              <div className="text-sm text-gray-600">Tempo</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={onQuizExit}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Voltar ao Dashboard
          </button>
          
          {!isPassed && (
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // TIMER DISPLAY
  // ============================================================================

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (quizState.showResults) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        {renderResults()}
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6 bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {quiz.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {quiz.description}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              quizState.timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'
            }`}>
              ⏱️ {formatTime(quizState.timeRemaining)}
            </div>
            <div className="text-xs text-gray-500">
              Nota mínima: {quiz.passingScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      {renderQuestion()}
    </div>
  );
}