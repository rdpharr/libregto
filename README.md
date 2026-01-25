# Hold'em Trainer

**Live Site: [libregto.com](https://libregto.com)**

A GTO (Game Theory Optimal) poker training application built with vanilla HTML, CSS, and JavaScript.

## Features

- **Stage 1: Foundations** - Master the core concepts
  - Hand Strength: Learn to evaluate starting hands
  - Position: Understand positional advantage
  - Equity: Calculate winning chances
  - Ranges: Build and read hand ranges

- **Interactive Learning**
  - Visual playing cards with suit colors
  - 13x13 range grid for hand visualization
  - Quizzes with immediate feedback
  - Progress tracking with localStorage

## Getting Started

This is a static site with no build step required. To run locally:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Design

- **Aesthetic**: "Refined Warmth" - dark theme with burnt orange (#ea580c) accents
- **Typography**: Playfair Display (display), Inter (body), JetBrains Mono (numbers)
- **Responsive**: Mobile-friendly with touch-optimized controls

## Project Structure

```
hold-em-trainer/
├── index.html          # Main entry point
├── css/
│   ├── variables.css   # Design tokens
│   ├── base.css        # Reset + typography
│   ├── components.css  # UI components
│   └── pages.css       # Page layouts + animations
└── js/
    ├── app.js          # Main initialization + routing
    ├── router.js       # Hash-based SPA router
    ├── storage.js      # localStorage persistence
    ├── data/
    │   ├── hands.js    # Hand utilities + equity data
    │   └── ranges.js   # GTO opening ranges
    ├── components/
    │   ├── PlayingCard.js
    │   ├── RangeGrid.js
    │   └── Quiz.js
    └── modules/
        ├── handStrength.js
        ├── position.js
        ├── equity.js
        └── ranges.js
```

## License

MIT
