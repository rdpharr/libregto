/**
 * PotDisplay Component
 * Shows pot size, effective stacks, and SPR
 */

/**
 * Render the pot display
 * @param {Object} options - Configuration options
 * @param {number} options.potSize - Current pot size in BB
 * @param {number} options.effectiveStack - Effective stack in BB
 * @param {number} [options.toCall] - Amount to call in BB
 * @param {boolean} [options.showSPR=true] - Whether to show SPR
 * @param {boolean} [options.showToCall=false] - Whether to show to call amount
 * @returns {string} HTML string
 */
export function renderPotDisplay(options) {
  const {
    potSize,
    effectiveStack,
    toCall = null,
    showSPR = true,
    showToCall = false
  } = options;

  const spr = effectiveStack > 0 ? (effectiveStack / potSize).toFixed(1) : '0';

  return `
    <div class="pot-display">
      <div class="pot-display__item">
        <div class="pot-display__value pot-display__value--pot">
          ${formatBB(potSize)}<span class="pot-display__unit">BB</span>
        </div>
        <div class="pot-display__label">Pot</div>
      </div>

      <div class="pot-display__item">
        <div class="pot-display__value pot-display__value--stack">
          ${formatBB(effectiveStack)}<span class="pot-display__unit">BB</span>
        </div>
        <div class="pot-display__label">Effective</div>
      </div>

      ${showSPR ? `
        <div class="pot-display__item">
          <div class="pot-display__value pot-display__value--spr">
            ${spr}
          </div>
          <div class="pot-display__label">SPR</div>
        </div>
      ` : ''}

      ${showToCall && toCall !== null ? `
        <div class="pot-display__item">
          <div class="pot-display__value">
            ${formatBB(toCall)}<span class="pot-display__unit">BB</span>
          </div>
          <div class="pot-display__label">To Call</div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render compact pot display (single line)
 * @param {Object} options - Configuration options
 * @returns {string} HTML string
 */
export function renderPotDisplayCompact(options) {
  const {
    potSize,
    effectiveStack,
    toCall = null
  } = options;

  const spr = effectiveStack > 0 ? (effectiveStack / potSize).toFixed(1) : '0';

  let display = `Pot: ${formatBB(potSize)}BB | Stack: ${formatBB(effectiveStack)}BB | SPR: ${spr}`;

  if (toCall !== null) {
    display += ` | To Call: ${formatBB(toCall)}BB`;
  }

  return `
    <div class="pot-display-compact" style="
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--space-2);
    ">
      ${display}
    </div>
  `;
}

/**
 * Format BB amount for display
 * @param {number} amount - Amount in BB
 * @returns {string} Formatted amount
 */
function formatBB(amount) {
  if (Number.isInteger(amount)) {
    return amount.toString();
  }
  return amount.toFixed(1);
}

/**
 * Calculate pot size after action
 * @param {number} currentPot - Current pot size
 * @param {string} action - Action type (call, raise, etc.)
 * @param {number} amount - Action amount
 * @returns {number} New pot size
 */
export function calculatePotSize(currentPot, action, amount) {
  switch (action.toLowerCase()) {
    case 'call':
      return currentPot + amount;
    case 'raise':
    case '3bet':
    case '4bet':
      return currentPot + amount;
    default:
      return currentPot;
  }
}

/**
 * Calculate SPR (Stack-to-Pot Ratio)
 * @param {number} effectiveStack - Effective stack in BB
 * @param {number} potSize - Pot size in BB
 * @returns {number} SPR value
 */
export function calculateSPR(effectiveStack, potSize) {
  if (potSize <= 0) return Infinity;
  return effectiveStack / potSize;
}

/**
 * Get SPR category description
 * @param {number} spr - SPR value
 * @returns {Object} {category, description}
 */
export function getSPRCategory(spr) {
  if (spr <= 2) {
    return {
      category: 'shallow',
      description: 'Shallow SPR - commit with top pair+'
    };
  }
  if (spr <= 6) {
    return {
      category: 'medium',
      description: 'Medium SPR - need strong hands to stack off'
    };
  }
  if (spr <= 13) {
    return {
      category: 'deep',
      description: 'Deep SPR - play carefully, implied odds matter'
    };
  }
  return {
    category: 'very-deep',
    description: 'Very deep SPR - speculative hands gain value'
  };
}

/**
 * Calculate pot odds
 * @param {number} potSize - Current pot size
 * @param {number} toCall - Amount to call
 * @returns {Object} {percentage, ratio}
 */
export function calculatePotOdds(potSize, toCall) {
  const totalPot = potSize + toCall;
  const percentage = (toCall / totalPot) * 100;
  const ratio = potSize / toCall;

  return {
    percentage: percentage.toFixed(1),
    ratio: ratio.toFixed(1)
  };
}

/**
 * Format pot odds for display
 * @param {number} potSize - Current pot size
 * @param {number} toCall - Amount to call
 * @returns {string} Formatted pot odds string
 */
export function formatPotOdds(potSize, toCall) {
  const odds = calculatePotOdds(potSize, toCall);
  return `${odds.ratio}:1 (${odds.percentage}%)`;
}

/**
 * Standard preflop pot sizes
 */
export const STANDARD_POT_SIZES = {
  // Single raised pot (open + call from blinds)
  srpVsUtgOpen: 5.5, // UTG opens 2.5BB, BB calls
  srpVsMpOpen: 5.5,
  srpVsCoOpen: 5.5,
  srpVsBtnOpen: 5.5,
  srpVsSbOpen: 5, // SB opens 2.5BB (completes), BB calls

  // 3-bet pots
  threeBetPotIp: 17, // Open 2.5BB, 3-bet 8BB, call
  threeBetPotOop: 20, // Open 2.5BB, 3-bet 10BB, call

  // 4-bet pots
  fourBetPot: 45 // Open 2.5BB, 3-bet 8BB, 4-bet 20BB, call
};

/**
 * Standard effective stacks
 */
export const STANDARD_STACKS = {
  deep: 200,
  standard: 100,
  midStack: 60,
  shortStack: 40,
  veryShort: 20
};
