/**
 * PlayingCard Component
 * Renders a playing card with rank and suit
 */

import { SUIT_SYMBOLS, SUIT_NAMES } from '../data/hands.js';

/**
 * Create a playing card element
 * @param {object} options - Card options
 * @param {string} options.rank - Card rank (A, K, Q, J, T, 9-2)
 * @param {string} options.suit - Card suit (s, h, d, c)
 * @param {string} options.size - Size variant (sm, md, lg)
 * @param {boolean} options.faceDown - Show card back
 * @param {boolean} options.highlighted - Highlight the card
 * @param {boolean} options.disabled - Dim the card
 * @param {boolean} options.selected - Show selected state
 * @param {boolean} options.animate - Animate card deal
 * @param {Function} options.onClick - Click handler
 */
export function createPlayingCard(options = {}) {
  const {
    rank = 'A',
    suit = 's',
    size = 'md',
    faceDown = false,
    highlighted = false,
    disabled = false,
    selected = false,
    animate = false,
    onClick = null
  } = options;

  const card = document.createElement('div');
  card.className = 'playing-card';
  card.classList.add(`playing-card--${size}`);
  card.classList.add(`playing-card--${SUIT_NAMES[suit] || 'spades'}`);

  if (faceDown) {
    card.classList.add('playing-card--back');
  }

  if (highlighted) {
    card.classList.add('playing-card--highlighted');
  }

  if (disabled) {
    card.classList.add('playing-card--disabled');
  }

  if (selected) {
    card.classList.add('playing-card--selected');
  }

  if (animate) {
    card.classList.add('playing-card--dealing');
  }

  if (!faceDown) {
    const rankEl = document.createElement('span');
    rankEl.className = 'playing-card__rank';
    rankEl.textContent = rank;

    const suitEl = document.createElement('span');
    suitEl.className = 'playing-card__suit';
    suitEl.textContent = SUIT_SYMBOLS[suit] || SUIT_SYMBOLS.s;

    card.appendChild(rankEl);
    card.appendChild(suitEl);
  }

  if (onClick && !disabled) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => onClick({ rank, suit }));
  }

  // Store data on element
  card.dataset.rank = rank;
  card.dataset.suit = suit;

  return card;
}

/**
 * Create a group of cards (hand display)
 * @param {Array} cards - Array of {rank, suit} objects
 * @param {object} options - Options for all cards
 * @param {boolean} options.overlap - Overlap cards
 */
export function createCardGroup(cards, options = {}) {
  const { overlap = false, ...cardOptions } = options;

  const group = document.createElement('div');
  group.className = 'card-group';

  if (overlap) {
    group.classList.add('card-group--overlap');
  }

  cards.forEach((card, index) => {
    const cardEl = createPlayingCard({
      ...cardOptions,
      ...card,
      animate: cardOptions.animate ? true : false
    });

    // Stagger animation if enabled
    if (cardOptions.animate) {
      cardEl.style.animationDelay = `${index * 0.1}s`;
    }

    group.appendChild(cardEl);
  });

  return group;
}

/**
 * Create a hand display from notation (e.g., "AKs")
 * @param {string} notation - Hand notation
 * @param {object} options - Display options
 */
export function createHandDisplay(notation, options = {}) {
  const { size = 'md', animate = false } = options;

  if (!notation || notation.length < 2) {
    return document.createElement('div');
  }

  const rank1 = notation[0].toUpperCase();
  const rank2 = notation[1].toUpperCase();
  const suited = notation[2]?.toLowerCase() === 's';

  // Generate appropriate suits
  let suit1, suit2;
  if (suited) {
    suit1 = suit2 = 's'; // Both spades for suited
  } else {
    suit1 = 's'; // Spade
    suit2 = 'h'; // Heart (different suit)
  }

  const cards = [
    { rank: rank1, suit: suit1 },
    { rank: rank2, suit: suit2 }
  ];

  return createCardGroup(cards, { size, animate });
}

/**
 * Update a card's state
 * @param {HTMLElement} cardEl - Card element
 * @param {object} state - State updates
 */
export function updateCardState(cardEl, state) {
  if (state.highlighted !== undefined) {
    cardEl.classList.toggle('playing-card--highlighted', state.highlighted);
  }

  if (state.disabled !== undefined) {
    cardEl.classList.toggle('playing-card--disabled', state.disabled);
  }

  if (state.selected !== undefined) {
    cardEl.classList.toggle('playing-card--selected', state.selected);
  }
}

/**
 * Animate card flip
 * @param {HTMLElement} cardEl - Card element
 * @param {object} newCard - New card data {rank, suit}
 */
export function flipCard(cardEl, newCard) {
  cardEl.style.transition = 'transform 0.3s ease';
  cardEl.style.transform = 'rotateY(90deg)';

  setTimeout(() => {
    // Update card content
    if (newCard) {
      cardEl.dataset.rank = newCard.rank;
      cardEl.dataset.suit = newCard.suit;

      const rankEl = cardEl.querySelector('.playing-card__rank');
      const suitEl = cardEl.querySelector('.playing-card__suit');

      if (rankEl) rankEl.textContent = newCard.rank;
      if (suitEl) suitEl.textContent = SUIT_SYMBOLS[newCard.suit];

      // Update suit color class
      cardEl.className = cardEl.className.replace(/playing-card--(hearts|diamonds|clubs|spades)/, '');
      cardEl.classList.add(`playing-card--${SUIT_NAMES[newCard.suit]}`);
    }

    cardEl.style.transform = 'rotateY(0deg)';
  }, 150);
}

/**
 * Get suit color (red or black)
 * @param {string} suit - Suit code (s, h, d, c)
 */
export function getSuitColor(suit) {
  return suit === 'h' || suit === 'd' ? 'red' : 'black';
}

/**
 * Parse a card string (e.g., "As", "Kh")
 * @param {string} cardStr - Card string
 */
export function parseCardString(cardStr) {
  if (!cardStr || cardStr.length < 2) return null;

  return {
    rank: cardStr[0].toUpperCase(),
    suit: cardStr[1].toLowerCase()
  };
}

export default {
  createPlayingCard,
  createCardGroup,
  createHandDisplay,
  updateCardState,
  flipCard,
  getSuitColor,
  parseCardString
};
