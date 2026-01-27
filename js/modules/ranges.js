/**
 * Module 1.4: Ranges
 * Build and understand hand ranges
 */

import { RANKS, getHandFromGrid, normalizeHand } from '../data/hands.js';
import { POSITIONS, OPENING_RANGES, getRangePercentage, getRangeSimilarity, getRangeDifference, rangeToGrid } from '../data/ranges.js';
import { createRangeGrid, updateGridRange, getGridRange, clearGrid, getRangeStats, createRangeComparison } from '../components/RangeGrid.js';
import { createProgressIndicator } from '../components/Quiz.js';
import { completeModule, getModuleProgress, updateStats, isModuleUnlocked } from '../storage.js';

const MODULE_ID = 'ranges';
const PASSING_SCORE = 70;

/**
 * Render the Ranges module
 */
export function renderRangesModule(container) {
  const progress = getModuleProgress('foundations', MODULE_ID);
  const isUnlocked = isModuleUnlocked('foundations', MODULE_ID);

  if (!isUnlocked) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Module Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Equity module first to unlock this content.</p>
        <a href="#/module/equity" class="btn btn--primary">Go to Equity</a>
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
          <span class="breadcrumb__current">Ranges</span>
        </nav>
        <h1 class="page-header__title">Module 1.4: Ranges</h1>
        <p class="page-header__subtitle">Master preflop hand ranges</p>
      </div>

      <div class="module__content">
        <div class="module__main">
          <!-- Lesson Content -->
          <div class="lesson" id="lesson-content">
            ${renderLessonContent()}
          </div>

          <!-- GTO Ranges by Position -->
          <div class="quiz-section mt-8" id="range-examples">
            <h3 class="quiz-section__title mb-4">GTO Opening Ranges by Position</h3>
            <div class="flex flex-wrap gap-4 mb-4">
              <select id="position-select" class="btn btn--secondary" style="padding: var(--space-2) var(--space-4);">
                <option value="UTG">UTG (Under the Gun)</option>
                <option value="MP">MP (Middle Position)</option>
                <option value="CO">CO (Cutoff)</option>
                <option value="BTN" selected>BTN (Button)</option>
                <option value="SB">SB (Small Blind)</option>
              </select>
              <div class="flex items-center gap-2 text-sm text-secondary">
                <span>Opening:</span>
                <span id="range-percent" class="mono font-bold text-accent">--</span>
              </div>
            </div>
            <div id="gto-range-display" class="flex justify-center"></div>
            <p class="text-sm text-secondary text-center mt-4">
              Green cells = hands you should open/raise with from this position
            </p>
          </div>

          <!-- Range Builder Exercise -->
          <div class="quiz-section mt-8" id="quiz-section">
            <div class="quiz-section__header">
              <h3 class="quiz-section__title">Range Building Exercise</h3>
            </div>
            <div id="quiz-container">
              <p class="text-secondary mb-4">
                Build an opening range for the Button position. Click cells to toggle them on/off.
                Try to match the GTO range as closely as possible (${PASSING_SCORE}% similarity to pass).
              </p>
              <button class="btn btn--primary" id="start-exercise-btn">Start Exercise</button>
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
              ${progress?.completed ? 'Completed! ' : ''}Match ${PASSING_SCORE}% of the GTO range to complete.
            </p>
          </div>

          <!-- Range Reading Guide -->
          <div class="module__progress-card mt-4">
            <div class="module__progress-title">Reading the Grid</div>
            <div class="flex flex-col gap-2 mt-4 text-sm">
              <div class="flex items-center gap-2">
                <div style="width: 16px; height: 16px; background: var(--color-range-open); border-radius: 2px;"></div>
                <span>Open/Raise</span>
              </div>
              <div class="flex items-center gap-2">
                <div style="width: 16px; height: 16px; background: var(--color-surface-raised); border: 1px solid var(--color-surface-border); border-radius: 2px;"></div>
                <span>Fold</span>
              </div>
              <div class="text-tertiary mt-2">
                <div>Diagonal = Pairs (AA, KK...)</div>
                <div>Above diagonal = Suited</div>
                <div>Below diagonal = Offsuit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module Navigation -->
      <div class="module__nav">
        <a href="#/module/equity" class="btn btn--ghost module__nav-btn">
          ← Previous: Equity
        </a>
        <a href="#/foundations" class="btn btn--secondary module__nav-btn">
          Back to Foundations
        </a>
      </div>
    </div>
  `;

  // Set up interactivity
  setupRangeDisplay();
  setupExercise();
}

/**
 * Render lesson content
 */
function renderLessonContent() {
  return `
    <div class="lesson__section animate-fade-in-up">
      <h2 class="lesson__title">What is a Range?</h2>
      <p class="lesson__text">
        A range is the complete set of hands you would play in a given situation. Instead of
        thinking about specific hands, we think about ranges of hands. This is fundamental to
        GTO (Game Theory Optimal) poker.
      </p>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-1">
      <h3 class="lesson__subtitle">The 13x13 Range Grid</h3>
      <p class="lesson__text">
        All 169 unique starting hands can be displayed in a 13x13 grid. This visual representation
        makes it easy to see patterns and memorize ranges.
      </p>
      <div class="lesson__highlight">
        <ul style="list-style: disc; padding-left: var(--space-6);">
          <li><strong>Diagonal:</strong> Pocket pairs (AA, KK, QQ... down to 22)</li>
          <li><strong>Above diagonal:</strong> Suited hands (AKs, AQs, etc.)</li>
          <li><strong>Below diagonal:</strong> Offsuit hands (AKo, AQo, etc.)</li>
        </ul>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-2">
      <h3 class="lesson__subtitle">Opening Ranges by Position</h3>
      <p class="lesson__text">
        Your opening range should vary by position. From early position, play tight (fewer hands).
        From late position, play loose (more hands). The button has the widest opening range.
      </p>
      <div class="lesson__highlight">
        <div class="grid gap-2" style="grid-template-columns: auto 1fr;">
          <span class="mono font-semibold">UTG:</span>
          <span>~15% of hands (tight)</span>
          <span class="mono font-semibold">MP:</span>
          <span>~18% of hands</span>
          <span class="mono font-semibold">CO:</span>
          <span>~27% of hands</span>
          <span class="mono font-semibold">BTN:</span>
          <span>~42% of hands (widest)</span>
          <span class="mono font-semibold">SB:</span>
          <span>~36% of hands</span>
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-3">
      <h3 class="lesson__subtitle">Building a Range</h3>
      <p class="lesson__text">
        When constructing a range, start with the strongest hands and work down:
      </p>
      <ol class="lesson__text" style="list-style: decimal; padding-left: var(--space-6);">
        <li>All pocket pairs you want to open</li>
        <li>Strong broadway hands (suited first, then offsuit)</li>
        <li>Suited aces and suited connectors</li>
        <li>Other suited hands as position allows</li>
        <li>Weaker offsuit hands only in late position</li>
      </ol>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-4">
      <h3 class="lesson__subtitle">Range Notation</h3>
      <p class="lesson__text">
        Ranges can be written in shorthand notation:
      </p>
      <div class="lesson__highlight">
        <ul style="list-style: none; padding: 0;">
          <li><span class="mono">AA-TT</span> = All pairs from AA down to TT</li>
          <li><span class="mono">AKs-ATs</span> = Suited aces from AKs down to ATs</li>
          <li><span class="mono">AKo+</span> = AKo and better offsuit broadway</li>
          <li><span class="mono">76s+</span> = Suited connectors 76s and higher</li>
        </ul>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-5">
      <h3 class="lesson__subtitle">Why Ranges Matter</h3>
      <ul class="lesson__text" style="list-style: disc; padding-left: var(--space-6);">
        <li>Forces you to play consistently (no "I felt lucky")</li>
        <li>Makes your play harder to exploit</li>
        <li>Helps you think about your opponent's range</li>
        <li>Foundation for all GTO strategy</li>
      </ul>
    </div>
  `;
}

/**
 * Set up the GTO range display
 */
function setupRangeDisplay() {
  const select = document.getElementById('position-select');
  const displayContainer = document.getElementById('gto-range-display');
  const percentEl = document.getElementById('range-percent');

  if (!select || !displayContainer) return;

  function updateDisplay() {
    const position = select.value;
    const range = Array.from(OPENING_RANGES[position] || []);

    // Clear container
    displayContainer.innerHTML = '';

    // Create grid
    const grid = createRangeGrid({
      range,
      interactive: false
    });
    displayContainer.appendChild(grid);

    // Update percentage
    if (percentEl) {
      percentEl.textContent = getRangePercentage(position) + '%';
    }
  }

  select.addEventListener('change', updateDisplay);
  updateDisplay(); // Initial display
}

/**
 * Set up the range building exercise
 */
function setupExercise() {
  const startBtn = document.getElementById('start-exercise-btn');
  const quizContainer = document.getElementById('quiz-container');

  startBtn?.addEventListener('click', () => {
    startExercise(quizContainer);
  });
}

/**
 * Start the range building exercise
 */
function startExercise(container) {
  const targetPosition = 'BTN'; // Start with button
  const targetRange = Array.from(OPENING_RANGES[targetPosition] || []);

  // Hide the GTO range examples during the quiz
  const rangeExamples = document.getElementById('range-examples');
  if (rangeExamples) {
    rangeExamples.style.display = 'none';
  }

  container.innerHTML = `
    <div class="range-builder animate-fade-in-up">
      <div class="range-builder__header mb-4">
        <div>
          <h4 class="h4">Build the ${POSITIONS[targetPosition].name} Opening Range</h4>
          <p class="text-sm text-secondary">Click cells to add/remove hands from your range</p>
        </div>
        <div class="range-builder__stats">
          <span>Your range: <span id="user-range-percent" class="text-accent font-bold">0%</span></span>
          <span>|</span>
          <span>Hands: <span id="user-hand-count" class="font-bold">0</span></span>
        </div>
      </div>

      <div id="user-grid-container" class="range-builder__grid-container mb-6"></div>

      <div class="flex gap-4 justify-center">
        <button class="btn btn--secondary" id="clear-range-btn">Clear All</button>
        <button class="btn btn--primary" id="check-range-btn">Check My Range</button>
      </div>

      <div id="result-container" class="mt-8"></div>
    </div>
  `;

  // Create interactive grid
  const gridContainer = document.getElementById('user-grid-container');
  const userPercentEl = document.getElementById('user-range-percent');
  const handCountEl = document.getElementById('user-hand-count');

  const userGrid = createRangeGrid({
    interactive: true,
    onRangeChange: (hands) => {
      const stats = getRangeStats(hands);
      userPercentEl.textContent = stats.percentage + '%';
      handCountEl.textContent = stats.hands.toString();
    }
  });
  gridContainer.appendChild(userGrid);

  // Clear button
  document.getElementById('clear-range-btn')?.addEventListener('click', () => {
    clearGrid(userGrid);
    userPercentEl.textContent = '0%';
    handCountEl.textContent = '0';
  });

  // Check button
  document.getElementById('check-range-btn')?.addEventListener('click', () => {
    const userHands = getGridRange(userGrid);
    showResults(userHands, targetPosition, targetRange);
  });

  function showResults(userHands, position, targetRange) {
    const similarity = parseFloat(getRangeSimilarity(userHands, position));
    const passed = similarity >= PASSING_SCORE;
    const { missing, extra } = getRangeDifference(userHands, position);

    // Show the GTO range examples again
    const rangeExamples = document.getElementById('range-examples');
    if (rangeExamples) {
      rangeExamples.style.display = '';
    }

    // Save progress
    if (passed) {
      completeModule('foundations', MODULE_ID, Math.round(similarity));
    }

    // Update sidebar
    const bestScoreEl = document.getElementById('best-score');
    if (bestScoreEl) {
      const currentBest = parseInt(bestScoreEl.textContent);
      if (similarity > currentBest) {
        bestScoreEl.textContent = `${Math.round(similarity)}%`;
      }
    }

    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
      <div class="flex flex-col items-center gap-6 py-6 animate-fade-in-up">
        <div class="feedback-modal__icon" style="background-color: ${passed ? 'var(--color-success-soft)' : 'var(--color-error-soft)'}; color: ${passed ? 'var(--color-success)' : 'var(--color-error)'};">
          ${passed ? '✓' : '✗'}
        </div>
        <h3 class="h2">${passed ? 'Excellent!' : 'Almost There!'}</h3>
        <div class="feedback-modal__stat">${similarity.toFixed(1)}%</div>
        <p class="text-secondary text-center">
          Range similarity to GTO.
          ${passed ? 'You\'ve completed this module!' : `Need ${PASSING_SCORE}% or higher to complete.`}
        </p>

        ${missing.length > 0 || extra.length > 0 ? `
          <div class="flex gap-8 text-sm">
            ${missing.length > 0 ? `
              <div>
                <div class="text-error font-semibold mb-2">Missing (${missing.length}):</div>
                <div class="mono text-xs">${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}</div>
              </div>
            ` : ''}
            ${extra.length > 0 ? `
              <div>
                <div class="text-warning font-semibold mb-2">Extra (${extra.length}):</div>
                <div class="mono text-xs">${extra.slice(0, 10).join(', ')}${extra.length > 10 ? '...' : ''}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="mt-4">
          <h4 class="h4 text-center mb-4">Comparison</h4>
          <div id="comparison-container"></div>
        </div>

        <div class="flex gap-4 mt-4">
          <button class="btn btn--secondary" onclick="location.reload()">Try Again</button>
          ${passed ? '<a href="#/foundations" class="btn btn--primary">Complete Stage 1!</a>' : ''}
        </div>
        <div class="feedback-links">
          <p class="text-sm text-tertiary">
            Found a problem? <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="link">Report it on GitHub</a>
          </p>
          <p class="text-sm text-tertiary">
            Did this improve your skills? <a href="https://buymeacoffee.com/rdpharr" target="_blank" rel="noopener" class="link link--coffee">Buy me a coffee ☕</a>
          </p>
        </div>
      </div>
    `;

    // Add comparison grids
    const comparisonContainer = document.getElementById('comparison-container');
    if (comparisonContainer) {
      const comparison = createRangeComparison({
        userRange: userHands,
        targetRange,
        userLabel: 'Your Range',
        targetLabel: 'GTO Range'
      });
      comparisonContainer.appendChild(comparison);
    }
  }
}

export default { renderRangesModule };
