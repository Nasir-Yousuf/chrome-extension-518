/**
 * URL matching and domain utility functions for FocusGuard
 */

// Internal Chrome/Browser URLs that must never be blocked
const SYSTEM_PROTOCOLS = [
  'chrome:',
  'chrome-extension:',
  'edge:',
  'about:',
  'devtools:',
  'view-source:',
  'file:',
  'blob:',
  'data:'
];

export function isSystemUrl(url: string): boolean {
  if (!url) return true;
  return SYSTEM_PROTOCOLS.some(proto => url.toLowerCase().startsWith(proto));
}

/**
 * Normalizes input domain string (e.g. "https://www.github.com/path" -> "github.com")
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();

  // Strip protocol
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');

  // Strip query/path if raw domain entered, unless path pattern is intentional
  if (!cleaned.includes('/')) {
    cleaned = cleaned.replace(/:\d+$/, ''); // strip port for comparison if needed
  }
  return cleaned.replace(/\/$/, '');
}

/**
 * Checks if a candidate URL matches a domain pattern
 * Supports:
 * - exact domain (e.g. "github.com" matches "github.com/..." and "sub.github.com/...")
 * - wildcard subdomain (e.g. "*.notion.so")
 * - full path prefix (e.g. "docs.google.com/document")
 */
export function matchesDomainPattern(targetUrl: string, pattern: string): boolean {
  try {
    const urlObj = new URL(targetUrl);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    const cleanPattern = pattern.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

    // Pattern contains path (e.g., "docs.google.com/spreadsheets")
    if (cleanPattern.includes('/')) {
      const fullTarget = `${hostname}${urlObj.pathname}`.toLowerCase();
      return fullTarget.startsWith(cleanPattern);
    }

    // Pattern is wildcard (e.g. "*.example.com")
    if (cleanPattern.startsWith('*.')) {
      const rootDomain = cleanPattern.slice(2);
      return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
    }

    // Exact domain or subdomain match
    if (hostname === cleanPattern || hostname.endsWith(`.${cleanPattern}`)) {
      return true;
    }

    return false;
  } catch {
    // If URL object parsing fails, do a fallback string match
    const cleanTarget = targetUrl.toLowerCase();
    const cleanPattern = pattern.toLowerCase();
    return cleanTarget.includes(cleanPattern);
  }
}

/**
 * Determines if a given URL is allowed according to settings
 */
export function isUrlAllowed(
  url: string,
  mode: 'whitelist' | 'blacklist',
  allowedDomains: string[],
  blockedDomains: string[]
): boolean {
  if (isSystemUrl(url)) {
    return true;
  }

  // Whitelist mode: ONLY allowed domains are permitted
  if (mode === 'whitelist') {
    if (allowedDomains.length === 0) {
      return false; // nothing is allowed if whitelist is empty
    }
    return allowedDomains.some(domain => matchesDomainPattern(url, domain));
  }

  // Blacklist mode: Permitted unless in blockedDomains
  if (mode === 'blacklist') {
    return !blockedDomains.some(domain => matchesDomainPattern(url, domain));
  }

  return true;
}

/**
 * Identifies if the URL is a web search query (Google, Bing, DuckDuckGo, Yahoo, Ecosia, etc.)
 */
export function isSearchEngineQuery(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Google search
    if (host.includes('google.') && (path.startsWith('/search') || parsed.searchParams.has('q'))) {
      return true;
    }
    // Bing search
    if (host.includes('bing.com') && (path.startsWith('/search') || parsed.searchParams.has('q'))) {
      return true;
    }
    // DuckDuckGo search
    if (host.includes('duckduckgo.com') && parsed.searchParams.has('q')) {
      return true;
    }
    // Yahoo search
    if (host.includes('search.yahoo.com')) {
      return true;
    }
    // Ecosia search
    if (host.includes('ecosia.org') && path.startsWith('/search')) {
      return true;
    }
    // Brave search
    if (host.includes('search.brave.com') && path.startsWith('/search')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Formats a valid HTTP/HTTPS URL from user input
 */
export function formatValidUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return 'https://notion.so';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}
