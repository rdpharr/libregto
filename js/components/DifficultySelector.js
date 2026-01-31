/**
 * DifficultySelector Component
 * Poker-themed segmented toggle for Easy/Hard difficulty
 */

/**
 * Create a difficulty selector component
 * @param {Object} options - Configuration options
 * @param {string} options.selected - Currently selected difficulty ('easy' or 'hard')
 * @param {boolean} options.hardUnlocked - Whether hard mode is unlocked
 * @param {Function} options.onSelect - Callback when difficulty is selected
 * @param {Object} options.easyStats - Easy mode stats { bestScore, bestStreak, bestTime }
 * @param {Object} options.hardStats - Hard mode stats { bestScore, bestStreak, bestTime }
 * @returns {HTMLElement} The difficulty selector DOM element
 */
export function createDifficultySelector({
  selected = 'easy',
  hardUnlocked = false,
  onSelect = () => {},
  easyStats = null,
  hardStats = null
}) {
  const container = document.createElement('div');
  container.className = 'difficulty-selector';

  // Calculate slider position
  const sliderPosition = selected === 'hard' && hardUnlocked ? 'right' : 'left';

  container.innerHTML = `
    <div class="difficulty-selector__track">
      <div class="difficulty-selector__slider difficulty-selector__slider--${sliderPosition}"></div>

      <button class="difficulty-selector__btn ${selected === 'easy' ? 'difficulty-selector__btn--active' : ''}"
              data-difficulty="easy"
              aria-pressed="${selected === 'easy'}">
        <span class="difficulty-selector__icon">♠</span>
        <span class="difficulty-selector__label">Easy</span>
        ${easyStats && easyStats.bestScore > 0 ? `
          <span class="difficulty-selector__score">${Math.round(easyStats.bestScore)}%</span>
        ` : ''}
      </button>

      <button class="difficulty-selector__btn ${selected === 'hard' ? 'difficulty-selector__btn--active' : ''} ${!hardUnlocked ? 'difficulty-selector__btn--locked' : ''}"
              data-difficulty="hard"
              aria-pressed="${selected === 'hard'}"
              ${!hardUnlocked ? 'disabled aria-disabled="true"' : ''}>
        ${!hardUnlocked ? `
          <span class="difficulty-selector__lock-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        ` : `
          <span class="difficulty-selector__icon difficulty-selector__icon--fire">🔥</span>
        `}
        <span class="difficulty-selector__label">Hard</span>
        ${hardUnlocked && hardStats && hardStats.bestScore > 0 ? `
          <span class="difficulty-selector__score">${Math.round(hardStats.bestScore)}%</span>
        ` : ''}
      </button>
    </div>

    ${!hardUnlocked ? `
      <div class="difficulty-selector__unlock-hint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        Complete Easy to unlock Hard mode
      </div>
    ` : ''}
  `;

  // Bind click events
  const buttons = container.querySelectorAll('.difficulty-selector__btn');
  const slider = container.querySelector('.difficulty-selector__slider');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;

      const difficulty = btn.dataset.difficulty;

      // Update selection state
      buttons.forEach(b => {
        b.classList.remove('difficulty-selector__btn--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('difficulty-selector__btn--active');
      btn.setAttribute('aria-pressed', 'true');

      // Move slider
      slider.classList.remove('difficulty-selector__slider--left', 'difficulty-selector__slider--right');
      slider.classList.add(`difficulty-selector__slider--${difficulty === 'hard' ? 'right' : 'left'}`);

      // Call the callback
      onSelect(difficulty);
    });
  });

  return container;
}

/**
 * Render a difficulty selector into a container
 * @param {HTMLElement} containerElement - The container to render into
 * @param {Object} options - Same as createDifficultySelector options
 */
export function renderDifficultySelector(containerElement, options) {
  const selector = createDifficultySelector(options);
  containerElement.appendChild(selector);
  return selector;
}

/**
 * CSS styles for the difficulty selector
 * Poker-themed segmented control with animated slider
 */
export const difficultySelectorStyles = `
/* Difficulty Selector - Segmented Toggle */
.difficulty-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

/* Track container - the pill shape */
.difficulty-selector__track {
  position: relative;
  display: flex;
  background: var(--color-surface-base);
  border: 2px solid var(--color-surface-border);
  border-radius: var(--radius-full);
  padding: 4px;
  gap: 2px;
}

/* Animated slider background */
.difficulty-selector__slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 3px);
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%);
  border-radius: var(--radius-full);
  box-shadow:
    0 0 12px rgba(234, 88, 12, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.difficulty-selector__slider--left {
  left: 4px;
}

.difficulty-selector__slider--right {
  left: calc(50% + 1px);
}

/* Individual buttons */
.difficulty-selector__btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  min-width: 120px;
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: color 0.2s ease;
  justify-content: center;
}

.difficulty-selector__btn:hover:not(:disabled) {
  color: var(--color-text-primary);
}

.difficulty-selector__btn--active {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Locked state */
.difficulty-selector__btn--locked {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.difficulty-selector__btn--locked:hover {
  color: var(--color-text-tertiary);
}

/* Icons */
.difficulty-selector__icon {
  font-size: var(--text-base);
  opacity: 0.7;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.difficulty-selector__btn--active .difficulty-selector__icon {
  opacity: 1;
}

.difficulty-selector__icon--fire {
  animation: fire-pulse 2s ease-in-out infinite;
}

@keyframes fire-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Lock icon */
.difficulty-selector__lock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.difficulty-selector__lock-icon svg {
  width: 14px;
  height: 14px;
}

/* Label text */
.difficulty-selector__label {
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* Score badge */
.difficulty-selector__score {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  font-family: var(--font-mono);
}

.difficulty-selector__btn--active .difficulty-selector__score {
  background: rgba(255, 255, 255, 0.25);
}

.difficulty-selector__btn--locked .difficulty-selector__score {
  display: none;
}

/* Unlock hint */
.difficulty-selector__unlock-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

.difficulty-selector__unlock-hint svg {
  opacity: 0.6;
}

/* Focus states for accessibility */
.difficulty-selector__btn:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .difficulty-selector__btn {
    min-width: 100px;
    padding: var(--space-2) var(--space-4);
  }

  .difficulty-selector__label {
    font-size: var(--text-xs);
  }
}
`;
