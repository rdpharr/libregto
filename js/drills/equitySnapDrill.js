/**
 * Equity Snap Drill
 * Show hand, player quickly estimates equity vs random hand
 */

import { PlayingCard } from '../components/PlayingCard.js';
import { Timer } from '../components/Timer.js';
import { StreakCounter } from '../components/StreakCounter.js';
import { DrillResults } from '../components/DrillResults.js';
import { getRandomHand, parseHand, formatHandNotation, getHandStrength } from '../data/hands.js';
import { updateDrillProgress, getDrillProgress, getDrillThreshold, isDrillUnlocked } from '../storage.js';

const DRILL_ID = 'equity-snap';
const TOTAL_QUESTIONS = 15;
const PASS_THRESHOLD = getDrillThreshold(DRILL_ID);

let currentQuestion = 0;
let correct = 0;
let timer = null;
let streakCounter = null;
let questionStartTime = 0;
let questionTimes = [];
let currentHand = null;
let currentEquity = 0;
let correctOption = -1;
let drillActive = false;
let container = null;

/**
 * Render the drill page
 */
export function renderEquitySnapDrill(containerElement) {
  container = containerElement;

  if (!isDrillUnlocked(DRILL_ID)) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Drill Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Open or Fold drill to unlock this one.</p>
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
          <span class="breadcrumb__current">Equity Snap</span>
        </nav>
        <h1 class="page-header__title">Equity Snap</h1>
        <p class="page-header__subtitle">How much equity does this hand have vs a random hand?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">📈</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            You'll see a starting hand. Quickly pick the range that contains its equity vs a random hand.
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
        <div class="drill-question__prompt">What's the equity vs a random hand?</div>

        <div class="drill-hand-display" id="hand-display"></div>

        <div class="equity-options" id="equity-options">
          <button class="btn equity-options__btn" data-option="0"></button>
          <button class="btn equity-options__btn" data-option="1"></button>
          <button class="btn equity-options__btn" data-option="2"></button>
          <button class="btn equity-options__btn" data-option="3"></button>
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
  document.querySelectorAll('.equity-options__btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.option)));
  });

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
 * Generate equity options for a given equity value
 */
function generateOptions(equity) {
  // Convert to percentage (0-100)
  const equityPct = equity * 100;

  // Create ranges of 10% each
  // Find which 10% bucket the equity falls into
  const correctBucket = Math.floor(equityPct / 10);

  // Generate 4 consecutive ranges centered around the correct one
  let startBucket;
  if (correctBucket <= 1) {
    startBucket = 0;
  } else if (correctBucket >= 8) {
    startBucket = 6;
  } else {
    // Center the options around the correct bucket
    startBucket = correctBucket - 1;
  }

  const options = [];
  for (let i = 0; i < 4; i++) {
    const bucket = startBucket + i;
    const low = bucket * 10;
    const high = (bucket + 1) * 10;
    options.push({
      label: `${low}-${high}%`,
      low,
      high
    });
  }

  // Find which option is correct
  correctOption = options.findIndex(opt => equityPct >= opt.low && equityPct < opt.high);
  if (correctOption === -1) {
    // Edge case: exactly 100%
    correctOption = 3;
  }

  return options;
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

  // Get random hand and its equity
  currentHand = getRandomHand();
  currentEquity = getHandStrength(currentHand);

  // Generate options
  const options = generateOptions(currentEquity);

  // Render hand
  renderHand('hand-display', currentHand);

  // Update option buttons
  const buttons = document.querySelectorAll('.equity-options__btn');
  buttons.forEach((btn, i) => {
    btn.textContent = options[i].label;
    btn.className = 'btn equity-options__btn';
    btn.disabled = false;
  });

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

  const suits = parsed.suited ? ['d', 'd'] : ['d', 'c'];

  const card1 = new PlayingCard(parsed.ranks[0], suits[0], { size: 'lg' });
  const card2 = new PlayingCard(parsed.ranks[1], suits[1], { size: 'lg' });

  card1.render(container);
  card2.render(container);
}

/**
 * Handle player's answer
 */
function handleAnswer(optionIndex) {
  if (!drillActive) return;

  const questionTime = performance.now() - questionStartTime;
  questionTimes.push(questionTime);
  timer.endQuestion();

  const isCorrect = optionIndex === correctOption;

  // Disable buttons
  const buttons = document.querySelectorAll('.equity-options__btn');
  buttons.forEach(btn => btn.disabled = true);

  // Show visual feedback
  if (isCorrect) {
    correct++;
    streakCounter.increment();

    buttons[optionIndex].classList.add('equity-options__btn--correct');
    showFeedback(true, questionTime);
  } else {
    streakCounter.break();

    buttons[optionIndex].classList.add('equity-options__btn--wrong');
    buttons[correctOption].classList.add('equity-options__btn--correct');
    showFeedback(false, questionTime);
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
function showFeedback(isCorrect, time) {
  const feedbackEl = document.getElementById('drill-feedback');
  const actualEquity = Math.round(currentEquity * 100);

  if (isCorrect) {
    const speedClass = time < 2000 ? 'drill-feedback--fast' : time < 3000 ? 'drill-feedback--normal' : 'drill-feedback--slow';
    feedbackEl.className = `drill-feedback drill-feedback--correct ${speedClass}`;
    feedbackEl.innerHTML = `
      <span class="drill-feedback__icon">✓</span>
      <span class="drill-feedback__text">Correct! ${formatHandNotation(currentHand)} = ${actualEquity}%</span>
      <span class="drill-feedback__time">${formatTime(time)}</span>
    `;
  } else {
    feedbackEl.className = 'drill-feedback drill-feedback--wrong';
    feedbackEl.innerHTML = `
      <span class="drill-feedback__icon">✗</span>
      <span class="drill-feedback__text">
        ${formatHandNotation(currentHand)} has ${actualEquity}% equity
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
    drillName: 'Equity Snap',
    previousBest,
    onPlayAgain: () => renderEquitySnapDrill(container),
    onNextDrill: () => { window.location.hash = '#/drill/range-check'; },
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
