/**
 * Hand Ranking Speed Drill
 * Show two hands, player taps which is stronger
 */

import { PlayingCard } from '../components/PlayingCard.js';
import { Timer } from '../components/Timer.js';
import { StreakCounter } from '../components/StreakCounter.js';
import { DrillResults } from '../components/DrillResults.js';
import { STARTING_HANDS, getHandStrength, getRandomHand, parseHand, formatHandNotation } from '../data/hands.js';
import { updateDrillProgress, getDrillProgress, getDrillThreshold, isDrillUnlocked } from '../storage.js';

const DRILL_ID = 'hand-ranking';
const TOTAL_QUESTIONS = 20;
const TIME_LIMIT = 30000; // 30 seconds for timed mode
const PASS_THRESHOLD = getDrillThreshold(DRILL_ID);

let currentQuestion = 0;
let correct = 0;
let timer = null;
let streakCounter = null;
let questionStartTime = 0;
let questionTimes = [];
let leftHand = null;
let rightHand = null;
let drillActive = false;
let container = null;

/**
 * Render the drill page
 */
export function renderHandRankingDrill(containerElement) {
  container = containerElement;

  if (!isDrillUnlocked(DRILL_ID)) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Drill Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the previous drill to unlock this one.</p>
        <a href="#/drills" class="btn btn--primary">Back to Drills</a>
      </div>
    `;
    return;
  }

  renderStartScreen();
}

/**
 * Render the start screen
 */
function renderStartScreen() {
  const previousBest = getDrillProgress(DRILL_ID);

  container.innerHTML = `
    <div class="drill-start container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <a href="#/drills" class="breadcrumb__link">Drills</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Hand Ranking</span>
        </nav>
        <h1 class="page-header__title">Hand Ranking Speed</h1>
        <p class="page-header__subtitle">Which starting hand is stronger?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">🃏</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            Two hands will appear side by side. Tap the one with higher preflop equity as fast as you can!
          </p>
          <div class="drill-start__meta">
            <span>${TOTAL_QUESTIONS} questions</span>
            <span>Pass: ${PASS_THRESHOLD}%</span>
          </div>
        </div>

        ${previousBest && previousBest.attempts > 0 ? `
          <div class="drill-start__best">
            <div class="drill-start__best-title">Your Best</div>
            <div class="drill-start__best-stats">
              <span>Score: ${Math.round(previousBest.bestScore)}%</span>
              <span>Streak: ${previousBest.bestStreak}</span>
              ${previousBest.bestTime ? `<span>Avg: ${formatTime(previousBest.bestTime)}</span>` : ''}
            </div>
          </div>
        ` : ''}

        <button class="btn btn--primary btn--lg drill-start__btn" id="start-drill-btn">
          Start Drill
        </button>
      </div>
    </div>
  `;

  document.getElementById('start-drill-btn').addEventListener('click', startDrill);
}

/**
 * Start the drill
 */
function startDrill() {
  // Reset state
  currentQuestion = 0;
  correct = 0;
  questionTimes = [];
  drillActive = true;

  const previousBest = getDrillProgress(DRILL_ID);

  // Create UI
  container.innerHTML = `
    <div class="drill-active">
      <div class="drill-header">
        <div class="drill-header__left">
          <button class="btn btn--ghost drill-header__back" id="quit-drill">&larr; Quit</button>
        </div>
        <div class="drill-header__center">
          <div class="drill-header__progress">
            <span id="question-number">1</span>/<span>${TOTAL_QUESTIONS}</span>
          </div>
        </div>
        <div class="drill-header__right">
          <div id="timer-container"></div>
        </div>
      </div>

      <div id="streak-container"></div>

      <div class="drill-question" id="drill-question">
        <div class="drill-question__prompt">Which hand is stronger?</div>

        <div class="hand-comparison">
          <button class="hand-comparison__choice" id="left-choice">
            <div class="hand-comparison__cards" id="left-cards"></div>
            <div class="hand-comparison__label">LEFT</div>
          </button>

          <div class="hand-comparison__vs">VS</div>

          <button class="hand-comparison__choice" id="right-choice">
            <div class="hand-comparison__cards" id="right-cards"></div>
            <div class="hand-comparison__label">RIGHT</div>
          </button>
        </div>
      </div>

      <div class="drill-feedback" id="drill-feedback"></div>
    </div>
  `;

  // Initialize timer (stopwatch mode for per-question timing)
  timer = new Timer({ mode: 'stopwatch' });
  timer.render(document.getElementById('timer-container'));

  // Initialize streak counter
  streakCounter = new StreakCounter({
    bestStreak: previousBest?.bestStreak || 0
  });
  streakCounter.render(document.getElementById('streak-container'));

  // Bind events
  document.getElementById('quit-drill').addEventListener('click', quitDrill);
  document.getElementById('left-choice').addEventListener('click', () => handleAnswer('left'));
  document.getElementById('right-choice').addEventListener('click', () => handleAnswer('right'));

  // Show countdown then start
  showCountdown(() => {
    timer.start();
    showNextQuestion();
  });
}

/**
 * Show countdown overlay
 */
function showCountdown(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'drill-countdown';
  overlay.innerHTML = '<div class="drill-countdown__number">3</div>';
  container.appendChild(overlay);

  let count = 3;
  const countdownEl = overlay.querySelector('.drill-countdown__number');

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.classList.remove('drill-countdown__number--pulse');
      void countdownEl.offsetWidth;
      countdownEl.classList.add('drill-countdown__number--pulse');
    } else if (count === 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.classList.add('drill-countdown__number--go');
    } else {
      clearInterval(interval);
      overlay.remove();
      callback();
    }
  }, 800);
}

/**
 * Show the next question
 */
function showNextQuestion() {
  if (currentQuestion >= TOTAL_QUESTIONS) {
    endDrill();
    return;
  }

  currentQuestion++;
  document.getElementById('question-number').textContent = currentQuestion;

  // Generate two different hands with different strengths
  const hands = generateHandPair();
  leftHand = hands.left;
  rightHand = hands.right;

  // Render cards
  renderHandCards('left-cards', leftHand);
  renderHandCards('right-cards', rightHand);

  // Reset choice buttons
  const leftChoice = document.getElementById('left-choice');
  const rightChoice = document.getElementById('right-choice');
  leftChoice.className = 'hand-comparison__choice';
  rightChoice.className = 'hand-comparison__choice';
  leftChoice.disabled = false;
  rightChoice.disabled = false;

  // Hide feedback
  document.getElementById('drill-feedback').innerHTML = '';
  document.getElementById('drill-feedback').className = 'drill-feedback';

  // Start question timer
  questionStartTime = performance.now();
  timer.startQuestion();
}

/**
 * Generate a pair of hands with different strengths
 */
function generateHandPair() {
  let hand1, hand2;
  let strength1, strength2;

  // Keep generating until we have hands with different strengths
  do {
    hand1 = getRandomHand();
    hand2 = getRandomHand();
    strength1 = getHandStrength(hand1);
    strength2 = getHandStrength(hand2);
  } while (hand1 === hand2 || Math.abs(strength1 - strength2) < 0.01);

  // Randomly assign to left and right
  if (Math.random() > 0.5) {
    return { left: hand1, right: hand2, stronger: strength1 > strength2 ? 'left' : 'right' };
  } else {
    return { left: hand2, right: hand1, stronger: strength2 > strength1 ? 'left' : 'right' };
  }
}

/**
 * Render cards for a hand
 */
function renderHandCards(containerId, handNotation) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const parsed = parseHand(handNotation);
  if (!parsed) return;

  const suits = parsed.suited ? ['s', 's'] : ['s', 'h'];

  const card1 = new PlayingCard(parsed.rank1, suits[0], { size: 'lg' });
  const card2 = new PlayingCard(parsed.rank2, suits[1], { size: 'lg' });

  card1.render(container);
  card2.render(container);
}

/**
 * Handle player's answer
 */
function handleAnswer(choice) {
  if (!drillActive) return;

  const questionTime = performance.now() - questionStartTime;
  questionTimes.push(questionTime);
  timer.endQuestion();

  const leftStrength = getHandStrength(leftHand);
  const rightStrength = getHandStrength(rightHand);
  const correctAnswer = leftStrength > rightStrength ? 'left' : 'right';
  const isCorrect = choice === correctAnswer;

  // Disable buttons
  document.getElementById('left-choice').disabled = true;
  document.getElementById('right-choice').disabled = true;

  // Show visual feedback
  const leftChoice = document.getElementById('left-choice');
  const rightChoice = document.getElementById('right-choice');

  if (isCorrect) {
    correct++;
    streakCounter.increment();

    if (choice === 'left') {
      leftChoice.classList.add('hand-comparison__choice--correct');
    } else {
      rightChoice.classList.add('hand-comparison__choice--correct');
    }

    showFeedback(true, questionTime);
  } else {
    streakCounter.break();

    // Show wrong answer in red, correct in green
    if (choice === 'left') {
      leftChoice.classList.add('hand-comparison__choice--wrong');
      rightChoice.classList.add('hand-comparison__choice--correct');
    } else {
      rightChoice.classList.add('hand-comparison__choice--wrong');
      leftChoice.classList.add('hand-comparison__choice--correct');
    }

    showFeedback(false, questionTime, leftHand, rightHand, leftStrength, rightStrength);
  }

  // Next question after delay
  setTimeout(() => {
    if (drillActive) {
      showNextQuestion();
    }
  }, isCorrect ? 800 : 1500);
}

/**
 * Show feedback
 */
function showFeedback(isCorrect, time, leftHand, rightHand, leftStrength, rightStrength) {
  const feedbackEl = document.getElementById('drill-feedback');

  if (isCorrect) {
    const speedClass = time < 2000 ? 'drill-feedback--fast' : time < 3000 ? 'drill-feedback--normal' : 'drill-feedback--slow';
    feedbackEl.className = `drill-feedback drill-feedback--correct ${speedClass}`;
    feedbackEl.innerHTML = `
      <span class="drill-feedback__icon">✓</span>
      <span class="drill-feedback__text">Correct!</span>
      <span class="drill-feedback__time">${formatTime(time)}</span>
    `;
  } else {
    feedbackEl.className = 'drill-feedback drill-feedback--wrong';
    feedbackEl.innerHTML = `
      <span class="drill-feedback__icon">✗</span>
      <span class="drill-feedback__text">
        ${formatHandNotation(rightStrength > leftStrength ? rightHand : leftHand)} is stronger
        (${Math.round((rightStrength > leftStrength ? rightStrength : leftStrength) * 100)}% vs ${Math.round((rightStrength > leftStrength ? leftStrength : rightStrength) * 100)}%)
      </span>
    `;
  }
}

/**
 * End the drill and show results
 */
function endDrill() {
  drillActive = false;
  timer.stop();

  const accuracy = (correct / TOTAL_QUESTIONS) * 100;
  const avgTime = questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length;
  const fastestTime = Math.min(...questionTimes);
  const bestStreak = streakCounter.getBestStreak();
  const passed = accuracy >= PASS_THRESHOLD;

  // Save progress
  const stats = {
    accuracy,
    avgTime,
    bestStreak,
    passed
  };
  updateDrillProgress(DRILL_ID, stats);

  // Get previous best for comparison
  const previousBest = getDrillProgress(DRILL_ID);

  // Clear container
  container.innerHTML = '<div class="drill-results-container"></div>';

  // Show results
  const results = new DrillResults({
    drillId: DRILL_ID,
    drillName: 'Hand Ranking Speed',
    previousBest,
    onPlayAgain: () => renderHandRankingDrill(container),
    onNextDrill: () => { window.location.hash = '#/drill/open-fold'; },
    onBackToHub: () => { window.location.hash = '#/drills'; }
  });

  results.render(container.querySelector('.drill-results-container'), {
    accuracy,
    avgTime,
    fastestTime,
    bestStreak,
    correct,
    total: TOTAL_QUESTIONS,
    passed,
    passThreshold: PASS_THRESHOLD
  });
}

/**
 * Quit the drill
 */
function quitDrill() {
  drillActive = false;
  if (timer) timer.stop();
  window.location.hash = '#/drills';
}

/**
 * Format time
 */
function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
