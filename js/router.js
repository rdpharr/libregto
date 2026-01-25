/**
 * Simple Hash-Based Router
 * Handles navigation between pages/views
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.previousRoute = null;
    this.onNavigate = null;

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
  }

  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/foundations', '/module/:id')
   * @param {Function} handler - Function to call when route matches
   */
  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * Navigate to a route
   * @param {string} path - Path to navigate to
   * @param {object} state - Optional state to pass
   */
  navigate(path, state = {}) {
    window.location.hash = path;
    this.state = state;
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Handle route changes
   */
  handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    this.previousRoute = this.currentRoute;
    this.currentRoute = hash;

    // Find matching route
    let matched = false;
    for (const [path, handler] of this.routes) {
      const params = this.matchRoute(path, hash);
      if (params !== null) {
        matched = true;

        // Call navigation callback if set
        if (this.onNavigate) {
          this.onNavigate(hash, this.previousRoute);
        }

        // Call route handler
        handler(params, this.state || {});
        this.state = null;
        break;
      }
    }

    // Handle 404
    if (!matched) {
      const notFoundHandler = this.routes.get('*');
      if (notFoundHandler) {
        notFoundHandler({ path: hash });
      } else {
        console.warn(`No route found for: ${hash}`);
      }
    }
  }

  /**
   * Match a route pattern against a path
   * @param {string} pattern - Route pattern (e.g., '/module/:id')
   * @param {string} path - Actual path (e.g., '/module/hand-strength')
   * @returns {object|null} - Params object or null if no match
   */
  matchRoute(pattern, path) {
    // Exact match
    if (pattern === path) {
      return {};
    }

    // Pattern matching with params
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // This is a parameter
        const paramName = patternPart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        // Not a match
        return null;
      }
    }

    return params;
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get previous route
   */
  getPreviousRoute() {
    return this.previousRoute;
  }

  /**
   * Check if a route is active
   * @param {string} path - Path to check
   */
  isActive(path) {
    return this.currentRoute === path || this.currentRoute?.startsWith(path + '/');
  }

  /**
   * Set callback for navigation events
   * @param {Function} callback - Function to call on navigation
   */
  setOnNavigate(callback) {
    this.onNavigate = callback;
  }
}

// Create singleton instance
export const router = new Router();

// Helper function to create links
export function createLink(path, text, className = '') {
  const link = document.createElement('a');
  link.href = `#${path}`;
  link.textContent = text;
  if (className) link.className = className;
  return link;
}

// Helper to get query params from hash
export function getQueryParams() {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');

  if (queryIndex === -1) return {};

  const queryString = hash.slice(queryIndex + 1);
  const params = {};

  for (const pair of queryString.split('&')) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }

  return params;
}

// Helper to build path with query params
export function buildPath(path, params = {}) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `${path}?${query}` : path;
}

export default router;
