/**
 * Scenario Ranges
 * Consensus-based GTO ranges for Stage 3 scenarios
 *
 * Sources:
 * - GTO Wizard (solver-based)
 * - PokerCoaching.com (Jonathan Little)
 * - Upswing Poker (Doug Polk methodology)
 * - Red Chip Poker (sGTO approach)
 *
 * Note: These are simplified ranges based on consensus across sources.
 * Mixed strategy hands are simplified to single actions.
 * See docs/gto-range-research.md for full source documentation.
 */

// ============================================
// 3-BET DEFENSE RANGES
// When you open and face a 3-bet: Call / 4-bet / Fold
// ============================================

export const DEFEND_VS_3BET = {
  // CO opens, BTN 3-bets
  'CO_vs_BTN': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    call: [
      'JJ', 'TT', '99',
      'AQs', 'AJs', 'ATs',
      'KQs', 'KJs',
      'QJs', 'JTs',
      'AQo'
    ],
    fold: 'everything else'
  },

  // CO opens, SB 3-bets
  'CO_vs_SB': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    call: [
      'JJ', 'TT', '99',
      'AQs', 'AJs', 'ATs',
      'KQs',
      'QJs', 'JTs',
      'AQo'
    ],
    fold: 'everything else'
  },

  // CO opens, BB 3-bets
  'CO_vs_BB': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    call: [
      'JJ', 'TT', '99', '88',
      'AQs', 'AJs', 'ATs', 'A9s',
      'KQs', 'KJs',
      'QJs', 'JTs', 'T9s',
      'AQo', 'AJo'
    ],
    fold: 'everything else'
  },

  // BTN opens, SB 3-bets
  'BTN_vs_SB': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    call: [
      'JJ', 'TT', '99', '88',
      'AQs', 'AJs', 'ATs', 'A9s', 'A8s',
      'KQs', 'KJs', 'KTs',
      'QJs', 'QTs',
      'JTs', 'J9s',
      'T9s',
      'AQo', 'AJo', 'KQo'
    ],
    fold: 'everything else'
  },

  // BTN opens, BB 3-bets
  'BTN_vs_BB': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    call: [
      'JJ', 'TT', '99', '88', '77',
      'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s',
      'AQo', 'AJo', 'ATo', 'KQo', 'KJo'
    ],
    fold: 'everything else'
  },

  // MP opens, CO 3-bets
  'MP_vs_CO': {
    fourBet: ['AA', 'KK', 'QQ', 'AKs'],
    call: [
      'JJ', 'TT',
      'AQs', 'AJs',
      'KQs',
      'AKo'
    ],
    fold: 'everything else'
  },

  // UTG opens, MP 3-bets
  'UTG_vs_MP': {
    fourBet: ['AA', 'KK'],
    call: [
      'QQ', 'JJ',
      'AKs', 'AQs',
      'AKo'
    ],
    fold: 'everything else'
  }
};

// ============================================
// BB DEFENSE RANGES
// Villain opens, you're in BB: Call / 3-bet / Fold
// ============================================

export const BB_DEFENSE = {
  // vs BTN open (~45-50% defend)
  'vs_BTN': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ',
      'AKs', 'AQs', 'AJs',
      'AKo', 'AQo',
      'A5s', 'A4s', 'A3s', 'A2s'  // Bluff 3-bets
    ],
    call: [
      'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
      'QJs', 'QTs', 'Q9s', 'Q8s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s', '64s',
      '54s', '53s',
      '43s',
      'AJo', 'ATo', 'A9o',
      'KQo', 'KJo', 'KTo',
      'QJo', 'QTo',
      'JTo'
    ],
    fold: 'everything else'
  },

  // vs CO open (~40-45% defend)
  'vs_CO': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ',
      'AKs', 'AQs',
      'AKo',
      'A5s', 'A4s'  // Bluff 3-bets
    ],
    call: [
      'TT', '99', '88', '77', '66', '55',
      'AJs', 'ATs', 'A9s', 'A8s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s',
      '54s',
      'AQo', 'AJo', 'ATo',
      'KQo', 'KJo',
      'QJo'
    ],
    fold: 'everything else'
  },

  // vs MP open (~30-35% defend)
  'vs_MP': {
    threeBet: [
      'AA', 'KK', 'QQ',
      'AKs', 'AQs',
      'AKo',
      'A5s'  // Occasional bluff 3-bet
    ],
    call: [
      'JJ', 'TT', '99', '88', '77',
      'AJs', 'ATs', 'A9s',
      'KQs', 'KJs', 'KTs',
      'QJs', 'QTs',
      'JTs', 'J9s',
      'T9s',
      '98s',
      '87s',
      '76s',
      '65s',
      'AQo', 'AJo',
      'KQo'
    ],
    fold: 'everything else'
  },

  // vs UTG open (~25-30% defend)
  'vs_UTG': {
    threeBet: [
      'AA', 'KK', 'QQ',
      'AKs'
    ],
    call: [
      'JJ', 'TT', '99', '88', '77',
      'AQs', 'AJs', 'ATs',
      'KQs', 'KJs',
      'QJs',
      'JTs',
      'T9s',
      '98s',
      '87s',
      '76s',
      'AQo', 'AJo',
      'KQo'
    ],
    fold: 'everything else'
  },

  // vs SB open (~50%+ defend - getting good price)
  'vs_SB': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ', 'TT',
      'AKs', 'AQs', 'AJs', 'ATs',
      'AKo', 'AQo',
      'A5s', 'A4s', 'A3s', 'A2s',
      'K9s', 'Q9s', 'J9s'  // More bluffs vs SB
    ],
    call: [
      '99', '88', '77', '66', '55', '44', '33', '22',
      'A9s', 'A8s', 'A7s', 'A6s',
      'KQs', 'KJs', 'KTs', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
      'QJs', 'QTs', 'Q8s',
      'JTs', 'J8s',
      'T9s', 'T8s', 'T7s',
      '98s', '97s', '96s',
      '87s', '86s', '85s',
      '76s', '75s', '74s',
      '65s', '64s',
      '54s', '53s',
      '43s',
      'AJo', 'ATo', 'A9o', 'A8o',
      'KJo', 'KTo', 'K9o',
      'QJo', 'QTo',
      'JTo', 'J9o',
      'T9o'
    ],
    fold: 'everything else'
  }
};

// ============================================
// VALUE 3-BET RANGES
// When to 3-bet for value vs opens
// ============================================

export const VALUE_3BET = {
  // Universal value 3-bets (all positions agree)
  universal: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],

  // From BB vs steal (BTN/CO open)
  'BB_vs_steal': {
    value3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo'],
    bluff3bet: ['A5s', 'A4s', 'A3s', 'A2s']  // Blockers
  },

  // From SB vs BTN open
  'SB_vs_BTN': {
    value3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo'],
    bluff3bet: ['A5s', 'A4s', 'A3s', 'A2s', 'K5s', 'K4s']
  },

  // From CO vs MP/UTG open
  'CO_vs_EP': {
    value3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    bluff3bet: ['A5s', 'A4s']  // Rare bluffs vs EP
  },

  // From BTN vs any open
  'BTN_vs_open': {
    value3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo', 'AQo'],
    bluff3bet: ['A5s', 'A4s', 'A3s', 'K5s', 'Q5s']  // More bluffs in position
  }
};

// ============================================
// SB 3-BET OR FOLD RANGES
// From SB: 3-bet or fold (rarely call)
// ============================================

export const SB_3BET_OR_FOLD = {
  // vs BTN open
  'vs_BTN': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
      'AKs', 'AQs', 'AJs', 'ATs',
      'AKo', 'AQo', 'AJo',
      'KQs', 'KJs',
      'A5s', 'A4s', 'A3s', 'A2s',  // Bluff 3-bets
      'K5s', 'K4s'
    ],
    fold: 'everything else'
  },

  // vs CO open
  'vs_CO': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ', 'TT',
      'AKs', 'AQs', 'AJs',
      'AKo', 'AQo',
      'KQs',
      'A5s', 'A4s'
    ],
    fold: 'everything else'
  },

  // vs MP open
  'vs_MP': {
    threeBet: [
      'AA', 'KK', 'QQ', 'JJ',
      'AKs', 'AQs',
      'AKo',
      'A5s'
    ],
    fold: 'everything else'
  },

  // vs UTG open (premium only)
  'vs_UTG': {
    threeBet: [
      'AA', 'KK', 'QQ',
      'AKs',
      'AKo'
    ],
    fold: 'everything else'
  }
};

// ============================================
// COLD 4-BET RANGES
// When someone opens and another 3-bets: 4-bet or fold
// Ultra-tight (simplified)
// ============================================

export const COLD_4BET = {
  // In position
  'IP': {
    fourBet: ['AA', 'KK'],
    // Maybe: ['QQ', 'AKs'] in very specific spots
    fold: 'everything else'
  },

  // Out of position
  'OOP': {
    fourBet: ['AA', 'KK'],
    fold: 'everything else'
  },

  // Note: "If you're not sure, fold is rarely wrong here"
  defaultAdvice: 'fold'
};

// ============================================
// BOARD TEXTURE CATEGORIES
// ============================================

export const BOARD_TEXTURES = {
  dry: {
    description: 'Few draws possible',
    examples: ['K72 rainbow', 'A83 rainbow', 'Q52 rainbow'],
    characteristics: ['Rainbow (3 suits)', 'Unconnected (gaps of 4+)', 'No Broadway consecutive']
  },
  wet: {
    description: 'Many draws available',
    examples: ['JT9 two-tone', 'QJ8 two-tone', '876 two-tone'],
    characteristics: ['Two-tone (2 of same suit)', 'Connected (1-2 gaps)', 'Broadway cards']
  },
  paired: {
    description: 'Board has a pair',
    examples: ['KK4', '772', 'QQ8'],
    characteristics: ['Two cards of same rank', 'Trips possible']
  },
  monotone: {
    description: 'All one suit',
    examples: ['9h 6h 3h', 'Kc 8c 4c'],
    characteristics: ['All three cards same suit', 'Flush possible']
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a hand is in a specific range
 * @param {string} hand - Hand notation (e.g., 'AKs', 'QQ')
 * @param {Array} range - Array of hands in the range
 * @returns {boolean}
 */
export function isHandInRange(hand, range) {
  if (!range || !Array.isArray(range)) return false;
  return range.includes(hand);
}

/**
 * Get the correct action for a hand in a scenario
 * @param {string} hand - Hand notation
 * @param {Object} rangeData - Range data object with action arrays
 * @returns {string} The correct action
 */
export function getCorrectAction(hand, rangeData) {
  if (rangeData.fourBet && isHandInRange(hand, rangeData.fourBet)) {
    return '4-bet';
  }
  if (rangeData.threeBet && isHandInRange(hand, rangeData.threeBet)) {
    return '3-bet';
  }
  if (rangeData.call && isHandInRange(hand, rangeData.call)) {
    return 'Call';
  }
  return 'Fold';
}

/**
 * Get range breakdown for display
 * @param {Object} rangeData - Range data object
 * @returns {Array} Array of {action, hands} objects
 */
export function getRangeBreakdown(rangeData) {
  const breakdown = [];

  if (rangeData.fourBet) {
    breakdown.push({
      action: '4-bet',
      hands: rangeData.fourBet.join(', ')
    });
  }

  if (rangeData.threeBet) {
    breakdown.push({
      action: '3-bet',
      hands: rangeData.threeBet.join(', ')
    });
  }

  if (rangeData.call) {
    breakdown.push({
      action: 'Call',
      hands: rangeData.call.slice(0, 10).join(', ') + (rangeData.call.length > 10 ? '...' : '')
    });
  }

  if (rangeData.fold) {
    breakdown.push({
      action: 'Fold',
      hands: typeof rangeData.fold === 'string' ? rangeData.fold : rangeData.fold.join(', ')
    });
  }

  return breakdown;
}

/**
 * Get a random hand from a specific action category
 * @param {Object} rangeData - Range data object
 * @param {string} action - Action category (fourBet, threeBet, call, fold)
 * @returns {string|null} Random hand or null
 */
export function getRandomHandFromAction(rangeData, action) {
  const hands = rangeData[action];
  if (!hands || !Array.isArray(hands) || hands.length === 0) return null;
  return hands[Math.floor(Math.random() * hands.length)];
}

/**
 * Get scenario description
 * @param {string} scenarioKey - Scenario key (e.g., 'CO_vs_BTN')
 * @returns {Object} Description object
 */
export function getScenarioDescription(scenarioKey) {
  const [hero, vs, villain] = scenarioKey.split('_');

  return {
    heroPosition: hero,
    villainPosition: villain,
    situation: `${hero} vs ${villain} ${villain === 'BTN' || villain === 'SB' || villain === 'BB' ? '3-bet' : 'open'}`
  };
}

// ============================================
// BOARD TEXTURE GENERATION
// ============================================

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['h', 'd', 'c', 's'];

/**
 * Generate a random card that isn't in the exclusion list
 * @param {Array} exclude - Cards to exclude
 * @returns {Object} Card object {rank, suit}
 */
function generateRandomCard(exclude = []) {
  const excludeSet = new Set(exclude.map(c => `${c.rank}${c.suit}`));
  let card;
  let attempts = 0;
  do {
    card = {
      rank: RANKS[Math.floor(Math.random() * RANKS.length)],
      suit: SUITS[Math.floor(Math.random() * SUITS.length)]
    };
    attempts++;
  } while (excludeSet.has(`${card.rank}${card.suit}`) && attempts < 100);
  return card;
}

/**
 * Get rank value for comparison (A=14, K=13, etc.)
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function getRankValue(rank) {
  const values = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10 };
  return values[rank] || parseInt(rank);
}

/**
 * Generate a board with a specific texture
 * @param {string} texture - Board texture (dry, wet, paired, monotone)
 * @param {Array} exclude - Cards to exclude (hero's hand, etc.)
 * @returns {Array} Array of 3 card objects
 */
export function generateBoardWithTexture(texture, exclude = []) {
  const usedCards = [...exclude];

  switch (texture) {
    case 'dry':
      return generateDryBoard(usedCards);
    case 'wet':
      return generateWetBoard(usedCards);
    case 'paired':
      return generatePairedBoard(usedCards);
    case 'monotone':
      return generateMonotoneBoard(usedCards);
    default:
      return generateDryBoard(usedCards);
  }
}

/**
 * Generate a dry board (rainbow, disconnected)
 */
function generateDryBoard(exclude) {
  const usedCards = [...exclude];
  const usedSuits = [];

  // Pick 3 different suits for rainbow
  const availableSuits = [...SUITS];
  const board = [];

  // Generate 3 cards with gaps of 4+ between them
  const highRanks = ['A', 'K', 'Q'];
  const midRanks = ['9', '8', '7'];
  const lowRanks = ['4', '3', '2'];

  // Pick one from each group
  const rankGroups = [highRanks, midRanks, lowRanks];

  for (let i = 0; i < 3; i++) {
    const rank = rankGroups[i][Math.floor(Math.random() * rankGroups[i].length)];
    const suit = availableSuits.splice(Math.floor(Math.random() * availableSuits.length), 1)[0];
    const card = { rank, suit };
    board.push(card);
    usedCards.push(card);
  }

  return board;
}

/**
 * Generate a wet board (two-tone, connected)
 */
function generateWetBoard(exclude) {
  const usedCards = [...exclude];
  const board = [];

  // Pick a flush draw suit (2 cards same suit)
  const flushSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const otherSuit = SUITS.filter(s => s !== flushSuit)[Math.floor(Math.random() * 3)];

  // Generate connected cards (straight draw possible)
  const startIdx = Math.floor(Math.random() * 8) + 2; // Start between Q and 6
  const ranks = [RANKS[startIdx], RANKS[startIdx + 1], RANKS[startIdx + 2]];

  // Assign suits (2 same, 1 different)
  board.push({ rank: ranks[0], suit: flushSuit });
  board.push({ rank: ranks[1], suit: flushSuit });
  board.push({ rank: ranks[2], suit: otherSuit });

  return board;
}

/**
 * Generate a paired board
 */
function generatePairedBoard(exclude) {
  const usedCards = [...exclude];
  const board = [];

  // Pick a rank to pair
  const pairRank = RANKS[Math.floor(Math.random() * RANKS.length)];

  // Pick two different suits for the pair
  const availableSuits = [...SUITS];
  const suit1 = availableSuits.splice(Math.floor(Math.random() * availableSuits.length), 1)[0];
  const suit2 = availableSuits.splice(Math.floor(Math.random() * availableSuits.length), 1)[0];

  board.push({ rank: pairRank, suit: suit1 });
  board.push({ rank: pairRank, suit: suit2 });

  // Pick a different rank for the third card
  let thirdRank;
  do {
    thirdRank = RANKS[Math.floor(Math.random() * RANKS.length)];
  } while (thirdRank === pairRank);

  const thirdSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
  board.push({ rank: thirdRank, suit: thirdSuit });

  return board;
}

/**
 * Generate a monotone board (all same suit)
 */
function generateMonotoneBoard(exclude) {
  const usedCards = [...exclude];
  const board = [];

  // All same suit
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];

  // Pick 3 different ranks
  const availableRanks = [...RANKS];
  for (let i = 0; i < 3; i++) {
    const rankIdx = Math.floor(Math.random() * availableRanks.length);
    const rank = availableRanks.splice(rankIdx, 1)[0];
    board.push({ rank, suit });
  }

  return board;
}

/**
 * Analyze a board's texture
 * @param {Array} board - Array of card objects
 * @returns {string} Board texture (dry, wet, paired, monotone)
 */
export function analyzeBoardTexture(board) {
  if (!board || board.length < 3) return 'unknown';

  const suits = board.map(c => c.suit);
  const ranks = board.map(c => c.rank);
  const rankValues = ranks.map(getRankValue).sort((a, b) => a - b);

  // Check monotone (all same suit)
  if (suits[0] === suits[1] && suits[1] === suits[2]) {
    return 'monotone';
  }

  // Check paired (two same rank)
  if (ranks[0] === ranks[1] || ranks[1] === ranks[2] || ranks[0] === ranks[2]) {
    return 'paired';
  }

  // Check two-tone (flush draw possible)
  const suitCounts = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  const hasTwoTone = Object.values(suitCounts).some(count => count === 2);

  // Check connectivity (straight draw possible)
  const gaps = [];
  for (let i = 0; i < rankValues.length - 1; i++) {
    gaps.push(rankValues[i + 1] - rankValues[i]);
  }
  const isConnected = gaps.every(g => g <= 2);

  // Wet if two-tone OR connected
  if (hasTwoTone || isConnected) {
    return 'wet';
  }

  return 'dry';
}
