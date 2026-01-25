/**
 * GTO Ranges Data
 * Opening ranges by position for 6-max No Limit Hold'em
 */

import { RANKS, getHandFromGrid, normalizeHand, getEquity, sortHandsByEquity } from './hands.js';

// Position definitions (order of action preflop in 6-max)
export const POSITIONS = {
  UTG: {
    name: 'Under the Gun',
    shortName: 'UTG',
    description: 'First to act preflop. Tightest opening range.',
    order: 1,
    openingPercent: 15
  },
  MP: {
    name: 'Middle Position',
    shortName: 'MP',
    description: 'Second to act. Slightly wider than UTG.',
    order: 2,
    openingPercent: 18
  },
  CO: {
    name: 'Cutoff',
    shortName: 'CO',
    description: 'One off the button. Good stealing position.',
    order: 3,
    openingPercent: 27
  },
  BTN: {
    name: 'Button',
    shortName: 'BTN',
    description: 'Best position. Acts last postflop. Widest opening range.',
    order: 4,
    openingPercent: 42
  },
  SB: {
    name: 'Small Blind',
    shortName: 'SB',
    description: 'Posts small blind. Worst position postflop.',
    order: 5,
    openingPercent: 36
  },
  BB: {
    name: 'Big Blind',
    shortName: 'BB',
    description: 'Posts big blind. Defends vs opens.',
    order: 6,
    openingPercent: 0 // BB doesn't open, defends
  }
};

// GTO Opening ranges by position (hands to open/raise)
// These are simplified GTO ranges for 100bb cash game
export const OPENING_RANGES = {
  UTG: new Set([
    // Pairs
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
    // Suited broadways
    'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs',
    // Offsuit broadways
    'AKo', 'AQo', 'AJo', 'KQo'
  ]),

  MP: new Set([
    // Pairs
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
    // Suited broadways
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s',
    // Offsuit broadways
    'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo'
  ]),

  CO: new Set([
    // Pairs
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
    // Suited Ax
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    // Suited Kx
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
    // Suited Qx
    'QJs', 'QTs', 'Q9s',
    // Suited connectors
    'JTs', 'T9s', '98s', '87s', '76s', '65s',
    // Offsuit broadways
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo'
  ]),

  BTN: new Set([
    // All pairs
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    // All suited Ax
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    // Suited Kx
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    // Suited Qx
    'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
    // Suited Jx
    'JTs', 'J9s', 'J8s', 'J7s',
    // Suited connectors & gappers
    'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s',
    // Offsuit broadways
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
    'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
    'QJo', 'QTo', 'Q9o',
    'JTo', 'J9o',
    'T9o', 'T8o',
    '98o', '87o'
  ]),

  SB: new Set([
    // Pairs
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    // Suited Ax
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    // Suited Kx
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
    // Suited Qx
    'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
    // Suited Jx
    'JTs', 'J9s', 'J8s',
    // Suited connectors
    'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s',
    // Offsuit broadways
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
    'KQo', 'KJo', 'KTo', 'K9o',
    'QJo', 'QTo', 'Q9o',
    'JTo', 'J9o',
    'T9o', '98o'
  ]),

  // BB doesn't have an opening range, but we can define a defending range
  BB: new Set([]) // Will be populated differently for defense
};

// Check if a hand is in the opening range for a position
export function isInRange(hand, position) {
  const normalized = normalizeHand(hand);
  const range = OPENING_RANGES[position];
  return range ? range.has(normalized) : false;
}

// Get all hands in a range
export function getRangeHands(position) {
  const range = OPENING_RANGES[position];
  return range ? Array.from(range) : [];
}

// Get range as a percentage
export function getRangePercentage(position) {
  const range = OPENING_RANGES[position];
  return range ? (range.size / 169 * 100).toFixed(1) : 0;
}

// Convert range to grid format (13x13 boolean array)
export function rangeToGrid(position) {
  const grid = Array(13).fill(null).map(() => Array(13).fill(false));
  const range = OPENING_RANGES[position];

  if (!range) return grid;

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      grid[row][col] = range.has(hand);
    }
  }

  return grid;
}

// Convert a set of hands to grid format
export function handsToGrid(hands) {
  const grid = Array(13).fill(null).map(() => Array(13).fill(false));
  const handSet = new Set(hands.map(h => normalizeHand(h)));

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      grid[row][col] = handSet.has(hand);
    }
  }

  return grid;
}

// Convert grid to hands set
export function gridToHands(grid) {
  const hands = [];

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      if (grid[row][col]) {
        hands.push(getHandFromGrid(row, col));
      }
    }
  }

  return hands;
}

// Calculate range similarity (percentage of matching hands)
export function getRangeSimilarity(userHands, targetPosition) {
  const targetRange = OPENING_RANGES[targetPosition];
  if (!targetRange) return 0;

  const userSet = new Set(userHands.map(h => normalizeHand(h)));
  const targetSet = new Set(targetRange);

  // Count matches and total hands
  let matches = 0;
  let total = 0;

  // Check all 169 hands
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      const inUser = userSet.has(hand);
      const inTarget = targetSet.has(hand);

      if (inUser === inTarget) {
        matches++;
      }
      total++;
    }
  }

  return (matches / total * 100).toFixed(1);
}

// Get the difference between user range and target range
export function getRangeDifference(userHands, targetPosition) {
  const targetRange = OPENING_RANGES[targetPosition];
  if (!targetRange) return { missing: [], extra: [] };

  const userSet = new Set(userHands.map(h => normalizeHand(h)));
  const targetSet = new Set(targetRange);

  const missing = []; // Hands in target but not user
  const extra = [];   // Hands in user but not target

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandFromGrid(row, col);
      const inUser = userSet.has(hand);
      const inTarget = targetSet.has(hand);

      if (inTarget && !inUser) {
        missing.push(hand);
      } else if (inUser && !inTarget) {
        extra.push(hand);
      }
    }
  }

  return { missing, extra };
}

// Get position info
export function getPositionInfo(position) {
  return POSITIONS[position] || null;
}

// Get all positions in order
export function getPositionsInOrder() {
  return Object.entries(POSITIONS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key);
}

// Get the best position (BTN)
export function getBestPosition() {
  return 'BTN';
}

// Get the worst position (UTG for preflop, SB for postflop)
export function getWorstPosition(context = 'preflop') {
  return context === 'preflop' ? 'UTG' : 'SB';
}

// Compare two positions (returns positive if pos1 is better)
export function comparePositions(pos1, pos2) {
  const p1 = POSITIONS[pos1];
  const p2 = POSITIONS[pos2];

  if (!p1 || !p2) return 0;

  // Higher order = better position (BTN = 4 is best)
  return p1.order - p2.order;
}

// Get recommended action for a hand from a position
export function getRecommendedAction(hand, position) {
  const normalized = normalizeHand(hand);
  const range = OPENING_RANGES[position];

  if (!range) return 'fold';
  return range.has(normalized) ? 'open' : 'fold';
}

// Generate a quiz question about position
export function generatePositionQuiz() {
  const positions = getPositionsInOrder().filter(p => p !== 'BB');
  const pos1 = positions[Math.floor(Math.random() * positions.length)];
  let pos2;
  do {
    pos2 = positions[Math.floor(Math.random() * positions.length)];
  } while (pos2 === pos1);

  const hand = getRandomHandForPositionQuiz();
  const answer = comparePositions(pos1, pos2) > 0 ? pos1 : pos2;

  return {
    question: `Would you rather have ${hand} from ${pos1} or ${pos2}?`,
    hand,
    positions: [pos1, pos2],
    answer,
    explanation: `${answer} is better because you have position advantage.`
  };
}

// Get a random hand suitable for position quiz
function getRandomHandForPositionQuiz() {
  const hands = ['AKs', 'AQo', 'JTs', 'TT', '88', 'KQs', 'A5s', '76s', 'QJo', '99'];
  return hands[Math.floor(Math.random() * hands.length)];
}

// Get hands that are playable from one position but not another
export function getPositionDifferenceHands(position1, position2) {
  const range1 = OPENING_RANGES[position1];
  const range2 = OPENING_RANGES[position2];

  if (!range1 || !range2) return [];

  const difference = [];
  for (const hand of range1) {
    if (!range2.has(hand)) {
      difference.push(hand);
    }
  }

  return difference;
}
