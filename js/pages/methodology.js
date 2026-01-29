/**
 * Methodology Page
 * Transparent explanation of GTO range sources and approach
 */

/**
 * Render the methodology page
 * @param {HTMLElement} container - Container element
 */
export function renderMethodologyPage(container) {
  container.innerHTML = `
    <div class="methodology container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Methodology</span>
        </nav>
        <h1 class="page-header__title">Our Methodology</h1>
        <p class="page-header__subtitle">How we build scenarios and where our ranges come from</p>
      </div>

      <div class="methodology__content animate-fade-in-up">
        <!-- Our Approach -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x1F3AF;</span>
            Our Approach
          </h2>
          <div class="methodology__section-content">
            <p>
              LibreGTO uses a <strong>"Simplified GTO"</strong> philosophy designed for learning.
              Rather than presenting raw solver outputs (which often include complex mixed strategies),
              we simplify decisions to make concepts learnable and actionable.
            </p>
            <div class="methodology__highlights">
              <div class="methodology__highlight">
                <span class="methodology__highlight-icon">&#x2713;</span>
                <span>Consensus-based ranges from multiple trusted sources</span>
              </div>
              <div class="methodology__highlight">
                <span class="methodology__highlight-icon">&#x2713;</span>
                <span>Mixed strategies simplified to dominant actions</span>
              </div>
              <div class="methodology__highlight">
                <span class="methodology__highlight-icon">&#x2713;</span>
                <span>Focus on high-frequency spots with clear agreement</span>
              </div>
              <div class="methodology__highlight">
                <span class="methodology__highlight-icon">&#x2713;</span>
                <span>Avoid controversial or highly situational spots</span>
              </div>
            </div>
            <p class="methodology__note">
              Our goal is to help you learn GTO fundamentals, not to provide solver-perfect outputs
              for exploiting professional players.
            </p>
          </div>
        </section>

        <!-- Sources We Use -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x1F4DA;</span>
            Sources We Use
          </h2>
          <div class="methodology__section-content">
            <p>
              All ranges are derived from <strong>consensus across multiple reputable sources</strong>.
              We only implement scenarios where 3+ sources agree on core ranges:
            </p>
            <div class="methodology__sources">
              <div class="methodology__source">
                <strong>GTO Wizard</strong>
                <span class="methodology__source-type">Solver-based</span>
                <p>High-precision solver outputs with extensive preflop and postflop solutions.</p>
              </div>
              <div class="methodology__source">
                <strong>PokerCoaching.com</strong>
                <span class="methodology__source-type">Jonathan Little</span>
                <p>Practical GTO charts simplified for learning, backed by solver analysis.</p>
              </div>
              <div class="methodology__source">
                <strong>Upswing Poker</strong>
                <span class="methodology__source-type">Doug Polk Methodology</span>
                <p>Battle-tested ranges from high-stakes professional players.</p>
              </div>
              <div class="methodology__source">
                <strong>Red Chip Poker</strong>
                <span class="methodology__source-type">sGTO Approach</span>
                <p>Simplified GTO ranges focused on practical application.</p>
              </div>
              <div class="methodology__source">
                <strong>SplitSuit (James Sweeney)</strong>
                <span class="methodology__source-type">Educational</span>
                <p>Clear explanations of GTO concepts for learning and improvement.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- What We Include -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x2705;</span>
            What We Include
          </h2>
          <div class="methodology__section-content">
            <p>
              These scenarios have <strong>high consensus</strong> across sources and are fundamental
              to understanding preflop GTO strategy:
            </p>
            <div class="methodology__scenarios">
              <div class="methodology__scenario methodology__scenario--included">
                <div class="methodology__scenario-header">
                  <strong>BB Defense vs Opens</strong>
                  <span class="methodology__confidence methodology__confidence--high">High Confidence</span>
                </div>
                <p>The most studied spot in poker. Sources strongly agree on defend frequencies vs each position.</p>
              </div>
              <div class="methodology__scenario methodology__scenario--included">
                <div class="methodology__scenario-header">
                  <strong>Defending vs 3-Bets</strong>
                  <span class="methodology__confidence methodology__confidence--high">High Confidence</span>
                </div>
                <p>Clear consensus on call/4-bet/fold ranges when you open and face a 3-bet.</p>
              </div>
              <div class="methodology__scenario methodology__scenario--included">
                <div class="methodology__scenario-header">
                  <strong>Value 3-Bet Hands</strong>
                  <span class="methodology__confidence methodology__confidence--high">High Confidence</span>
                </div>
                <p>Universal agreement on premium hands that should 3-bet for value (AA-JJ, AK, etc.).</p>
              </div>
              <div class="methodology__scenario methodology__scenario--included">
                <div class="methodology__scenario-header">
                  <strong>SB 3-Bet or Fold</strong>
                  <span class="methodology__confidence methodology__confidence--high">High Confidence</span>
                </div>
                <p>All sources agree: from SB, you should 3-bet or fold. Calling is rarely correct.</p>
              </div>
              <div class="methodology__scenario methodology__scenario--simplified">
                <div class="methodology__scenario-header">
                  <strong>Cold 4-Bet Spots</strong>
                  <span class="methodology__confidence methodology__confidence--moderate">Simplified</span>
                </div>
                <p>Ultra-tight range (AA, KK only). "If you're not sure, fold is rarely wrong here."</p>
              </div>
              <div class="methodology__scenario methodology__scenario--educational">
                <div class="methodology__scenario-header">
                  <strong>Board Texture Recognition</strong>
                  <span class="methodology__confidence methodology__confidence--educational">Educational</span>
                </div>
                <p>Conceptual understanding of dry/wet/paired/monotone boards. No disputed ranges.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- What We Avoid -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x26A0;</span>
            What We Avoid
          </h2>
          <div class="methodology__section-content">
            <p>
              These scenarios are <strong>deferred to Stage 4</strong> because they lack sufficient
              source agreement or are too situational:
            </p>
            <div class="methodology__avoided">
              <div class="methodology__avoided-item">
                <strong>Postflop C-Bet Defense</strong>
                <p>Too board-texture dependent. Solver outputs vary significantly by runout.</p>
              </div>
              <div class="methodology__avoided-item">
                <strong>Check-Raise Construction</strong>
                <p>No simple consensus on check-raise ranges. Highly dependent on game dynamics.</p>
              </div>
              <div class="methodology__avoided-item">
                <strong>River Bluffing</strong>
                <p>Blocker effects are disputed. Requires full hand context to evaluate correctly.</p>
              </div>
              <div class="methodology__avoided-item">
                <strong>Squeeze Spots</strong>
                <p>Limited public data on squeeze ranges. Highly dependent on stack depths and dynamics.</p>
              </div>
              <div class="methodology__avoided-item">
                <strong>Mixed Strategy Hands</strong>
                <p>Hands that solvers say to "mix" (e.g., 60% call / 40% fold) are simplified to the dominant action.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Limitations -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x1F4CB;</span>
            Limitations
          </h2>
          <div class="methodology__section-content">
            <div class="methodology__limitations">
              <div class="methodology__limitation">
                <div class="methodology__limitation-title">Not Solver-Perfect</div>
                <p>Our ranges are simplified for learning. Professional solvers may suggest different frequencies.</p>
              </div>
              <div class="methodology__limitation">
                <div class="methodology__limitation-title">100BB Cash Game Assumptions</div>
                <p>All scenarios assume 100BB effective stacks in a cash game context. MTT or short-stack play differs.</p>
              </div>
              <div class="methodology__limitation">
                <div class="methodology__limitation-title">Standard Bet Sizing</div>
                <p>We assume standard sizings: 2.5BB opens, 3x 3-bets IP, 4x 3-bets OOP. Non-standard sizing affects ranges.</p>
              </div>
              <div class="methodology__limitation">
                <div class="methodology__limitation-title">Designed for Learning</div>
                <p>LibreGTO is designed to teach GTO fundamentals, not to provide edge against professional players.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- How This Helps You -->
        <section class="methodology__section">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x1F4A1;</span>
            How This Helps You
          </h2>
          <div class="methodology__section-content">
            <p>
              By focusing on high-consensus spots with clear answers, you'll build a solid foundation
              that transfers to real play:
            </p>
            <ul class="methodology__benefits">
              <li><strong>Confidence in fundamental decisions</strong> - Know you're playing correctly in common spots</li>
              <li><strong>Reduced decision fatigue</strong> - Clear guidelines for preflop action</li>
              <li><strong>Foundation for advanced play</strong> - Once you master these, you can explore nuances</li>
              <li><strong>Exploitative adjustments</strong> - Understanding baseline GTO lets you deviate intelligently</li>
            </ul>
          </div>
        </section>

        <!-- Feedback Section -->
        <section class="methodology__section methodology__section--feedback">
          <h2 class="methodology__section-title">
            <span class="methodology__section-icon">&#x1F4AC;</span>
            Questions or Feedback?
          </h2>
          <div class="methodology__section-content">
            <p>
              If you notice a range that seems incorrect or have questions about our methodology,
              please open an issue on GitHub. We're committed to accuracy and transparency.
            </p>
            <div class="methodology__actions">
              <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="btn btn--secondary">
                Report an Issue
              </a>
              <a href="#/scenarios" class="btn btn--primary">
                Start Practicing
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}
