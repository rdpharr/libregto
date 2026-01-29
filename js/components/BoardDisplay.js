/**
 * BoardDisplay Component
 * Displays community cards (flop, turn, river) with visual separation
 */

import { PlayingCard } from './PlayingCard.js';

/**
 * Render the board display
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 * @param {Array} options.cards - Array of card objects [{rank, suit}, ...]
 * @param {string} [options.texture] - Board texture (dry, wet, paired, monotone)
 * @param {boolean} [options.showTexture=true] - Whether to show texture badge
 * @param {string} [options.size='md'] - Card size (sm, md, lg)
 */
export function renderBoardDisplay(container, options) {
  const {
    cards = [],
    texture = null,
    showTexture = true,
    size = 'md'
  } = options;

  container.innerHTML = `
    <div class="board-display">
      <div class="board-display__label">Board</div>
      <div class="board-display__cards" id="board-cards">
        ${renderBoardCards(cards, size)}
      </div>
      ${showTexture && texture ? renderTextureBadge(texture) : ''}
    </div>
  `;

  // Render actual card components
  renderCardComponents(container, cards, size);
}

/**
 * Render placeholder card HTML structure
 * @param {Array} cards - Array of card objects
 * @param {string} size - Card size
 * @returns {string} HTML string
 */
function renderBoardCards(cards, size) {
  if (cards.length === 0) {
    return '<span style="color: var(--color-text-tertiary);">No board yet</span>';
  }

  // Group cards: flop (0-2), turn (3), river (4)
  const flop = cards.slice(0, 3);
  const turn = cards.slice(3, 4);
  const river = cards.slice(4, 5);

  let html = '';

  // Flop
  if (flop.length > 0) {
    html += `<div class="board-display__section board-display__flop" id="board-flop"></div>`;
  }

  // Turn
  if (turn.length > 0) {
    html += `<div class="board-display__divider"></div>`;
    html += `<div class="board-display__section board-display__turn" id="board-turn"></div>`;
  }

  // River
  if (river.length > 0) {
    html += `<div class="board-display__divider"></div>`;
    html += `<div class="board-display__section board-display__river" id="board-river"></div>`;
  }

  return html;
}

/**
 * Render actual PlayingCard components
 * @param {HTMLElement} container - Container element
 * @param {Array} cards - Array of card objects
 * @param {string} size - Card size
 */
function renderCardComponents(container, cards, size) {
  if (cards.length === 0) return;

  const flop = cards.slice(0, 3);
  const turn = cards.slice(3, 4);
  const river = cards.slice(4, 5);

  // Render flop cards
  const flopContainer = container.querySelector('#board-flop');
  if (flopContainer) {
    flop.forEach(card => {
      const playingCard = new PlayingCard(card.rank, card.suit, { size });
      playingCard.render(flopContainer);
    });
  }

  // Render turn card
  const turnContainer = container.querySelector('#board-turn');
  if (turnContainer && turn.length > 0) {
    const playingCard = new PlayingCard(turn[0].rank, turn[0].suit, { size });
    playingCard.render(turnContainer);
  }

  // Render river card
  const riverContainer = container.querySelector('#board-river');
  if (riverContainer && river.length > 0) {
    const playingCard = new PlayingCard(river[0].rank, river[0].suit, { size });
    playingCard.render(riverContainer);
  }
}

/**
 * Render texture badge
 * @param {string} texture - Board texture
 * @returns {string} HTML string
 */
function renderTextureBadge(texture) {
  const textureInfo = getTextureInfo(texture);

  return `
    <div class="board-display__texture">
      <span class="board-display__texture-badge board-display__texture-badge--${texture.toLowerCase()}">
        ${textureInfo.label}
      </span>
      <span>${textureInfo.description}</span>
    </div>
  `;
}

/**
 * Get texture information
 * @param {string} texture - Board texture
 * @returns {Object} Texture info {label, description}
 */
function getTextureInfo(texture) {
  const textures = {
    dry: {
      label: 'Dry',
      description: 'Few draws possible'
    },
    wet: {
      label: 'Wet',
      description: 'Many draws available'
    },
    paired: {
      label: 'Paired',
      description: 'Board has a pair'
    },
    monotone: {
      label: 'Monotone',
      description: 'All one suit'
    }
  };

  return textures[texture.toLowerCase()] || { label: texture, description: '' };
}

/**
 * Analyze board texture
 * @param {Array} cards - Array of card objects [{rank, suit}, ...]
 * @returns {string} Board texture (dry, wet, paired, monotone)
 */
export function analyzeBoardTexture(cards) {
  if (cards.length < 3) return 'unknown';

  const flop = cards.slice(0, 3);

  // Check for monotone
  const suits = flop.map(c => c.suit);
  if (suits.every(s => s === suits[0])) {
    return 'monotone';
  }

  // Check for paired
  const ranks = flop.map(c => c.rank);
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length < 3) {
    return 'paired';
  }

  // Check for wet vs dry
  // Wet: connected cards, two-tone
  const rankValues = ranks.map(rankToValue);
  rankValues.sort((a, b) => a - b);

  const gaps = [];
  for (let i = 1; i < rankValues.length; i++) {
    gaps.push(rankValues[i] - rankValues[i - 1]);
  }

  // High connectivity = wet
  const maxGap = Math.max(...gaps);
  const totalGap = rankValues[2] - rankValues[0];

  // Two-tone check
  const suitCounts = {};
  suits.forEach(s => {
    suitCounts[s] = (suitCounts[s] || 0) + 1;
  });
  const isTwoTone = Object.values(suitCounts).some(count => count === 2);

  // Wet: connected (total gap <= 4) and/or two-tone
  if (totalGap <= 4 || (isTwoTone && totalGap <= 6)) {
    return 'wet';
  }

  return 'dry';
}

/**
 * Convert rank to numeric value
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function rankToValue(rank) {
  const values = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return values[rank] || 0;
}

/**
 * Generate a random board
 * @param {number} numCards - Number of cards (3 for flop, 4 for turn, 5 for river)
 * @param {Array} [excludeCards=[]] - Cards to exclude (already dealt)
 * @returns {Array} Array of card objects
 */
export function generateRandomBoard(numCards = 3, excludeCards = []) {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['h', 'd', 'c', 's'];

  // Build deck excluding specified cards
  const deck = [];
  ranks.forEach(rank => {
    suits.forEach(suit => {
      const isExcluded = excludeCards.some(
        c => c.rank === rank && c.suit === suit
      );
      if (!isExcluded) {
        deck.push({ rank, suit });
      }
    });
  });

  // Shuffle and pick
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, numCards);
}

/**
 * Generate a board with specific texture
 * @param {string} texture - Desired texture (dry, wet, paired, monotone)
 * @param {Array} [excludeCards=[]] - Cards to exclude
 * @returns {Array} Array of card objects
 */
export function generateBoardWithTexture(texture, excludeCards = []) {
  const suits = ['h', 'd', 'c', 's'];

  // Keep trying until we get the right texture
  let attempts = 0;
  while (attempts < 100) {
    let board;

    switch (texture) {
      case 'monotone':
        board = generateMonotoneBoard(excludeCards);
        break;
      case 'paired':
        board = generatePairedBoard(excludeCards);
        break;
      case 'wet':
        board = generateWetBoard(excludeCards);
        break;
      case 'dry':
        board = generateDryBoard(excludeCards);
        break;
      default:
        board = generateRandomBoard(3, excludeCards);
    }

    if (board && analyzeBoardTexture(board) === texture) {
      return board;
    }
    attempts++;
  }

  // Fallback
  return generateRandomBoard(3, excludeCards);
}

function generateMonotoneBoard(excludeCards) {
  const suits = ['h', 'd', 'c', 's'];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const available = ranks.filter(rank =>
    !excludeCards.some(c => c.rank === rank && c.suit === suit)
  );

  // Shuffle and pick 3
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, 3).map(rank => ({ rank, suit }));
}

function generatePairedBoard(excludeCards) {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['h', 'd', 'c', 's'];

  // Pick a rank for the pair
  const pairRank = ranks[Math.floor(Math.random() * ranks.length)];

  // Pick two suits for the pair
  const pairSuits = suits.slice().sort(() => Math.random() - 0.5).slice(0, 2);

  // Pick a different rank and suit for third card
  const otherRanks = ranks.filter(r => r !== pairRank);
  const otherRank = otherRanks[Math.floor(Math.random() * otherRanks.length)];
  const otherSuit = suits[Math.floor(Math.random() * suits.length)];

  return [
    { rank: pairRank, suit: pairSuits[0] },
    { rank: pairRank, suit: pairSuits[1] },
    { rank: otherRank, suit: otherSuit }
  ];
}

function generateWetBoard(excludeCards) {
  // Connected cards with two-tone
  const startRank = 5 + Math.floor(Math.random() * 7); // 5-11 (5 through J)
  const ranks = [];

  for (let i = 0; i < 3; i++) {
    const value = startRank + i;
    ranks.push(valueToRank(value));
  }

  // Make it two-tone
  const suits = ['h', 'd', 'c', 's'].sort(() => Math.random() - 0.5);

  return [
    { rank: ranks[0], suit: suits[0] },
    { rank: ranks[1], suit: suits[0] },
    { rank: ranks[2], suit: suits[1] }
  ];
}

function generateDryBoard(excludeCards) {
  // Disconnected cards, rainbow
  const highRanks = ['A', 'K', 'Q'];
  const lowRanks = ['7', '6', '5', '4', '3', '2'];

  const rank1 = highRanks[Math.floor(Math.random() * highRanks.length)];
  const rank2 = lowRanks[Math.floor(Math.random() * lowRanks.length)];
  const midRanks = ['9', '8', '7'].filter(r => r !== rank2);
  const rank3 = midRanks[Math.floor(Math.random() * midRanks.length)];

  // Rainbow suits
  const suits = ['h', 'd', 'c', 's'].sort(() => Math.random() - 0.5).slice(0, 3);

  return [
    { rank: rank1, suit: suits[0] },
    { rank: rank2, suit: suits[1] },
    { rank: rank3, suit: suits[2] }
  ];
}

function valueToRank(value) {
  if (value === 14) return 'A';
  if (value === 13) return 'K';
  if (value === 12) return 'Q';
  if (value === 11) return 'J';
  if (value === 10) return 'T';
  return String(value);
}
