/**
 * Position Speed Drill
 * Test knowledge of position with various question types
 */

import { Timer } from '../components/Timer.js';
import { StreakCounter } from '../components/StreakCounter.js';
import { DrillResults } from '../components/DrillResults.js';
import { createDifficultySelector } from '../components/DifficultySelector.js';
import { showCountdown } from '../components/Countdown.js';
import { formatTime, updateStartScreenForDifficulty } from '../utils/difficultyUtils.js';
import { updateDrillProgress, getDrillProgress, getDrillThreshold, isDrillUnlocked, isDrillHardModeUnlocked } from '../storage.js';
import { renderPositionTableMini } from '../components/PositionTableMini.js';

const DRILL_ID = 'position-speed';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    totalQuestions: 15,
    passThreshold: 80,
    correctDelay: 800,
    wrongDelay: 1500,
    useAdjacentOnly: false,
    questionTypeWeights: null  // Equal weights
  },
  hard: {
    totalQuestions: 20,
    passThreshold: 85,
    correctDelay: 500,
    wrongDelay: 1000,
    useAdjacentOnly: true,  // Only adjacent positions (harder to distinguish)
    // Weight toward harder question types
    questionTypeWeights: {
      'preflop_first': 0.30,
      'postflop_first': 0.30,
      'has_position': 0.15,
      'best_position': 0.10,
      'opening_wider': 0.15
    }
  }
};

// Position data
const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

// Preflop action order (SB acts first preflop after blinds are posted)
const PREFLOP_ORDER = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

// Postflop action order (SB acts first)
const POSTFLOP_ORDER = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];

// Position advantage (higher = better)
const POSITION_VALUE = {
  'UTG': 1,
  'MP': 2,
  'CO': 3,
  'BTN': 4,
  'SB': 0.5,  // Worst position postflop
  'BB': 0.7   // Second worst position postflop
};

// Question types
const QUESTION_TYPES = [
  'preflop_first',   // Which acts first preflop?
  'postflop_first',  // Which acts first postflop?
  'has_position',    // Which has position over the other?
  'best_position',   // Which is the best position?
  'opening_wider'    // Which opens wider?
];

let currentQuestion = 0;
let correct = 0;
let timer = null;
let streakCounter = null;
let questionStartTime = 0;
let questionTimes = [];
let currentQuestionType = null;
let correctAnswer = null;
let drillActive = false;
let container = null;
let selectedDifficulty = 'easy';
let config = DIFFICULTY_CONFIG.easy;

/**
 * Render the drill page
 */
export function renderPositionDrill(containerElement) {
  container = containerElement;

  if (!isDrillUnlocked(DRILL_ID)) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Drill Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Range Check drill to unlock this one.</p>
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
          <span class="breadcrumb__current">Position Speed</span>
        </nav>
        <h1 class="page-header__title">Position Speed</h1>
        <p class="page-header__subtitle">Test your knowledge of positional advantage</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">♠️</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            Answer questions about position: action order, positional advantage, and range width.
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
        <div class="drill-question__prompt" id="question-prompt"></div>

        <div id="position-table-mini"></div>

        <div class="position-options" id="position-options"></div>
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

  // Show countdown then start
  showCountdown(container, () => {
    timer.start();
    showNextQuestion();
  });
}

// Adjacent position pairs (for hard mode)
const ADJACENT_PAIRS = [
  ['UTG', 'MP'],
  ['MP', 'CO'],
  ['CO', 'BTN'],
  ['BTN', 'SB'],
  ['SB', 'BB']
];

/**
 * Pick a question type based on weights (or randomly if no weights)
 */
function pickQuestionType() {
  const weights = config.questionTypeWeights;
  if (!weights) {
    return QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
  }

  const random = Math.random();
  let cumulative = 0;

  for (const type of QUESTION_TYPES) {
    cumulative += weights[type] || 0;
    if (random < cumulative) {
      return type;
    }
  }
  return QUESTION_TYPES[0];
}

/**
 * Generate a random question
 */
function generateQuestion() {
  const type = pickQuestionType();
  let question = '';
  let options = [];
  let correct = '';

  let pos1, pos2;

  // In hard mode, use adjacent positions only (harder to distinguish)
  if (config.useAdjacentOnly) {
    const pair = ADJACENT_PAIRS[Math.floor(Math.random() * ADJACENT_PAIRS.length)];
    pos1 = pair[0];
    pos2 = pair[1];
  } else {
    // Get two random different positions
    const pos1Index = Math.floor(Math.random() * POSITIONS.length);
    let pos2Index;
    do {
      pos2Index = Math.floor(Math.random() * POSITIONS.length);
    } while (pos2Index === pos1Index);
    pos1 = POSITIONS[pos1Index];
    pos2 = POSITIONS[pos2Index];
  }

  switch (type) {
    case 'preflop_first':
      question = 'Who acts FIRST preflop?';
      options = [pos1, pos2];
      // Lower index in PREFLOP_ORDER acts first
      correct = PREFLOP_ORDER.indexOf(pos1) < PREFLOP_ORDER.indexOf(pos2) ? pos1 : pos2;
      break;

    case 'postflop_first':
      question = 'Who acts FIRST postflop?';
      options = [pos1, pos2];
      // Lower index in POSTFLOP_ORDER acts first
      correct = POSTFLOP_ORDER.indexOf(pos1) < POSTFLOP_ORDER.indexOf(pos2) ? pos1 : pos2;
      break;

    case 'has_position':
      question = 'Who has POSITION (acts last)?';
      options = [pos1, pos2];
      // Higher POSITION_VALUE has position
      correct = POSITION_VALUE[pos1] > POSITION_VALUE[pos2] ? pos1 : pos2;
      break;

    case 'best_position':
      question = 'Which is the BETTER position?';
      options = [pos1, pos2];
      correct = POSITION_VALUE[pos1] > POSITION_VALUE[pos2] ? pos1 : pos2;
      break;

    case 'opening_wider':
      // Only use opening positions (not BB)
      const openingPositions = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
      const op1 = openingPositions[Math.floor(Math.random() * openingPositions.length)];
      let op2;
      do {
        op2 = openingPositions[Math.floor(Math.random() * openingPositions.length)];
      } while (op2 === op1);

      question = 'Which position opens WIDER?';
      options = [op1, op2];
      // Later positions open wider (higher value)
      correct = POSITION_VALUE[op1] > POSITION_VALUE[op2] ? op1 : op2;
      break;
  }

  // Shuffle options
  if (Math.random() > 0.5) {
    options = [options[1], options[0]];
  }

  return { question, options, correct, type };
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

  // Generate question
  const q = generateQuestion();
  currentQuestionType = q.type;
  correctAnswer = q.correct;

  // Display question
  document.getElementById('question-prompt').textContent = q.question;

  // Update mini table highlighting both positions
  document.getElementById('position-table-mini').innerHTML = renderPositionTableMini(q.options);

  // Display options
  const optionsContainer = document.getElementById('position-options');
  optionsContainer.innerHTML = q.options.map(pos => `
    <button class="btn position-options__btn" data-position="${pos}">
      <span class="position-options__label">${pos}</span>
      <span class="position-options__desc">${getPositionDescription(pos)}</span>
    </button>
  `).join('');

  // Bind click events
  optionsContainer.querySelectorAll('.position-options__btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.position));
  });

  // Hide feedback
  document.getElementById('drill-feedback').innerHTML = '';
  document.getElementById('drill-feedback').className = 'drill-feedback';

  // Start question timer
  questionStartTime = performance.now();
  timer.startQuestion();
}

/**
 * Get short description for position
 */
function getPositionDescription(pos) {
  const descriptions = {
    'UTG': 'Under the Gun',
    'MP': 'Middle Position',
    'CO': 'Cutoff',
    'BTN': 'Button',
    'SB': 'Small Blind',
    'BB': 'Big Blind'
  };
  return descriptions[pos] || '';
}

/**
 * Handle player's answer
 */
function handleAnswer(answer) {
  if (!drillActive) return;

  const questionTime = performance.now() - questionStartTime;
  questionTimes.push(questionTime);
  timer.endQuestion();

  const isCorrect = answer === correctAnswer;

  // Disable buttons
  document.querySelectorAll('.position-options__btn').forEach(btn => {
    btn.disabled = true;

    if (btn.dataset.position === correctAnswer) {
      btn.classList.add('position-options__btn--correct');
    } else if (btn.dataset.position === answer && !isCorrect) {
      btn.classList.add('position-options__btn--wrong');
    }
  });

  if (isCorrect) {
    correct++;
    streakCounter.increment();
    showFeedback(true, questionTime);
  } else {
    streakCounter.break();
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
        ${correctAnswer} is correct
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
    drillName: 'Position Speed' + (selectedDifficulty === 'hard' ? ' (Hard)' : ''),
    previousBest,
    onPlayAgain: () => renderPositionDrill(container),
    onNextDrill: () => { window.location.hash = '#/drills'; }, // Last drill, go back to hub
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
