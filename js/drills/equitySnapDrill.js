/**
 * Equity Snap Drill
 * Show hand, player quickly estimates equity vs random hand
 */

import { PlayingCard } from '../components/PlayingCard.js';
import { Timer } from '../components/Timer.js';
import { StreakCounter } from '../components/StreakCounter.js';
import { DrillResults } from '../components/DrillResults.js';
import { createDifficultySelector } from '../components/DifficultySelector.js';
import { showCountdown } from '../components/Countdown.js';
import { formatTime, updateStartScreenForDifficulty } from '../utils/difficultyUtils.js';
import { getRandomHand, parseHand, formatHandNotation, getHandStrength } from '../data/hands.js';
import { updateDrillProgress, getDrillProgress, getDrillThreshold, isDrillUnlocked, isDrillHardModeUnlocked } from '../storage.js';

const DRILL_ID = 'equity-snap';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    totalQuestions: 15,
    passThreshold: 70,
    bucketWidth: 15,
    numOptions: 4,
    correctDelay: 800,
    wrongDelay: 1500
  },
  hard: {
    totalQuestions: 20,
    passThreshold: 80,
    bucketWidth: 10,  // Tighter ranges
    numOptions: 5,    // More options
    correctDelay: 500,
    wrongDelay: 1000
  }
};

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
let selectedDifficulty = 'easy';
let config = DIFFICULTY_CONFIG.easy;

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
  const progress = getDrillProgress(DRILL_ID);
  const hardUnlocked = isDrillHardModeUnlocked(DRILL_ID);

  config = DIFFICULTY_CONFIG[selectedDifficulty];

  const currentStats = selectedDifficulty === 'hard' && progress?.hard
    ? progress.hard
    : progress;

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
          <div class="drill-start__meta" id="drill-meta">
            <span>${config.totalQuestions} questions</span>
            <span>Pass: ${config.passThreshold}%</span>
          </div>
        </div>

        <div id="difficulty-selector-container"></div>

        ${currentStats && (currentStats.attempts > 0 || (progress?.hard?.attempts > 0)) ? `
          <div class="drill-start__best" id="best-stats">
            <div class="drill-start__best-title">Your Best</div>
            <div class="drill-start__best-stats">
              <span>Score: ${Math.round(currentStats.bestScore || 0)}%</span>
              <span>Streak: ${currentStats.bestStreak || 0}</span>
              ${currentStats.bestTime ? `<span>Avg: ${formatTime(currentStats.bestTime)}</span>` : ''}
            </div>
          </div>
        ` : ''}

        <button class="btn btn--primary btn--lg drill-start__btn" id="start-drill-btn">
          Start Drill
        </button>
      </div>
    </div>
  `;

  // Render difficulty selector
  const selectorContainer = document.getElementById('difficulty-selector-container');
  const selector = createDifficultySelector({
    selected: selectedDifficulty,
    hardUnlocked: hardUnlocked,
    easyStats: progress ? { bestScore: progress.bestScore, bestStreak: progress.bestStreak, bestTime: progress.bestTime } : null,
    hardStats: progress?.hard ? { bestScore: progress.hard.bestScore, bestStreak: progress.hard.bestStreak, bestTime: progress.hard.bestTime } : null,
    onSelect: (difficulty) => {
      selectedDifficulty = difficulty;
      config = DIFFICULTY_CONFIG[difficulty];
      updateStartScreenForDifficulty(config, selectedDifficulty, progress);
    }
  });
  selectorContainer.appendChild(selector);

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

  config = DIFFICULTY_CONFIG[selectedDifficulty];

  const previousBest = getDrillProgress(DRILL_ID);
  const previousBestForDifficulty = selectedDifficulty === 'hard' && previousBest?.hard
    ? previousBest.hard
    : previousBest;

  // Generate option buttons based on config
  const optionButtons = Array(config.numOptions).fill(0).map((_, i) =>
    `<button class="btn equity-options__btn" data-option="${i}"></button>`
  ).join('\n          ');

  // Create UI
  container.innerHTML = `
    <div class="drill-active">
      <div class="drill-header">
        <div class="drill-header__left">
          <button class="btn btn--ghost drill-header__back" id="quit-drill">&larr; Quit</button>
        </div>
        <div class="drill-header__center">
          <div class="drill-header__progress">
            <span id="question-number">1</span>/<span>${config.totalQuestions}</span>
            ${selectedDifficulty === 'hard' ? '<span class="drill-header__difficulty">HARD</span>' : ''}
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
          ${optionButtons}
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
    bestStreak: previousBestForDifficulty?.bestStreak || 0
  });
  streakCounter.render(document.getElementById('streak-container'));

  // Bind events
  document.getElementById('quit-drill').addEventListener('click', quitDrill);
  document.querySelectorAll('.equity-options__btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.option)));
  });

  // Show countdown then start
  showCountdown(container, () => {
    timer.start();
    showNextQuestion();
  });
}

/**
 * Generate equity options for a given equity value
 */
function generateOptions(equity) {
  const equityPct = equity * 100;
  const RANGE_WIDTH = config.bucketWidth;
  const NUM_OPTIONS = config.numOptions;
  const TOTAL_SPAN = RANGE_WIDTH * NUM_OPTIONS;

  // Find the bucket containing the equity
  const correctLow = Math.floor(equityPct / RANGE_WIDTH) * RANGE_WIDTH;

  // Pick a random position for the correct answer
  const targetPosition = Math.floor(Math.random() * NUM_OPTIONS);

  // Calculate start so the correct range lands at targetPosition
  let start = correctLow - targetPosition * RANGE_WIDTH;

  // Clamp so all ranges stay within 0-100
  start = Math.max(0, Math.min(start, 100 - TOTAL_SPAN));

  // Build consecutive ascending ranges
  const options = [];
  for (let i = 0; i < NUM_OPTIONS; i++) {
    const low = start + i * RANGE_WIDTH;
    const high = low + RANGE_WIDTH;
    options.push({
      label: `${low}-${high}%`,
      low,
      high
    });
  }

  // Find which option contains the equity
  correctOption = options.findIndex(opt => equityPct >= opt.low && equityPct < opt.high);
  if (correctOption === -1) {
    // Edge case: equity exactly at upper boundary
    correctOption = NUM_OPTIONS - 1;
  }

  return options;
}

/**
 * Show the next question
 */
function showNextQuestion() {
  if (currentQuestion >= config.totalQuestions) {
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

  const card1 = new PlayingCard(parsed.rank1, suits[0], { size: 'lg' });
  const card2 = new PlayingCard(parsed.rank2, suits[1], { size: 'lg' });

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
  }, isCorrect ? config.correctDelay : config.wrongDelay);
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

  const totalQuestions = config.totalQuestions;
  const passThreshold = config.passThreshold;

  const accuracy = (correct / totalQuestions) * 100;
  const avgTime = questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length;
  const fastestTime = Math.min(...questionTimes);
  const bestStreak = streakCounter.getBestStreak();
  const passed = accuracy >= passThreshold;

  // Save progress with difficulty
  const stats = {
    accuracy,
    avgTime,
    bestStreak,
    passed
  };
  updateDrillProgress(DRILL_ID, stats, selectedDifficulty);

  // Get previous best for comparison
  const progress = getDrillProgress(DRILL_ID);
  const previousBest = selectedDifficulty === 'hard' && progress?.hard
    ? { ...progress, bestScore: progress.hard.bestScore, bestStreak: progress.hard.bestStreak, bestTime: progress.hard.bestTime }
    : progress;

  // Clear container
  container.innerHTML = '<div class="drill-results-container"></div>';

  // Show results
  const results = new DrillResults({
    drillId: DRILL_ID,
    drillName: 'Equity Snap' + (selectedDifficulty === 'hard' ? ' (Hard)' : ''),
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
    total: totalQuestions,
    passed,
    passThreshold
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
