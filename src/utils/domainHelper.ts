/**
 * Domain & Source Platform Extraction Utility
 */

export interface PlatformInfo {
  domain: string;
  platformName: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  isRecognized: boolean;
}

/**
 * Automatically detects the job source platform name from any standard job URL
 * e.g., 'https://www.linkedin.com/jobs/view/...' -> 'LinkedIn'
 * e.g., 'https://boards.greenhouse.io/stripe/jobs/...' -> 'Greenhouse'
 */
export function detectSourcePlatformFromUrl(url?: string): string | null {
  const info = extractDomainAndPlatform(url);
  return info ? info.platformName : null;
}

/**
 * Extracts clean domain and identifies common job platforms
 */
export function extractDomainAndPlatform(url?: string): PlatformInfo | null {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  try {
    const parsed = new URL(cleanUrl);
    let hostname = parsed.hostname.toLowerCase();
    
    // Remove leading 'www.'
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // 1. LinkedIn
    if (hostname.includes('linkedin.com') || hostname === 'lnkd.in') {
      return {
        domain: hostname,
        platformName: 'LinkedIn',
        badgeStyle: {
          bg: 'bg-blue-600/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          dot: 'bg-blue-500',
        },
        isRecognized: true,
      };
    }

    // 2. Indeed
    if (hostname.includes('indeed.')) {
      return {
        domain: hostname,
        platformName: 'Indeed',
        badgeStyle: {
          bg: 'bg-indigo-600/10',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30',
          dot: 'bg-indigo-500',
        },
        isRecognized: true,
      };
    }

    // 3. Glassdoor
    if (hostname.includes('glassdoor.')) {
      return {
        domain: hostname,
        platformName: 'Glassdoor',
        badgeStyle: {
          bg: 'bg-teal-600/10',
          text: 'text-teal-400',
          border: 'border-teal-500/30',
          dot: 'bg-teal-500',
        },
        isRecognized: true,
      };
    }

    // 4. Greenhouse
    if (hostname.includes('greenhouse.io')) {
      return {
        domain: hostname,
        platformName: 'Greenhouse',
        badgeStyle: {
          bg: 'bg-emerald-600/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
        },
        isRecognized: true,
      };
    }

    // 5. Lever
    if (hostname.includes('lever.co')) {
      return {
        domain: hostname,
        platformName: 'Lever',
        badgeStyle: {
          bg: 'bg-amber-600/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
        },
        isRecognized: true,
      };
    }

    // 6. Workday
    if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) {
      return {
        domain: hostname,
        platformName: 'Workday',
        badgeStyle: {
          bg: 'bg-orange-600/10',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          dot: 'bg-orange-500',
        },
        isRecognized: true,
      };
    }

    // 7. Ashby
    if (hostname.includes('ashbyhq.com')) {
      return {
        domain: hostname,
        platformName: 'Ashby',
        badgeStyle: {
          bg: 'bg-purple-600/10',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          dot: 'bg-purple-500',
        },
        isRecognized: true,
      };
    }

    // 8. SmartRecruiters
    if (hostname.includes('smartrecruiters.com')) {
      return {
        domain: hostname,
        platformName: 'SmartRecruiters',
        badgeStyle: {
          bg: 'bg-cyan-600/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          dot: 'bg-cyan-500',
        },
        isRecognized: true,
      };
    }

    // 9. ZipRecruiter
    if (hostname.includes('ziprecruiter.com')) {
      return {
        domain: hostname,
        platformName: 'ZipRecruiter',
        badgeStyle: {
          bg: 'bg-emerald-600/10',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-400',
        },
        isRecognized: true,
      };
    }

    // 10. Wellfound / AngelList
    if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) {
      return {
        domain: hostname,
        platformName: 'Wellfound',
        badgeStyle: {
          bg: 'bg-rose-600/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          dot: 'bg-rose-500',
        },
        isRecognized: true,
      };
    }

    // 11. Y Combinator / Work at a Startup
    if (hostname.includes('workatastartup.com') || (hostname.includes('ycombinator.com') && parsed.pathname.includes('/jobs'))) {
      return {
        domain: hostname,
        platformName: 'Y Combinator',
        badgeStyle: {
          bg: 'bg-orange-600/10',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          dot: 'bg-orange-500',
        },
        isRecognized: true,
      };
    }

    // 12. Handshake
    if (hostname.includes('joinhandshake.com') || hostname.includes('handshake.com')) {
      return {
        domain: hostname,
        platformName: 'Handshake',
        badgeStyle: {
          bg: 'bg-red-600/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          dot: 'bg-red-500',
        },
        isRecognized: true,
      };
    }

    // 13. Dice
    if (hostname.includes('dice.com')) {
      return {
        domain: hostname,
        platformName: 'Dice',
        badgeStyle: {
          bg: 'bg-red-600/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          dot: 'bg-red-500',
        },
        isRecognized: true,
      };
    }

    // 14. SimplyHired
    if (hostname.includes('simplyhired.com')) {
      return {
        domain: hostname,
        platformName: 'SimplyHired',
        badgeStyle: {
          bg: 'bg-sky-600/10',
          text: 'text-sky-400',
          border: 'border-sky-500/30',
          dot: 'bg-sky-500',
        },
        isRecognized: true,
      };
    }

    // 15. Monster
    if (hostname.includes('monster.com')) {
      return {
        domain: hostname,
        platformName: 'Monster',
        badgeStyle: {
          bg: 'bg-violet-600/10',
          text: 'text-violet-400',
          border: 'border-violet-500/30',
          dot: 'bg-violet-500',
        },
        isRecognized: true,
      };
    }

    // 16. CareerBuilder
    if (hostname.includes('careerbuilder.com')) {
      return {
        domain: hostname,
        platformName: 'CareerBuilder',
        badgeStyle: {
          bg: 'bg-blue-600/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          dot: 'bg-blue-500',
        },
        isRecognized: true,
      };
    }

    // 17. RemoteOK
    if (hostname.includes('remoteok.com') || hostname.includes('remoteok.io')) {
      return {
        domain: hostname,
        platformName: 'RemoteOK',
        badgeStyle: {
          bg: 'bg-red-600/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          dot: 'bg-red-500',
        },
        isRecognized: true,
      };
    }

    // 18. We Work Remotely
    if (hostname.includes('weworkremotely.com')) {
      return {
        domain: hostname,
        platformName: 'We Work Remotely',
        badgeStyle: {
          bg: 'bg-amber-600/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
        },
        isRecognized: true,
      };
    }

    // 19. BuiltIn
    if (hostname.includes('builtin')) {
      return {
        domain: hostname,
        platformName: 'BuiltIn',
        badgeStyle: {
          bg: 'bg-indigo-600/10',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30',
          dot: 'bg-indigo-500',
        },
        isRecognized: true,
      };
    }

    // 20. Welcome to the Jungle / Otta
    if (hostname.includes('welcometothejungle.com') || hostname.includes('otta.com')) {
      return {
        domain: hostname,
        platformName: 'Welcome to the Jungle',
        badgeStyle: {
          bg: 'bg-yellow-600/10',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          dot: 'bg-yellow-500',
        },
        isRecognized: true,
      };
    }

    // 21. Jobvite
    if (hostname.includes('jobvite.com')) {
      return {
        domain: hostname,
        platformName: 'Jobvite',
        badgeStyle: {
          bg: 'bg-blue-600/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          dot: 'bg-blue-500',
        },
        isRecognized: true,
      };
    }

    // 22. BambooHR
    if (hostname.includes('bamboohr.com')) {
      return {
        domain: hostname,
        platformName: 'BambooHR',
        badgeStyle: {
          bg: 'bg-emerald-600/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
        },
        isRecognized: true,
      };
    }

    // 23. Breezy HR
    if (hostname.includes('breezy.hr')) {
      return {
        domain: hostname,
        platformName: 'Breezy HR',
        badgeStyle: {
          bg: 'bg-cyan-600/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          dot: 'bg-cyan-500',
        },
        isRecognized: true,
      };
    }

    // 24. Rippling
    if (hostname.includes('rippling.com')) {
      return {
        domain: hostname,
        platformName: 'Rippling',
        badgeStyle: {
          bg: 'bg-amber-600/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
        },
        isRecognized: true,
      };
    }

    // 25. GitHub Jobs
    if (hostname.includes('github.com')) {
      return {
        domain: hostname,
        platformName: 'GitHub Jobs',
        badgeStyle: {
          bg: 'bg-slate-600/10',
          text: 'text-slate-300',
          border: 'border-slate-500/30',
          dot: 'bg-slate-400',
        },
        isRecognized: true,
      };
    }

    // 26. Company specific career sites
    if (hostname.includes('google.com') || hostname === 'careers.google.com') {
      return {
        domain: hostname,
        platformName: 'Google Careers',
        badgeStyle: {
          bg: 'bg-blue-600/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          dot: 'bg-blue-500',
        },
        isRecognized: true,
      };
    }

    if (hostname.includes('microsoft.com') || hostname === 'careers.microsoft.com') {
      return {
        domain: hostname,
        platformName: 'Microsoft Careers',
        badgeStyle: {
          bg: 'bg-cyan-600/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          dot: 'bg-cyan-500',
        },
        isRecognized: true,
      };
    }

    if (hostname.includes('apple.com') || hostname === 'jobs.apple.com') {
      return {
        domain: hostname,
        platformName: 'Apple Jobs',
        badgeStyle: {
          bg: 'bg-slate-600/10',
          text: 'text-slate-300',
          border: 'border-slate-500/30',
          dot: 'bg-slate-400',
        },
        isRecognized: true,
      };
    }

    if (hostname.includes('amazon.jobs') || (hostname.includes('amazon.com') && parsed.pathname.includes('job'))) {
      return {
        domain: hostname,
        platformName: 'Amazon Jobs',
        badgeStyle: {
          bg: 'bg-amber-600/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
        },
        isRecognized: true,
      };
    }

    // Default: Clean Domain Name
    let displayName = hostname;
    if (hostname.startsWith('careers.') || hostname.startsWith('jobs.')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const company = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        displayName = `${company} Careers`;
      }
    } else {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const main = parts[parts.length - 2];
        displayName = main.charAt(0).toUpperCase() + main.slice(1);
      }
    }

    return {
      domain: hostname,
      platformName: displayName,
      badgeStyle: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-300',
        border: 'border-indigo-500/20',
        dot: 'bg-indigo-400',
      },
      isRecognized: false,
    };
  } catch (err) {
    return null;
  }
}

