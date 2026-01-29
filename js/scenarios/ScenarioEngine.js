/**
 * ScenarioEngine
 * Core engine for managing scenario state, questions, and validation
 */

import { updateScenarioProgress, getScenarioProgress, getScenarioThreshold } from '../storage.js';

/**
 * ScenarioEngine class
 * Handles scenario flow, question generation, answer validation, and stats tracking
 */
export class ScenarioEngine {
  /**
   * Create a ScenarioEngine
   * @param {Object} config - Scenario configuration
   * @param {string} config.id - Scenario ID
   * @param {string} config.name - Display name
   * @param {number} config.totalQuestions - Number of questions per session
   * @param {Function} config.generateQuestion - Function to generate a question
   * @param {Function} config.validateAnswer - Function to validate answer
   * @param {Function} config.getExplanation - Function to get explanation for answer
   * @param {Object} callbacks - Event callbacks
   */
  constructor(config, callbacks = {}) {
    this.config = {
      id: config.id,
      name: config.name,
      totalQuestions: config.totalQuestions || 20,
      generateQuestion: config.generateQuestion,
      validateAnswer: config.validateAnswer,
      getExplanation: config.getExplanation,
      getRangeDisplay: config.getRangeDisplay || null
    };

    this.callbacks = {
      onQuestionReady: callbacks.onQuestionReady || (() => {}),
      onAnswerResult: callbacks.onAnswerResult || (() => {}),
      onScenarioEnd: callbacks.onScenarioEnd || (() => {}),
      onStatsUpdate: callbacks.onStatsUpdate || (() => {})
    };

    this.reset();
  }

  /**
   * Reset the engine state
   */
  reset() {
    this.state = {
      active: false,
      currentQuestion: 0,
      correct: 0,
      currentQuestionData: null,
      questionStartTime: 0,
      questionTimes: [],
      answers: [], // Track all answers for review
      categoryStats: {} // Track accuracy by category/position
    };
  }

  /**
   * Start the scenario
   */
  start() {
    this.reset();
    this.state.active = true;
    this.nextQuestion();
  }

  /**
   * Stop the scenario
   */
  stop() {
    this.state.active = false;
  }

  /**
   * Move to the next question
   */
  nextQuestion() {
    if (!this.state.active) return;

    if (this.state.currentQuestion >= this.config.totalQuestions) {
      this.endScenario();
      return;
    }

    this.state.currentQuestion++;
    this.state.questionStartTime = performance.now();

    // Generate new question
    this.state.currentQuestionData = this.config.generateQuestion(this.state);

    // Notify callback
    this.callbacks.onQuestionReady({
      questionNumber: this.state.currentQuestion,
      totalQuestions: this.config.totalQuestions,
      questionData: this.state.currentQuestionData
    });

    this.callbacks.onStatsUpdate(this.getStats());
  }

  /**
   * Submit an answer
   * @param {string} answer - The player's answer
   * @returns {Object} Result of the answer
   */
  submitAnswer(answer) {
    if (!this.state.active || !this.state.currentQuestionData) {
      return null;
    }

    const questionTime = performance.now() - this.state.questionStartTime;
    this.state.questionTimes.push(questionTime);

    // Validate the answer
    const validation = this.config.validateAnswer(
      answer,
      this.state.currentQuestionData
    );

    const isCorrect = validation.correct;

    // Update stats
    if (isCorrect) {
      this.state.correct++;
    }

    // Track category stats
    const category = this.state.currentQuestionData.category || 'default';
    if (!this.state.categoryStats[category]) {
      this.state.categoryStats[category] = { total: 0, correct: 0 };
    }
    this.state.categoryStats[category].total++;
    if (isCorrect) {
      this.state.categoryStats[category].correct++;
    }

    // Get explanation
    const explanation = this.config.getExplanation(
      this.state.currentQuestionData,
      validation
    );

    // Get range display if available
    const rangeDisplay = this.config.getRangeDisplay
      ? this.config.getRangeDisplay(this.state.currentQuestionData)
      : null;

    // Record the answer
    const answerRecord = {
      questionNumber: this.state.currentQuestion,
      questionData: this.state.currentQuestionData,
      playerAnswer: answer,
      correctAnswer: validation.correctAnswer,
      isCorrect,
      time: questionTime,
      explanation
    };
    this.state.answers.push(answerRecord);

    // Build result object
    const result = {
      isCorrect,
      playerAnswer: answer,
      correctAnswer: validation.correctAnswer,
      explanation,
      rangeDisplay,
      time: questionTime,
      stats: this.getStats()
    };

    // Notify callback
    this.callbacks.onAnswerResult(result);

    return result;
  }

  /**
   * End the scenario and calculate final stats
   */
  endScenario() {
    this.state.active = false;

    const stats = this.getFinalStats();

    // Save progress
    updateScenarioProgress(this.config.id, stats);

    // Get previous best for comparison
    const previousBest = getScenarioProgress(this.config.id);

    // Notify callback
    this.callbacks.onScenarioEnd({
      stats,
      previousBest,
      passed: stats.accuracy >= getScenarioThreshold(this.config.id),
      passThreshold: getScenarioThreshold(this.config.id),
      categoryStats: this.state.categoryStats,
      answers: this.state.answers
    });
  }

  /**
   * Get current stats
   * @returns {Object} Current stats
   */
  getStats() {
    const total = this.state.currentQuestion;
    const correct = this.state.correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      currentQuestion: this.state.currentQuestion,
      totalQuestions: this.config.totalQuestions,
      correct,
      total,
      accuracy
    };
  }

  /**
   * Get final stats for the scenario
   * @returns {Object} Final stats
   */
  getFinalStats() {
    const total = this.config.totalQuestions;
    const correct = this.state.correct;
    const accuracy = Math.round((correct / total) * 100);

    const avgTime = this.state.questionTimes.length > 0
      ? this.state.questionTimes.reduce((a, b) => a + b, 0) / this.state.questionTimes.length
      : 0;

    const fastestTime = this.state.questionTimes.length > 0
      ? Math.min(...this.state.questionTimes)
      : 0;

    return {
      correct,
      total,
      accuracy,
      avgTime,
      fastestTime,
      passed: accuracy >= getScenarioThreshold(this.config.id)
    };
  }

  /**
   * Check if the scenario is active
   * @returns {boolean}
   */
  isActive() {
    return this.state.active;
  }

  /**
   * Get current question data
   * @returns {Object|null}
   */
  getCurrentQuestion() {
    return this.state.currentQuestionData;
  }

  /**
   * Get category stats
   * @returns {Object}
   */
  getCategoryStats() {
    return { ...this.state.categoryStats };
  }
}

/**
 * Helper function to shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Helper function to pick a random item from an array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item
 */
export function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function to pick N random items from an array (no duplicates)
 * @param {Array} array - Array to pick from
 * @param {number} n - Number of items to pick
 * @returns {Array} Array of random items
 */
export function randomPickN(array, n) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Format time in milliseconds to human readable string
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
export function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
