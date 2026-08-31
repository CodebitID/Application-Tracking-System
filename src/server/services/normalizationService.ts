/**
 * Normalization Service
 * Provides standardized normalization routines for company names, job titles, URLs, and source platforms.
 */

/**
 * Normalizes company names by:
 * - Lowercasing and trimming
 * - Stripping standard legal entity suffixes (Inc, LLC, Ltd, Corp, GmbH, Co, PLC, etc.)
 * - Removing special punctuation and consolidating whitespace
 */
export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|gmbh|co|company|ag|pty|plc|sa|srl|bv)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes job titles by:
 * - Lowercasing and trimming
 * - Standardizing common abbreviations (sr -> senior, jr -> junior, dev -> developer, eng -> engineer, swe -> software engineer)
 * - Standardizing compound technical titles (fullstack -> full stack, frontend -> front end, backend -> back end)
 * - Removing non-alphanumeric punctuation and consolidating whitespace
 */
export function normalizeJobTitle(title: string | null | undefined): string {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\bsr\.?\b/g, 'senior')
    .replace(/\bjr\.?\b/g, 'junior')
    .replace(/\bdev\b/g, 'developer')
    .replace(/\beng\b/g, 'engineer')
    .replace(/\bswe\b/g, 'software engineer')
    .replace(/\bmgr\b/g, 'manager')
    .replace(/\bdir\b/g, 'director')
    .replace(/\bvp\b/g, 'vice president')
    .replace(/\bfull-stack\b|\bfullstack\b/g, 'full stack')
    .replace(/\bfront-end\b|\bfrontend\b/g, 'front end')
    .replace(/\bback-end\b|\bbackend\b/g, 'back end')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes job URLs by:
 * - Parsing URL components
 * - Stripping hash fragments (#)
 * - Stripping marketing, UTM, tracking, and telemetry query parameters
 * - Preserving essential path routing and unique item IDs
 * - Lowercasing hostname and removing trailing slashes
 */
export function normalizeJobUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    parsed.hash = ''; // Remove hash fragments

    const trackingParams = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'utm_id',
      'ref',
      'ref_id',
      'source',
      'gh_src',
      'fbclid',
      'gclid',
      'msclkid',
      'ttclid',
      'twclid',
      '_ga',
      '_gl',
      'mc_cid',
      'mc_eid',
      'trk',
      'trackingid',
      'spm',
      'igshid',
      's_kwcid',
      'ad_id',
      'campaign_id',
      'si',
    ]);

    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (trackingParams.has(lowerKey) || lowerKey.startsWith('utm_') || lowerKey.startsWith('fbp_')) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach((key) => parsed.searchParams.delete(key));

    let cleanUrl = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
    // Remove trailing slash if path is longer than root
    if (cleanUrl.endsWith('/') && cleanUrl.length > 8 && parsed.pathname !== '/') {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    const searchString = parsed.searchParams.toString();
    if (searchString) {
      cleanUrl += `?${searchString}`;
    }
    return cleanUrl;
  } catch {
    // If not a valid standard URL string, return lowercase trimmed version without trailing slash
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Normalizes source platform names into canonical alphanumeric tokens.
 */
export function normalizeSourcePlatform(source: string | null | undefined): string {
  if (!source || typeof source !== 'string') return 'generic';
  const clean = source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  return clean || 'generic';
}
