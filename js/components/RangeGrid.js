/**
 * RangeGrid Component
 * 13x13 matrix displaying poker hand ranges
 */

import { RANKS, getHandFromGrid, normalizeHand } from '../data/hands.js';

/**
 * Create a range grid element
 * @param {object} options - Grid options
 * @param {boolean} options.interactive - Allow clicking cells
 * @param {boolean} options.compact - Use compact size
 * @param {Set|Array} options.range - Hands to highlight as "in range"
 * @param {string} options.highlightHand - Single hand to highlight
 * @param {Function} options.onCellClick - Click handler (hand, isSelected)
 * @param {Function} options.onRangeChange - Called when range changes
 */
export function createRangeGrid(options = {}) {
  const {
    interactive = false,
    compact = false,
    range = new Set(),
    highlightHand = null,
    onCellClick = null,
    onRangeChange = null
  } = options;

  // Convert range to Set if it's an array
  const rangeSet = range instanceof Set ? range : new Set(range.map(h => normalizeHand(h)));

  const grid = document.createElement('div');
  grid.className = 'range-grid';

  if (compact) {
    grid.classList.add('range-grid--compact');
  }

  if (!interactive) {
    grid.classList.add('range-grid--display');
  }

  // Store state on the element
  grid._rangeSet = rangeSet;
  grid._interactive = interactive;

  // Create 13x13 cells
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      const cell = createCell(hand, row, col, {
        isOpen: rangeSet.has(hand),
        isHighlighted: highlightHand && normalizeHand(highlightHand) === hand,
        interactive,
        onCellClick: interactive ? (hand, isSelected) => {
          handleCellClick(grid, hand, isSelected, onCellClick, onRangeChange);
        } : null
      });

      grid.appendChild(cell);
    }
  }

  return grid;
}

/**
 * Create a single cell
 */
function createCell(hand, row, col, options) {
  const { isOpen, isHighlighted, interactive, onCellClick } = options;

  const cell = document.createElement('div');
  cell.className = 'range-grid__cell';
  cell.textContent = hand;
  cell.dataset.hand = hand;
  cell.dataset.row = row;
  cell.dataset.col = col;

  // Determine hand type
  if (row === col) {
    cell.classList.add('range-grid__cell--pair');
  } else if (row < col) {
    cell.classList.add('range-grid__cell--suited');
  } else {
    cell.classList.add('range-grid__cell--offsuit');
  }

  // Set state
  if (isOpen) {
    cell.classList.add('range-grid__cell--open');
  }

  if (isHighlighted) {
    cell.classList.add('range-grid__cell--highlight');
  }

  // Add click handler for interactive mode
  if (interactive && onCellClick) {
    cell.addEventListener('click', () => {
      const wasSelected = cell.classList.contains('range-grid__cell--open');
      cell.classList.toggle('range-grid__cell--open');
      onCellClick(hand, !wasSelected);
    });
  }

  return cell;
}

/**
 * Handle cell click
 */
function handleCellClick(grid, hand, isSelected, onCellClick, onRangeChange) {
  if (isSelected) {
    grid._rangeSet.add(hand);
  } else {
    grid._rangeSet.delete(hand);
  }

  if (onCellClick) {
    onCellClick(hand, isSelected);
  }

  if (onRangeChange) {
    onRangeChange(Array.from(grid._rangeSet));
  }
}

/**
 * Update the grid with a new range
 * @param {HTMLElement} grid - Grid element
 * @param {Set|Array} range - New range
 */
export function updateGridRange(grid, range) {
  const rangeSet = range instanceof Set ? range : new Set(range.map(h => normalizeHand(h)));
  grid._rangeSet = rangeSet;

  const cells = grid.querySelectorAll('.range-grid__cell');
  cells.forEach(cell => {
    const hand = cell.dataset.hand;
    const isInRange = rangeSet.has(hand);
    cell.classList.toggle('range-grid__cell--open', isInRange);
  });
}

/**
 * Highlight a specific hand on the grid
 * @param {HTMLElement} grid - Grid element
 * @param {string} hand - Hand to highlight (null to clear)
 */
export function highlightHand(grid, hand) {
  // Clear existing highlights
  const cells = grid.querySelectorAll('.range-grid__cell--highlight');
  cells.forEach(cell => cell.classList.remove('range-grid__cell--highlight'));

  // Add new highlight
  if (hand) {
    const normalized = normalizeHand(hand);
    const cell = grid.querySelector(`[data-hand="${normalized}"]`);
    if (cell) {
      cell.classList.add('range-grid__cell--highlight');
    }
  }
}

/**
 * Get the current range from the grid
 * @param {HTMLElement} grid - Grid element
 * @returns {Array} Array of hands in range
 */
export function getGridRange(grid) {
  return Array.from(grid._rangeSet || []);
}

/**
 * Clear the grid (remove all selections)
 * @param {HTMLElement} grid - Grid element
 */
export function clearGrid(grid) {
  grid._rangeSet = new Set();

  const cells = grid.querySelectorAll('.range-grid__cell');
  cells.forEach(cell => {
    cell.classList.remove('range-grid__cell--open');
  });
}

/**
 * Set cell state by action type
 * @param {HTMLElement} grid - Grid element
 * @param {string} hand - Hand notation
 * @param {string} action - Action type (open, fold, call, raise)
 */
export function setCellAction(grid, hand, action) {
  const normalized = normalizeHand(hand);
  const cell = grid.querySelector(`[data-hand="${normalized}"]`);

  if (!cell) return;

  // Remove all action classes
  cell.classList.remove(
    'range-grid__cell--open',
    'range-grid__cell--fold',
    'range-grid__cell--call',
    'range-grid__cell--raise'
  );

  // Add new action class
  if (action && action !== 'fold') {
    cell.classList.add(`range-grid__cell--${action}`);
  }
}

/**
 * Create a comparison view with two grids side by side
 * @param {object} options - Options
 * @param {Array} options.userRange - User's range
 * @param {Array} options.targetRange - Target/GTO range
 * @param {string} options.userLabel - Label for user grid
 * @param {string} options.targetLabel - Label for target grid
 */
export function createRangeComparison(options = {}) {
  const {
    userRange = [],
    targetRange = [],
    userLabel = 'Your Range',
    targetLabel = 'GTO Range'
  } = options;

  const container = document.createElement('div');
  container.className = 'range-builder__comparison';

  // User range
  const userItem = document.createElement('div');
  userItem.className = 'range-builder__comparison-item';

  const userLabelEl = document.createElement('div');
  userLabelEl.className = 'range-builder__comparison-label';
  userLabelEl.textContent = userLabel;

  const userGrid = createRangeGrid({
    range: userRange,
    compact: true
  });

  userItem.appendChild(userLabelEl);
  userItem.appendChild(userGrid);

  // Target range
  const targetItem = document.createElement('div');
  targetItem.className = 'range-builder__comparison-item';

  const targetLabelEl = document.createElement('div');
  targetLabelEl.className = 'range-builder__comparison-label';
  targetLabelEl.textContent = targetLabel;

  const targetGrid = createRangeGrid({
    range: targetRange,
    compact: true
  });

  targetItem.appendChild(targetLabelEl);
  targetItem.appendChild(targetGrid);

  container.appendChild(userItem);
  container.appendChild(targetItem);

  return container;
}

/**
 * Create a difference grid showing what's different between two ranges
 * @param {Array} userRange - User's range
 * @param {Array} targetRange - Target range
 */
export function createDifferenceGrid(userRange, targetRange) {
  const userSet = new Set(userRange.map(h => normalizeHand(h)));
  const targetSet = new Set(targetRange.map(h => normalizeHand(h)));

  const grid = document.createElement('div');
  grid.className = 'range-grid range-grid--display';

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      const inUser = userSet.has(hand);
      const inTarget = targetSet.has(hand);

      const cell = document.createElement('div');
      cell.className = 'range-grid__cell';
      cell.textContent = hand;
      cell.dataset.hand = hand;

      // Color based on difference
      if (inUser && inTarget) {
        // Correct - in both
        cell.classList.add('range-grid__cell--open');
      } else if (!inUser && !inTarget) {
        // Correct - in neither
        // Default fold color
      } else if (inTarget && !inUser) {
        // Missing - should be in range
        cell.style.backgroundColor = 'rgba(239, 68, 68, 0.5)'; // Red for missing
      } else if (inUser && !inTarget) {
        // Extra - shouldn't be in range
        cell.style.backgroundColor = 'rgba(245, 158, 11, 0.5)'; // Orange for extra
      }

      grid.appendChild(cell);
    }
  }

  return grid;
}

/**
 * Get range statistics
 * @param {Array} range - Array of hands in range
 */
export function getRangeStats(range) {
  const hands = range.map(h => normalizeHand(h));
  const uniqueHands = new Set(hands);

  let pairs = 0;
  let suited = 0;
  let offsuit = 0;

  uniqueHands.forEach(hand => {
    if (hand.length === 2) {
      pairs++;
    } else if (hand.endsWith('s')) {
      suited++;
    } else {
      offsuit++;
    }
  });

  // Calculate hand combos
  // Pairs = 6 combos each
  // Suited = 4 combos each
  // Offsuit = 12 combos each
  const totalCombos = (pairs * 6) + (suited * 4) + (offsuit * 12);
  const percentage = ((totalCombos / 1326) * 100).toFixed(1);

  return {
    hands: uniqueHands.size,
    pairs,
    suited,
    offsuit,
    combos: totalCombos,
    percentage
  };
}

/**
 * RangeGrid Class
 * Object-oriented wrapper for creating range grids
 */
export class RangeGrid {
  constructor(options = {}) {
    this.options = options;
    this.element = null;
  }

  render(container) {
    this.element = createRangeGrid(this.options);

    if (typeof container === 'string') {
      document.querySelector(container).appendChild(this.element);
    } else if (container) {
      container.appendChild(this.element);
    }

    return this.element;
  }

  getElement() {
    return this.element;
  }

  updateRange(range) {
    if (this.element) {
      updateGridRange(this.element, range);
    }
  }

  highlight(hand) {
    if (this.element) {
      highlightHand(this.element, hand);
    }
  }

  getRange() {
    if (this.element) {
      return getGridRange(this.element);
    }
    return [];
  }

  clear() {
    if (this.element) {
      clearGrid(this.element);
    }
  }

  setCellAction(hand, action) {
    if (this.element) {
      setCellAction(this.element, hand, action);
    }
  }
}

export default {
  createRangeGrid,
  updateGridRange,
  highlightHand,
  getGridRange,
  clearGrid,
  setCellAction,
  createRangeComparison,
  createDifferenceGrid,
  getRangeStats,
  RangeGrid
};
