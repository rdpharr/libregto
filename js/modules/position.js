/**
 * Module 1.2: Position
 * Understand positional advantage in poker
 */

import { POSITIONS, getRangePercentage, comparePositions } from '../data/ranges.js';
import { completeModule, getModuleProgress, updateStats, isModuleUnlocked } from '../storage.js';
import { createMultipleChoice, createFeedbackModal, createProgressIndicator } from '../components/Quiz.js';

const MODULE_ID = 'position';
const QUIZ_LENGTH = 10;
const PASSING_SCORE = 70;

/**
 * Render the Position module
 */
export function renderPositionModule(container) {
  const progress = getModuleProgress('foundations', MODULE_ID);
  const isUnlocked = isModuleUnlocked('foundations', MODULE_ID);

  if (!isUnlocked) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Module Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Hand Strength module first to unlock this content.</p>
        <a href="#/module/hand-strength" class="btn btn--primary">Go to Hand Strength</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="module container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <a href="#/foundations" class="breadcrumb__link">Foundations</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Position</span>
        </nav>
        <h1 class="page-header__title">Module 1.2: Position</h1>
        <p class="page-header__subtitle">Master the power of positional advantage</p>
      </div>

      <div class="module__content">
        <div class="module__main">
          <!-- Lesson Content -->
          <div class="lesson" id="lesson-content">
            ${renderLessonContent()}
          </div>

          <!-- Interactive Table -->
          <div class="position-viz mt-8">
            <h3 class="h3 mb-4">Interactive Position Diagram</h3>
            <div class="position-viz__table-container">
              ${renderPokerTable()}
            </div>
            <div class="position-viz__info mt-6">
              ${renderPositionInfo()}
            </div>
          </div>

          <!-- Quiz Section -->
          <div class="quiz-section mt-8" id="quiz-section">
            <div class="quiz-section__header">
              <h3 class="quiz-section__title">Practice Quiz</h3>
              <span class="quiz-section__badge" id="quiz-progress">0/${QUIZ_LENGTH}</span>
            </div>
            <div id="quiz-container">
              <p class="text-secondary mb-4">Test your understanding of positional advantage.</p>
              <button class="btn btn--primary" id="start-quiz-btn">Start Quiz</button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="module__sidebar">
          <div class="module__progress-card">
            <div class="module__progress-title">Your Progress</div>
            <div class="module__progress-score" id="best-score">${progress?.bestScore || 0}%</div>
            <div class="module__progress-label">Best Score</div>
            <div class="progress mt-4">
              <div class="progress__bar" style="width: ${progress?.bestScore || 0}%"></div>
            </div>
            <p class="text-sm text-secondary mt-4">
              ${progress?.completed ? 'Completed! ' : ''}Score ${PASSING_SCORE}% or higher to complete this module.
            </p>
          </div>

          <!-- Position Order Reference -->
          <div class="module__progress-card mt-4">
            <div class="module__progress-title">Position Order</div>
            <div class="flex flex-col gap-2 mt-4">
              <div class="text-sm text-secondary">
                <strong>Preflop (first to act):</strong>
              </div>
              <div class="text-xs mono">UTG → MP → CO → BTN → SB → BB</div>
              <div class="text-sm text-secondary mt-2">
                <strong>Postflop (first to act):</strong>
              </div>
              <div class="text-xs mono">SB → BB → UTG → MP → CO → BTN</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module Navigation -->
      <div class="module__nav">
        <a href="#/module/hand-strength" class="btn btn--ghost module__nav-btn">
          ← Previous: Hand Strength
        </a>
        <a href="#/module/equity" class="btn btn--secondary module__nav-btn">
          Next: Equity →
        </a>
      </div>
    </div>
  `;

  // Set up interactivity
  setupPositionInteractivity();
  setupQuiz();
}

/**
 * Render lesson content
 */
function renderLessonContent() {
  return `
    <div class="lesson__section animate-fade-in-up">
      <h2 class="lesson__title">Why Position Matters</h2>
      <p class="lesson__text">
        Position is one of the most important concepts in poker. The player who acts last has a significant
        advantage because they get to see what everyone else does before making their decision.
        This information advantage allows you to make better decisions and play more hands profitably.
      </p>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-1">
      <h3 class="lesson__subtitle">The 6-Max Table</h3>
      <p class="lesson__text">
        In a 6-handed game, there are six positions. The action moves clockwise, and position is
        relative to the dealer button (BTN). The button is the best position because you act last
        on every street after the flop.
      </p>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-2">
      <h3 class="lesson__subtitle">Early Position (UTG, MP)</h3>
      <p class="lesson__text">
        Under the Gun (UTG) and Middle Position (MP) are the worst positions. You act first or second
        preflop, and there are still many players left to act behind you. You need stronger hands
        to open because you're more likely to face resistance.
      </p>
      <div class="lesson__highlight">
        <strong>Opening Range:</strong> ~15-18% of hands (only premium and strong hands)
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-3">
      <h3 class="lesson__subtitle">Late Position (CO, BTN)</h3>
      <p class="lesson__text">
        The Cutoff (CO) and Button (BTN) are the best positions. Fewer players left to act means
        less chance of facing a strong hand. The button is especially powerful because you'll have
        position for the entire hand postflop.
      </p>
      <div class="lesson__highlight">
        <strong>Opening Range:</strong> ~27-42% of hands (much wider range)
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-4">
      <h3 class="lesson__subtitle">The Blinds (SB, BB)</h3>
      <p class="lesson__text">
        The blinds have already invested money, giving them pot odds to defend. However, they're
        out of position postflop (act first), which is a significant disadvantage. The small blind
        is the worst postflop position.
      </p>
      <div class="lesson__highlight">
        <strong>Strategy:</strong> Blinds defend against opens but play carefully postflop
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-5">
      <h3 class="lesson__subtitle">Key Takeaways</h3>
      <ul class="lesson__text" style="list-style: disc; padding-left: var(--space-6);">
        <li><strong>Position = Information:</strong> Acting last lets you make better decisions</li>
        <li><strong>Wider ranges in position:</strong> Play more hands from late position</li>
        <li><strong>Tighter ranges out of position:</strong> Be selective in early position</li>
        <li><strong>The button is king:</strong> The best seat at the table</li>
      </ul>
    </div>
  `;
}

/**
 * Render the poker table diagram
 */
function renderPokerTable() {
  return `
    <div class="poker-table" id="poker-table">
      <div class="poker-table__position poker-table__position--btn" data-position="BTN">
        <div class="poker-table__seat">BTN</div>
        <div class="poker-table__label">Button</div>
      </div>
      <div class="poker-table__position poker-table__position--sb" data-position="SB">
        <div class="poker-table__seat">SB</div>
        <div class="poker-table__label">Small Blind</div>
      </div>
      <div class="poker-table__position poker-table__position--bb" data-position="BB">
        <div class="poker-table__seat">BB</div>
        <div class="poker-table__label">Big Blind</div>
      </div>
      <div class="poker-table__position poker-table__position--utg" data-position="UTG">
        <div class="poker-table__seat">UTG</div>
        <div class="poker-table__label">Under the Gun</div>
      </div>
      <div class="poker-table__position poker-table__position--mp" data-position="MP">
        <div class="poker-table__seat">MP</div>
        <div class="poker-table__label">Middle</div>
      </div>
      <div class="poker-table__position poker-table__position--co" data-position="CO">
        <div class="poker-table__seat">CO</div>
        <div class="poker-table__label">Cutoff</div>
      </div>
    </div>
  `;
}

/**
 * Render position info cards
 */
function renderPositionInfo() {
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

  return positions.map(pos => {
    const info = POSITIONS[pos];
    const rangePercent = getRangePercentage(pos);

    return `
      <div class="position-viz__position" data-position="${pos}">
        <div class="position-viz__position-name">${info.shortName}</div>
        <div class="position-viz__position-range">${rangePercent}%</div>
        <div class="text-xs text-tertiary">open range</div>
      </div>
    `;
  }).join('');
}

/**
 * Set up position interactivity
 */
function setupPositionInteractivity() {
  const table = document.getElementById('poker-table');
  if (!table) return;

  const positions = table.querySelectorAll('.poker-table__position');
  const infoCards = document.querySelectorAll('.position-viz__position');

  positions.forEach(pos => {
    pos.addEventListener('mouseenter', () => {
      const position = pos.dataset.position;

      // Highlight this position
      positions.forEach(p => p.classList.remove('poker-table__position--active'));
      pos.classList.add('poker-table__position--active');

      // Highlight corresponding info card
      infoCards.forEach(card => {
        if (card.dataset.position === position) {
          card.style.borderColor = 'var(--color-primary-500)';
          card.style.backgroundColor = 'var(--color-surface-elevated)';
        } else {
          card.style.borderColor = '';
          card.style.backgroundColor = '';
        }
      });
    });
  });

  // Also allow clicking info cards
  infoCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const position = card.dataset.position;
      const tablePos = table.querySelector(`[data-position="${position}"]`);
      if (tablePos) {
        tablePos.dispatchEvent(new Event('mouseenter'));
      }
    });
  });
}

/**
 * Set up the quiz functionality
 */
function setupQuiz() {
  const startBtn = document.getElementById('start-quiz-btn');
  const quizContainer = document.getElementById('quiz-container');

  startBtn?.addEventListener('click', () => {
    startQuiz(quizContainer);
  });
}

/**
 * Generate quiz questions
 */
function generateQuizQuestions() {
  const questions = [];
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB'];

  // Question type 1: Which position is better?
  for (let i = 0; i < 5; i++) {
    const pos1 = positions[Math.floor(Math.random() * positions.length)];
    let pos2;
    do {
      pos2 = positions[Math.floor(Math.random() * positions.length)];
    } while (pos2 === pos1);

    const better = comparePositions(pos1, pos2) > 0 ? pos1 : pos2;

    questions.push({
      question: `Which position has more advantage?`,
      options: [
        { label: `${pos1} (${POSITIONS[pos1].name})`, value: pos1, correct: pos1 === better },
        { label: `${pos2} (${POSITIONS[pos2].name})`, value: pos2, correct: pos2 === better }
      ]
    });
  }

  // Question type 2: Order positions
  questions.push({
    question: 'Who acts first preflop?',
    options: [
      { label: 'UTG (Under the Gun)', value: 'UTG', correct: true },
      { label: 'BTN (Button)', value: 'BTN', correct: false },
      { label: 'BB (Big Blind)', value: 'BB', correct: false },
      { label: 'CO (Cutoff)', value: 'CO', correct: false }
    ]
  });

  questions.push({
    question: 'Who acts last postflop?',
    options: [
      { label: 'BTN (Button)', value: 'BTN', correct: true },
      { label: 'BB (Big Blind)', value: 'BB', correct: false },
      { label: 'UTG (Under the Gun)', value: 'UTG', correct: false },
      { label: 'SB (Small Blind)', value: 'SB', correct: false }
    ]
  });

  questions.push({
    question: 'Which position should have the widest opening range?',
    options: [
      { label: 'BTN (Button)', value: 'BTN', correct: true },
      { label: 'UTG (Under the Gun)', value: 'UTG', correct: false },
      { label: 'BB (Big Blind)', value: 'BB', correct: false },
      { label: 'MP (Middle Position)', value: 'MP', correct: false }
    ]
  });

  questions.push({
    question: 'Which position is worst postflop?',
    options: [
      { label: 'SB (Small Blind)', value: 'SB', correct: true },
      { label: 'BTN (Button)', value: 'BTN', correct: false },
      { label: 'CO (Cutoff)', value: 'CO', correct: false },
      { label: 'UTG (Under the Gun)', value: 'UTG', correct: false }
    ]
  });

  questions.push({
    question: 'Why is position valuable in poker?',
    options: [
      { label: 'You get to see others act first', value: 'info', correct: true },
      { label: 'You get dealt better cards', value: 'cards', correct: false },
      { label: 'You win more blinds', value: 'blinds', correct: false },
      { label: 'You can bet more', value: 'bet', correct: false }
    ]
  });

  // Shuffle and return
  return questions.sort(() => Math.random() - 0.5).slice(0, QUIZ_LENGTH);
}

/**
 * Start the quiz
 */
function startQuiz(container) {
  const questions = generateQuizQuestions();
  let currentIndex = 0;
  let correctCount = 0;

  function showQuestion() {
    const question = questions[currentIndex];

    // Update progress
    document.getElementById('quiz-progress').textContent = `${currentIndex + 1}/${QUIZ_LENGTH}`;

    container.innerHTML = '';

    // Progress indicator
    const progressEl = createProgressIndicator(currentIndex + 1, QUIZ_LENGTH, correctCount);
    container.appendChild(progressEl);

    // Quiz component
    const quiz = createMultipleChoice({
      question: question.question,
      options: question.options,
      showFeedback: true,
      onAnswer: (result) => {
        updateStats({ correctAnswer: result.isCorrect });

        if (result.isCorrect) {
          correctCount++;
        }

        setTimeout(() => {
          currentIndex++;
          if (currentIndex < QUIZ_LENGTH) {
            showQuestion();
          } else {
            showResults();
          }
        }, 1200);
      }
    });

    container.appendChild(quiz);
  }

  function showResults() {
    const score = Math.round((correctCount / QUIZ_LENGTH) * 100);
    const passed = score >= PASSING_SCORE;

    // Save progress
    if (passed) {
      completeModule('foundations', MODULE_ID, score);
    }

    // Update sidebar
    const bestScoreEl = document.getElementById('best-score');
    if (bestScoreEl) {
      const currentBest = parseInt(bestScoreEl.textContent);
      if (score > currentBest) {
        bestScoreEl.textContent = `${score}%`;
      }
    }

    container.innerHTML = `
      <div class="flex flex-col items-center gap-6 py-8 animate-fade-in-up">
        <div class="feedback-modal__icon" style="background-color: ${passed ? 'var(--color-success-soft)' : 'var(--color-error-soft)'}; color: ${passed ? 'var(--color-success)' : 'var(--color-error)'};">
          ${passed ? '✓' : '✗'}
        </div>
        <h3 class="h2">${passed ? 'Excellent!' : 'Keep Practicing'}</h3>
        <div class="feedback-modal__stat">${score}%</div>
        <p class="text-secondary text-center">
          You got ${correctCount} out of ${QUIZ_LENGTH} correct.
          ${passed ? 'You\'ve completed this module!' : `Score ${PASSING_SCORE}% or higher to complete.`}
        </p>
        <div class="flex gap-4">
          <button class="btn btn--secondary" onclick="location.reload()">Try Again</button>
          ${passed ? '<a href="#/module/equity" class="btn btn--primary">Next Module →</a>' : ''}
        </div>
        <div class="feedback-links">
          <p class="text-sm text-tertiary">
            Found a problem? <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="link">Report it on GitHub</a>
          </p>
          <p class="text-sm text-tertiary">
            Did this help? <a href="https://buymeacoffee.com/rdpharr" target="_blank" rel="noopener" class="link link--coffee">Buy me a coffee ☕</a>
          </p>
        </div>
      </div>
    `;
  }

  showQuestion();
}

export default { renderPositionModule };
