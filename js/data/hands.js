/**
 * Hand Data Utilities
 * Card/hand representation, equity data, and hand utilities
 */

// Card ranks and suits
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
export const SUIT_SYMBOLS = {
  s: '\u2660', // ♠
  h: '\u2665', // ♥
  d: '\u2666', // ♦
  c: '\u2663'  // ♣
};

export const SUIT_NAMES = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs'
};

// Generate all 169 starting hands
export function generateAllHands() {
  const hands = [];

  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      if (i === j) {
        // Pocket pair
        hands.push(RANKS[i] + RANKS[j]);
      } else {
        // Suited and offsuit
        hands.push(RANKS[i] + RANKS[j] + 's');
        hands.push(RANKS[i] + RANKS[j] + 'o');
      }
    }
  }

  return hands;
}

export const ALL_HANDS = generateAllHands();

// Parse hand notation (e.g., "AKs" -> { rank1: "A", rank2: "K", suited: true })
export function parseHand(notation) {
  if (!notation || notation.length < 2) return null;

  const rank1 = notation[0].toUpperCase();
  const rank2 = notation[1].toUpperCase();
  const suffix = notation[2]?.toLowerCase();

  return {
    rank1,
    rank2,
    suited: suffix === 's',
    offsuit: suffix === 'o',
    pair: rank1 === rank2,
    notation: rank1 === rank2 ? rank1 + rank2 : rank1 + rank2 + (suffix || 'o')
  };
}

// Get hand category
export function getHandCategory(notation) {
  const hand = parseHand(notation);
  if (!hand) return null;

  const { rank1, rank2, suited, pair } = hand;
  const r1 = RANKS.indexOf(rank1);
  const r2 = RANKS.indexOf(rank2);
  const gap = Math.abs(r1 - r2);

  // Pocket pairs
  if (pair) {
    if (r1 <= 3) return 'premium-pair'; // AA-JJ
    if (r1 <= 6) return 'medium-pair';  // TT-77
    return 'small-pair';                 // 66-22
  }

  // Broadway hands (both cards T or higher)
  if (r1 <= 4 && r2 <= 4) {
    return suited ? 'broadway-suited' : 'broadway-offsuit';
  }

  // Suited connectors
  if (suited && gap === 1) {
    if (r1 <= 4) return 'premium-suited-connector';
    return 'suited-connector';
  }

  // Suited gappers
  if (suited && gap <= 3) {
    return 'suited-gapper';
  }

  // Suited Ax
  if (suited && rank1 === 'A') {
    if (r2 <= 4) return 'strong-ax-suited';
    return 'weak-ax-suited';
  }

  // Offsuit Ax
  if (!suited && rank1 === 'A') {
    if (r2 <= 4) return 'strong-ax-offsuit';
    return 'weak-ax-offsuit';
  }

  // Suited Kx
  if (suited && rank1 === 'K') {
    return 'kx-suited';
  }

  // Other suited
  if (suited) {
    return 'other-suited';
  }

  return 'trash';
}

// Hand tier classification for Module 1.1
export const HAND_TIERS = {
  premium: {
    name: 'Premium',
    description: 'The strongest starting hands. Raise from any position.',
    color: 'primary',
    hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs']
  },
  strong: {
    name: 'Strong',
    description: 'Very playable hands. Open from most positions.',
    color: 'success',
    hands: ['99', '88', '77', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs']
  },
  playable: {
    name: 'Playable',
    description: 'Good hands in position. Be more selective early position.',
    color: 'info',
    hands: ['66', '55', '44', '33', '22', 'AJo', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
            'KQo', 'KJo', 'KTs', 'K9s', 'QJo', 'QTs', 'Q9s', 'JTo', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s', '65s', '54s']
  },
  marginal: {
    name: 'Marginal',
    description: 'Only playable in late position or specific situations.',
    color: 'warning',
    hands: ['A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
            'KTo', 'K9o', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
            'QTo', 'Q9o', 'Q8s', 'Q7s', 'J9o', 'J8s', 'T9o', 'T8o', 'T7s',
            '97s', '96s', '86s', '85s', '75s', '74s', '64s', '53s', '43s']
  },
  trash: {
    name: 'Trash',
    description: 'Fold these hands. Not profitable to play.',
    color: 'error',
    hands: ['72o', '83o', '84o', '93o', '94o', '95o', 'T2o', 'T3o', 'T4o', 'J2o', 'J3o', 'J4o',
            'Q2o', 'Q3o', 'Q4o', 'Q5o', 'K2o', '62o', '63o', '73o', '74o', '82o', '92o',
            '52o', '42o', '32o']
  }
};

// Get tier for a hand
export function getHandTier(notation) {
  const normalized = normalizeHand(notation);

  for (const [tier, data] of Object.entries(HAND_TIERS)) {
    if (data.hands.includes(normalized)) {
      return tier;
    }
  }
  return 'trash';
}

// Normalize hand notation (e.g., "KA" -> "AK", ensure proper suffix)
export function normalizeHand(notation) {
  if (!notation) return null;

  let rank1 = notation[0].toUpperCase();
  let rank2 = notation[1].toUpperCase();
  const suffix = notation[2]?.toLowerCase() || '';

  const r1 = RANKS.indexOf(rank1);
  const r2 = RANKS.indexOf(rank2);

  // Put higher rank first
  if (r1 > r2) {
    [rank1, rank2] = [rank2, rank1];
  }

  // Pairs don't have suffix
  if (rank1 === rank2) {
    return rank1 + rank2;
  }

  return rank1 + rank2 + (suffix || 'o');
}

// Preflop equity vs random hand (approximate percentages)
// These are equity percentages heads-up vs a random hand
export const PREFLOP_EQUITY = {
  // Pocket pairs
  'AA': 85.0, 'KK': 82.4, 'QQ': 80.0, 'JJ': 77.5, 'TT': 75.1,
  '99': 72.1, '88': 69.1, '77': 66.2, '66': 63.3, '55': 60.3,
  '44': 57.0, '33': 53.7, '22': 50.3,

  // Suited Ax
  'AKs': 67.0, 'AQs': 66.1, 'AJs': 65.4, 'ATs': 64.7, 'A9s': 63.0,
  'A8s': 62.1, 'A7s': 61.1, 'A6s': 60.0, 'A5s': 60.2, 'A4s': 59.3,
  'A3s': 58.5, 'A2s': 57.7,

  // Offsuit Ax
  'AKo': 65.3, 'AQo': 64.4, 'AJo': 63.6, 'ATo': 62.8, 'A9o': 60.7,
  'A8o': 59.7, 'A7o': 58.6, 'A6o': 57.4, 'A5o': 57.6, 'A4o': 56.6,
  'A3o': 55.8, 'A2o': 55.0,

  // Suited Kx
  'KQs': 63.4, 'KJs': 62.6, 'KTs': 61.9, 'K9s': 60.0, 'K8s': 58.5,
  'K7s': 57.8, 'K6s': 56.8, 'K5s': 55.8, 'K4s': 54.9, 'K3s': 54.1,
  'K2s': 53.3,

  // Offsuit Kx
  'KQo': 61.4, 'KJo': 60.6, 'KTo': 59.8, 'K9o': 57.6, 'K8o': 55.8,
  'K7o': 55.0, 'K6o': 53.9, 'K5o': 52.9, 'K4o': 51.9, 'K3o': 51.1,
  'K2o': 50.2,

  // Suited Qx
  'QJs': 60.3, 'QTs': 59.5, 'Q9s': 57.9, 'Q8s': 56.2, 'Q7s': 54.6,
  'Q6s': 54.0, 'Q5s': 53.1, 'Q4s': 52.2, 'Q3s': 51.4, 'Q2s': 50.6,

  // Offsuit Qx
  'QJo': 58.2, 'QTo': 57.3, 'Q9o': 55.3, 'Q8o': 53.3, 'Q7o': 51.5,
  'Q6o': 50.8, 'Q5o': 49.8, 'Q4o': 48.8, 'Q3o': 47.9, 'Q2o': 47.1,

  // Suited Jx
  'JTs': 57.5, 'J9s': 55.8, 'J8s': 54.2, 'J7s': 52.4, 'J6s': 51.0,
  'J5s': 50.4, 'J4s': 49.5, 'J3s': 48.7, 'J2s': 47.9,

  // Offsuit Jx
  'JTo': 55.4, 'J9o': 53.4, 'J8o': 51.5, 'J7o': 49.5, 'J6o': 47.9,
  'J5o': 47.3, 'J4o': 46.3, 'J3o': 45.5, 'J2o': 44.6,

  // Suited Tx
  'T9s': 54.3, 'T8s': 52.6, 'T7s': 50.9, 'T6s': 49.3, 'T5s': 47.8,
  'T4s': 47.2, 'T3s': 46.4, 'T2s': 45.6,

  // Offsuit Tx
  'T9o': 51.7, 'T8o': 49.8, 'T7o': 47.8, 'T6o': 46.0, 'T5o': 44.4,
  'T4o': 43.7, 'T3o': 42.8, 'T2o': 42.0,

  // Suited 9x
  '98s': 51.1, '97s': 49.5, '96s': 47.8, '95s': 46.1, '94s': 44.7,
  '93s': 44.1, '92s': 43.4,

  // Offsuit 9x
  '98o': 48.3, '97o': 46.5, '96o': 44.5, '95o': 42.7, '94o': 41.2,
  '93o': 40.5, '92o': 39.7,

  // Suited 8x
  '87s': 48.2, '86s': 46.5, '85s': 44.8, '84s': 43.2, '83s': 41.8,
  '82s': 41.2,

  // Offsuit 8x
  '87o': 45.2, '86o': 43.2, '85o': 41.4, '84o': 39.6, '83o': 38.1,
  '82o': 37.4,

  // Suited 7x
  '76s': 45.7, '75s': 44.0, '74s': 42.3, '73s': 40.7, '72s': 39.4,

  // Offsuit 7x
  '76o': 42.5, '75o': 40.6, '74o': 38.7, '73o': 36.9, '72o': 35.5,

  // Suited 6x
  '65s': 43.2, '64s': 41.4, '63s': 39.8, '62s': 38.4,

  // Offsuit 6x
  '65o': 39.8, '64o': 37.8, '63o': 36.0, '62o': 34.5,

  // Suited 5x
  '54s': 41.1, '53s': 39.4, '52s': 37.9,

  // Offsuit 5x
  '54o': 37.6, '53o': 35.7, '52o': 34.2,

  // Suited 4x
  '43s': 38.0, '42s': 36.6,

  // Offsuit 4x
  '43o': 34.3, '42o': 32.7,

  // Suited 3x
  '32s': 35.4,

  // Offsuit 3x
  '32o': 31.6
};

// Get equity for a hand
export function getEquity(notation) {
  const normalized = normalizeHand(notation);
  return PREFLOP_EQUITY[normalized] || 30; // Default to 30% for unknown hands
}

// Compare two hands by strength (returns positive if hand1 > hand2)
export function compareHands(hand1, hand2) {
  const eq1 = getEquity(hand1);
  const eq2 = getEquity(hand2);
  return eq1 - eq2;
}

// Get rank value (A=14, K=13, ..., 2=2)
export function getRankValue(rank) {
  const values = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10 };
  return values[rank] || parseInt(rank);
}

// Sort hands by equity (descending)
export function sortHandsByEquity(hands) {
  return [...hands].sort((a, b) => getEquity(b) - getEquity(a));
}

// Get a random card
export function getRandomCard() {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { rank, suit };
}

// Get two random cards for a specific hand notation
export function getCardsForHand(notation) {
  const hand = parseHand(notation);
  if (!hand) return null;

  const availableSuits = [...SUITS];

  if (hand.pair) {
    // For pairs, pick two different suits
    const suit1 = availableSuits.splice(Math.floor(Math.random() * availableSuits.length), 1)[0];
    const suit2 = availableSuits[Math.floor(Math.random() * availableSuits.length)];
    return [
      { rank: hand.rank1, suit: suit1 },
      { rank: hand.rank2, suit: suit2 }
    ];
  }

  if (hand.suited) {
    // For suited hands, pick one suit for both
    const suit = availableSuits[Math.floor(Math.random() * availableSuits.length)];
    return [
      { rank: hand.rank1, suit },
      { rank: hand.rank2, suit }
    ];
  }

  // For offsuit hands, pick two different suits
  const suit1 = availableSuits.splice(Math.floor(Math.random() * availableSuits.length), 1)[0];
  const suit2 = availableSuits[Math.floor(Math.random() * availableSuits.length)];
  return [
    { rank: hand.rank1, suit: suit1 },
    { rank: hand.rank2, suit: suit2 }
  ];
}

// Get display string for a card
export function cardToString(card) {
  return card.rank + SUIT_SYMBOLS[card.suit];
}

// Check if hand is suited
export function isSuited(notation) {
  return notation.endsWith('s');
}

// Check if hand is a pair
export function isPair(notation) {
  return notation.length === 2 && notation[0] === notation[1];
}

// Get hand notation from grid position (row, col)
export function getHandFromGrid(row, col) {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];

  if (row === col) {
    return rank1 + rank2; // Pair
  } else if (row < col) {
    return rank1 + rank2 + 's'; // Suited (above diagonal)
  } else {
    return rank2 + rank1 + 'o'; // Offsuit (below diagonal)
  }
}

// Get grid position from hand notation
export function getGridPosition(notation) {
  const hand = parseHand(notation);
  if (!hand) return null;

  const row = RANKS.indexOf(hand.rank1);
  const col = RANKS.indexOf(hand.rank2);

  if (hand.pair) {
    return { row, col: row };
  } else if (hand.suited) {
    return { row: Math.min(row, col), col: Math.max(row, col) };
  } else {
    return { row: Math.max(row, col), col: Math.min(row, col) };
  }
}

// Get random hands from a specific tier
export function getRandomHandsFromTier(tier, count = 1) {
  const tierData = HAND_TIERS[tier];
  if (!tierData || tierData.hands.length === 0) return [];

  const shuffled = [...tierData.hands].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get random hands for quiz (mixed tiers)
export function getRandomQuizHands(count = 10) {
  const tiers = ['premium', 'strong', 'playable', 'marginal', 'trash'];
  const hands = [];

  // Get some from each tier
  for (const tier of tiers) {
    const tierHands = getRandomHandsFromTier(tier, Math.ceil(count / tiers.length));
    hands.push(...tierHands);
  }

  // Shuffle and return requested count
  return hands.sort(() => Math.random() - 0.5).slice(0, count);
}

// Alias for ALL_HANDS (used by drills)
export const STARTING_HANDS = ALL_HANDS;

// Get hand strength as a value between 0 and 1 (equity / 100)
export function getHandStrength(notation) {
  return getEquity(notation) / 100;
}

// Get a random hand from all 169 starting hands
export function getRandomHand() {
  return ALL_HANDS[Math.floor(Math.random() * ALL_HANDS.length)];
}

// Format hand notation for display (uppercase, clean)
export function formatHandNotation(notation) {
  if (!notation) return '';
  const parsed = parseHand(notation);
  if (!parsed) return notation;

  if (parsed.pair) {
    return parsed.rank1 + parsed.rank2;
  }

  const suffix = parsed.suited ? 's' : 'o';
  return parsed.rank1 + parsed.rank2 + suffix;
}
