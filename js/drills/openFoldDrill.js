/**
 * Open or Fold Drill
 * Show hand + position, player decides to open or fold
 */

import { PlayingCard } from '../components/PlayingCard.js';
import { Timer } from '../components/Timer.js';
import { StreakCounter } from '../components/StreakCounter.js';
import { DrillResults } from '../components/DrillResults.js';
import { getRandomHand, parseHand, formatHandNotation } from '../data/hands.js';
import { isHandInRange, POSITIONS, getOpeningRangeForPosition } from '../data/ranges.js';
import { updateDrillProgress, getDrillProgress, getDrillThreshold, isDrillUnlocked } from '../storage.js';

const DRILL_ID = 'open-fold';
const TOTAL_QUESTIONS = 25;
const PASS_THRESHOLD = getDrillThreshold(DRILL_ID);

// Positions to use (excluding BB which doesn't open)
const DRILL_POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB'];

let currentQuestion = 0;
let correct = 0;
let timer = null;
let streakCounter = null;
let questionStartTime = 0;
let questionTimes = [];
let currentHand = null;
let currentPosition = null;
let drillActive = false;
let container = null;

// Track stats by position
let positionStats = {};

/**
 * Render the drill page
 */
export function renderOpenFoldDrill(containerElement) {
  container = containerElement;

  if (!isDrillUnlocked(DRILL_ID)) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Drill Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Hand Ranking drill to unlock this one.</p>
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
          <span class="breadcrumb__current">Open or Fold</span>
        </nav>
        <h1 class="page-header__title">Open or Fold</h1>
        <p class="page-header__subtitle">Would you open this hand from this position?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">📊</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            You'll see a starting hand and a position. Decide whether to OPEN (raise) or FOLD based on GTO opening ranges.
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
  positionStats = {};
  DRILL_POSITIONS.forEach(pos => {
    positionStats[pos] = { total: 0, correct: 0 };
  });

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
        <div class="drill-question__position" id="position-display"></div>
        <div class="drill-question__prompt">Should you open?</div>

        <div class="drill-hand-display" id="hand-display"></div>

        <div class="drill-actions">
          <button class="btn drill-actions__btn drill-actions__btn--open" id="open-btn">
            OPEN
          </button>
          <button class="btn drill-actions__btn drill-actions__btn--fold" id="fold-btn">
            FOLD
          </button>
        </div>
      </div>

      <div class="drill-feedback" id="drill-feedback"></div>
    </div>
  `;

  // Initialize timer
  timer = new Timer({ mode: 'stopwatch' });
  timer.render(document.getElementById('timer-container'));

  // Initialize streak counter
  streakCounter = new StreakCounter({
    bestStreak: previousBest?.bestStreak || 0
  });
  streakCounter.render(document.getElementById('streak-container'));

  // Bind events
  document.getElementById('quit-drill').addEventListener('click', quitDrill);
  document.getElementById('open-btn').addEventListener('click', () => handleAnswer(true));
  document.getElementById('fold-btn').addEventListener('click', () => handleAnswer(false));

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

  // Pick random position and hand
  currentPosition = DRILL_POSITIONS[Math.floor(Math.random() * DRILL_POSITIONS.length)];
  currentHand = getRandomHand();

  // Display position
  const positionDisplay = document.getElementById('position-display');
  positionDisplay.textContent = currentPosition;
  positionDisplay.className = 'drill-question__position drill-question__position--' + currentPosition.toLowerCase();

  // Render hand
  renderHand('hand-display', currentHand);

  // Reset buttons
  const openBtn = document.getElementById('open-btn');
  const foldBtn = document.getElementById('fold-btn');
  openBtn.className = 'btn drill-actions__btn drill-actions__btn--open';
  foldBtn.className = 'btn drill-actions__btn drill-actions__btn--fold';
  openBtn.disabled = false;
  foldBtn.disabled = false;

  // Hide feedback
  document.getElementById('drill-feedback').innerHTML = '';
  document.getElementById('drill-feedback').className = 'drill-feedback';

  // Start question timer
  questionStartTime = performance.now();
  timer.startQuestion();
}

/**
 * Render a hand
 */
function renderHand(containerId, handNotation) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const parsed = parseHand(handNotation);
  if (!parsed) return;

  const suits = parsed.suited ? ['h', 'h'] : ['h', 's'];

  const card1 = new PlayingCard(parsed.ranks[0], suits[0], { size: 'lg' });
  const card2 = new PlayingCard(parsed.ranks[1], suits[1], { size: 'lg' });

  card1.render(container);
  card2.render(container);
}

/**
 * Handle player's answer
 */
function handleAnswer(shouldOpen) {
  if (!drillActive) return;

  const questionTime = performance.now() - questionStartTime;
  questionTimes.push(questionTime);
  timer.endQuestion();

  const inRange = isHandInRange(currentHand, currentPosition);
  const isCorrect = shouldOpen === inRange;

  // Track position stats
  positionStats[currentPosition].total++;
  if (isCorrect) {
    positionStats[currentPosition].correct++;
  }

  // Disable buttons
  document.getElementById('open-btn').disabled = true;
  document.getElementById('fold-btn').disabled = true;

  // Show visual feedback
  const openBtn = document.getElementById('open-btn');
  const foldBtn = document.getElementById('fold-btn');

  if (isCorrect) {
    correct++;
    streakCounter.increment();

    if (shouldOpen) {
      openBtn.classList.add('drill-actions__btn--correct');
    } else {
      foldBtn.classList.add('drill-actions__btn--correct');
    }

    showFeedback(true, questionTime);
  } else {
    streakCounter.break();

    if (shouldOpen) {
      openBtn.classList.add('drill-actions__btn--wrong');
      foldBtn.classList.add('drill-actions__btn--correct');
    } else {
      foldBtn.classList.add('drill-actions__btn--wrong');
      openBtn.classList.add('drill-actions__btn--correct');
    }

    showFeedback(false, questionTime, inRange);
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
function showFeedback(isCorrect, time, inRange) {
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
        ${formatHandNotation(currentHand)} from ${currentPosition} is ${inRange ? 'an OPEN' : 'a FOLD'}
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
    drillName: 'Open or Fold',
    previousBest,
    onPlayAgain: () => renderOpenFoldDrill(container),
    onNextDrill: () => { window.location.hash = '#/drill/equity-snap'; },
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

  // Add position breakdown after results
  addPositionBreakdown();
}

/**
 * Add position breakdown to results
 */
function addPositionBreakdown() {
  const resultsContent = container.querySelector('.drill-results__content');
  if (!resultsContent) return;

  const breakdownHtml = `
    <div class="drill-results__breakdown">
      <h4 class="drill-results__breakdown-title">Accuracy by Position</h4>
      <div class="drill-results__breakdown-grid">
        ${DRILL_POSITIONS.map(pos => {
          const stats = positionStats[pos];
          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          return `
            <div class="drill-results__breakdown-item">
              <span class="drill-results__breakdown-pos">${pos}</span>
              <span class="drill-results__breakdown-value ${pct >= 75 ? 'drill-results__breakdown-value--good' : ''}">${pct}%</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Insert before actions
  const actions = resultsContent.querySelector('.drill-results__actions');
  if (actions) {
    actions.insertAdjacentHTML('beforebegin', breakdownHtml);
  }
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
