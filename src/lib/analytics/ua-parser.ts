// User-Agent parser utility
// Extracts browser, OS, device info from UA string

interface UAInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  deviceModel: string;
  isBot: boolean;
  botName: string | null;
}

// Comprehensive bot/crawler/spider UA patterns
const BOT_PATTERNS: { pattern: RegExp; name: string }[] = [
  // Major search engine bots
  { pattern: /Googlebot/i, name: 'Googlebot' },
  { pattern: /Google-InspectionTool/i, name: 'Google Inspection' },
  { pattern: /Google-Site-Verification/i, name: 'Google Verify' },
  { pattern: /bingbot/i, name: 'Bingbot' },
  { pattern: /Slurp/i, name: 'Yahoo Slurp' },
  { pattern: /DuckDuckBot/i, name: 'DuckDuckBot' },
  { pattern: /Baiduspider/i, name: 'Baiduspider' },
  { pattern: /YandexBot/i, name: 'YandexBot' },
  { pattern: /YandexMetrika/i, name: 'Yandex Metrika' },

  // SEO & monitoring tools
  { pattern: /AhrefsBot/i, name: 'Ahrefs' },
  { pattern: /SemrushBot/i, name: 'Semrush' },
  { pattern: /MJ12bot/i, name: 'Majestic' },
  { pattern: /DotBot/i, name: 'Moz' },
  { pattern: /rogerbot/i, name: 'Moz Roger' },
  { pattern: /SeznamBot/i, name: 'Seznam' },
  { pattern: /Sogou/i, name: 'Sogou' },
  { pattern: /Exabot/i, name: 'Exalead' },
  { pattern: /SEOkicks/i, name: 'SEOkicks' },
  { pattern: /Screaming Frog/i, name: 'Screaming Frog' },

  // Social media crawlers
  { pattern: /facebookexternalhit/i, name: 'Facebook Crawler' },
  { pattern: /Facebot/i, name: 'Facebot' },
  { pattern: /Twitterbot/i, name: 'Twitterbot' },
  { pattern: /LinkedInBot/i, name: 'LinkedIn Bot' },
  { pattern: /Pinterest/i, name: 'Pinterest Bot' },
  { pattern: /Slackbot/i, name: 'Slackbot' },
  { pattern: /Discordbot/i, name: 'Discord Bot' },
  { pattern: /TelegramBot/i, name: 'Telegram Bot' },
  { pattern: /WhatsApp/i, name: 'WhatsApp Link Preview' },
  { pattern: /SkypeUriPreview/i, name: 'Skype Preview' },
  { pattern: /Viber/i, name: 'Viber Preview' },

  // AI crawlers
  { pattern: /GPTBot/i, name: 'OpenAI GPTBot' },
  { pattern: /ChatGPT-User/i, name: 'ChatGPT' },
  { pattern: /CCBot/i, name: 'Common Crawl' },
  { pattern: /ClaudeBot/i, name: 'Claude Bot' },
  { pattern: /Anthropic-AI/i, name: 'Anthropic AI' },
  { pattern: /PerplexityBot/i, name: 'Perplexity' },
  { pattern: /Applebot-Extended/i, name: 'Apple AI' },
  { pattern: /Bytespider/i, name: 'ByteDance Spider' },
  { pattern: /cohere-ai/i, name: 'Cohere AI' },
  { pattern: /Diffbot/i, name: 'Diffbot' },

  // Generic bot patterns
  { pattern: /bot\//i, name: 'Generic Bot' },
  { pattern: /bot$/i, name: 'Generic Bot' },
  { pattern: /spider/i, name: 'Generic Spider' },
  { pattern: /crawler/i, name: 'Generic Crawler' },
  { pattern: /scraper/i, name: 'Generic Scraper' },
  { pattern: /fetcher/i, name: 'Generic Fetcher' },
  { pattern: /preview/i, name: 'Link Preview' },

  // Headless browsers & automation tools
  { pattern: /HeadlessChrome/i, name: 'Headless Chrome' },
  { pattern: /PhantomJS/i, name: 'PhantomJS' },
  { pattern: /Selenium/i, name: 'Selenium' },
  { pattern: /Puppeteer/i, name: 'Puppeteer' },
  { pattern: /Playwright/i, name: 'Playwright' },
  { pattern: /wkhtmlto/i, name: 'wkhtmltopdf' },

  // Monitoring & uptime tools
  { pattern: /UptimeRobot/i, name: 'UptimeRobot' },
  { pattern: /Pingdom/i, name: 'Pingdom' },
  { pattern: /NewRelicPinger/i, name: 'New Relic' },
  { pattern: /StatusCake/i, name: 'StatusCake' },
  { pattern: /Jetpack/i, name: 'Jetpack Monitor' },
  { pattern: /Site24x7/i, name: 'Site24x7' },
  { pattern: /Monitority/i, name: 'Monitority' },

  // Feed readers
  { pattern: /Feedfetcher/i, name: 'Feed Fetcher' },
  { pattern: /RSS/i, name: 'RSS Reader' },

  // Misc bots
  { pattern: /curl/i, name: 'curl' },
  { pattern: /wget/i, name: 'wget' },
  { pattern: /python-requests/i, name: 'Python Requests' },
  { pattern: /python-urllib/i, name: 'Python urllib' },
  { pattern: /node-fetch/i, name: 'Node Fetch' },
  { pattern: /axios/i, name: 'Axios' },
  { pattern: /http.rb/i, name: 'Ruby HTTP' },
  { pattern: /Go-http-client/i, name: 'Go HTTP Client' },
  { pattern: /Java\//i, name: 'Java HTTP' },
];

/**
 * Detect if a User-Agent belongs to a bot/crawler/scraper.
 * Returns { isBot, botName } — botName is null if not a bot.
 */
export function detectBot(ua: string): { isBot: boolean; botName: string | null } {
  if (!ua) return { isBot: true, botName: 'empty-ua' };

  // Empty or very short UA strings are suspicious
  if (ua.length < 10) return { isBot: true, botName: 'short-ua' };

  for (const { pattern, name } of BOT_PATTERNS) {
    if (pattern.test(ua)) {
      return { isBot: true, botName: name };
    }
  }

  return { isBot: false, botName: null };
}

export function parseUserAgent(ua: string): UAInfo {
  const botInfo = detectBot(ua);
  const result: UAInfo = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    deviceType: 'desktop',
    deviceModel: '',
    isBot: botInfo.isBot,
    botName: botInfo.botName,
  };

  // If it's a bot, skip detailed parsing
  if (botInfo.isBot) {
    result.browser = botInfo.botName || 'Bot';
    result.deviceType = 'bot';
    return result;
  }

  if (!ua) return result;

  // Parse OS
  if (/Windows NT (\d+[\.\d]*)/.test(ua)) {
    result.os = 'Windows';
    result.osVersion = RegExp.$1;
    const ver = parseFloat(RegExp.$1);
    if (ver === 10.0) result.osVersion = '10/11';
    else if (ver === 6.3) result.osVersion = '8.1';
    else if (ver === 6.2) result.osVersion = '8';
    else if (ver === 6.1) result.osVersion = '7';
  } else if (/Mac OS X (\d+[._]\d+[._]?\d*)/.test(ua)) {
    result.os = 'macOS';
    result.osVersion = RegExp.$1.replace(/_/g, '.');
  } else if (/Android (\d+[\.\d]*)/.test(ua)) {
    result.os = 'Android';
    result.osVersion = RegExp.$1;
    result.deviceType = 'mobile';
  } else if (/iPhone OS (\d+[_\d]*)/.test(ua)) {
    result.os = 'iOS';
    result.osVersion = RegExp.$1.replace(/_/g, '.');
    result.deviceType = 'mobile';
    result.deviceModel = 'iPhone';
  } else if (/iPad.*OS (\d+[_\d]*)/.test(ua)) {
    result.os = 'iOS';
    result.osVersion = RegExp.$1.replace(/_/g, '.');
    result.deviceType = 'tablet';
    result.deviceModel = 'iPad';
  } else if (/Linux/.test(ua)) {
    result.os = 'Linux';
  } else if (/CrOS/.test(ua)) {
    result.os = 'ChromeOS';
  }

  // Parse Browser
  if (/Edg\/(\d+[\.\d]*)/.test(ua)) {
    result.browser = 'Edge';
    result.browserVersion = RegExp.$1;
  } else if (/OPR\/(\d+[\.\d]*)/.test(ua)) {
    result.browser = 'Opera';
    result.browserVersion = RegExp.$1;
  } else if (/Firefox\/(\d+[\.\d]*)/.test(ua)) {
    result.browser = 'Firefox';
    result.browserVersion = RegExp.$1;
  } else if (/Chrome\/(\d+[\.\d]*)/.test(ua) && !/Chromium/.test(ua)) {
    result.browser = 'Chrome';
    result.browserVersion = RegExp.$1;
  } else if (/Safari\/(\d+[\.\d]*)/.test(ua) && !/Chrome/.test(ua)) {
    result.browser = 'Safari';
    result.browserVersion = RegExp.$1;
  }

  // Device type refinement
  if (/Mobile|Android.*Mobile/.test(ua) && result.deviceType === 'desktop') {
    result.deviceType = 'mobile';
  }
  if (/Tablet|iPad/.test(ua)) {
    result.deviceType = 'tablet';
  }

  return result;
}

// Classify traffic source from referrer
export function classifyTrafficSource(referrer: string, utmSource?: string): { source: string; name: string } {
  if (utmSource) {
    return { source: 'utm', name: utmSource };
  }

  if (!referrer) {
    return { source: 'direct', name: 'Direct' };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    // Search engines
    if (host.includes('google.')) return { source: 'search', name: 'Google' };
    if (host.includes('bing.')) return { source: 'search', name: 'Bing' };
    if (host.includes('yahoo.')) return { source: 'search', name: 'Yahoo' };
    if (host.includes('yandex.')) return { source: 'search', name: 'Yandex' };
    if (host.includes('duckduckgo.')) return { source: 'search', name: 'DuckDuckGo' };
    if (host.includes('baidu.')) return { source: 'search', name: 'Baidu' };

    // Social networks
    if (host.includes('twitter.') || host.includes('x.com')) return { source: 'social', name: 'X/Twitter' };
    if (host.includes('facebook.') || host.includes('fb.')) return { source: 'social', name: 'Facebook' };
    if (host.includes('linkedin.')) return { source: 'social', name: 'LinkedIn' };
    if (host.includes('reddit.')) return { source: 'social', name: 'Reddit' };
    if (host.includes('t.co')) return { source: 'social', name: 'X/Twitter' };
    if (host.includes('telegram.')) return { source: 'social', name: 'Telegram' };
    if (host.includes('instagram.')) return { source: 'social', name: 'Instagram' };
    if (host.includes('vk.')) return { source: 'social', name: 'VK' };

    // Developer platforms
    if (host.includes('github.')) return { source: 'referral', name: 'GitHub' };
    if (host.includes('stackoverflow.')) return { source: 'referral', name: 'StackOverflow' };
    if (host.includes('dev.to') || host.includes('dev.to')) return { source: 'referral', name: 'Dev.to' };
    if (host.includes('medium.')) return { source: 'referral', name: 'Medium' };
    if (host.includes('hashnode.')) return { source: 'referral', name: 'Hashnode' };

    // Same site = direct
    return { source: 'referral', name: host.replace('www.', '') };
  } catch {
    return { source: 'direct', name: 'Direct' };
  }
}

// Detect laptop by screen resolution heuristic
// Laptops typically have: 1366x768, 1536x864, 1440x900, 1280x800, 1600x900
// Desktops typically have: 1920x1080+, 2560x1440, 3840x2160
// MacBooks: 1440x900, 1680x1050, 2560x1600, 3024x1964
export function detectDeviceType(ua: string, screenRes?: string): string {
  // Mobile/tablet from UA — check FIRST (before screen heuristics)
  if (/iPhone|iPod/i.test(ua)) return 'mobile';
  if (/Android.*Mobile|Mobile.*Android/i.test(ua)) return 'mobile';
  if (/Mobile|Windows Phone/i.test(ua)) return 'mobile';
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  // Also detect mobile by screen size (portrait small screen)
  if (screenRes) {
    const m = screenRes.match(/(\d+)x(\d+)/);
    if (m) {
      const sw = parseInt(m[1]), sh = parseInt(m[2]);
      const minDim = Math.min(sw, sh), maxDim = Math.max(sw, sh);
      // Phone: shortest side < 500px (e.g. 390x844, 412x915)
      if (minDim < 500 && maxDim < 1200) return 'mobile';
      // Tablet: shortest side 600-1024 (768x1024 iPad, 800x1280 Android tab)
      // BUT: 768 height on Windows is a laptop, not a tablet — check UA for touch
      if (minDim >= 600 && minDim <= 1024 && maxDim <= 1366 && /iPad|Tablet|Android|Touch/i.test(ua)) return 'tablet';
    }
  }

  // Parse screen resolution
  if (screenRes) {
    const match = screenRes.match(/(\d+)x(\d+)/);
    if (match) {
      const w = parseInt(match[1]);
      const h = parseInt(match[2]);

      // MacBook detection (macOS + high-DPI small screen)
      if (/Mac OS X/.test(ua)) {
        // MacBooks have physical screens <= 16" with these resolutions
        // Mac Studio/Pro displays are 27"+ at 5120x2880 or 5K/6K
        if (h <= 1200 || w <= 1800) return 'laptop';
        if (w === 2560 && h === 1600) return 'laptop'; // MacBook Air M2/M3
        if (w === 3024 && h === 1964) return 'laptop'; // MacBook Pro 14"
        if (w === 3456 && h === 2234) return 'laptop'; // MacBook Pro 16"
        if (w === 5120 && h === 2880) return 'desktop'; // iMac/Pro Display XDR
        // Default macOS = laptop (most Macs are laptops)
        return 'laptop';
      }

      // Windows/Linux laptop heuristics
      // Common laptop resolutions (inner/available area)
      const laptopHeights = [720, 768, 800, 864, 900, 1024, 1080];
      const laptopWidths = [1280, 1360, 1366, 1440, 1536, 1600, 1680];

      // Height <= 900 is almost certainly a laptop (small screen)
      if (h <= 900) return 'laptop';

      // 1080p: could be either. Width helps distinguish.
      // Laptop 1080p: 1920x1080 with devicePixelRatio > 1 OR small width
      // But we don't have DPR on server. Use width as proxy:
      // Most laptops scale to 1536x864 or 1366x768 internally
      if (h === 1080 && laptopWidths.includes(w)) return 'laptop';

      // Large screens = desktop
      if (w >= 2560 && h >= 1440) return 'desktop';
      if (w >= 1920 && h > 1080) return 'desktop';
    }
  }

  // Fallback: no screen info, use UA defaults
  return 'desktop';
}

// Generate a fingerprint-based anonymous user ID
export function generateFingerprint(data: {
  userAgent?: string;
  screenRes?: string;
  language?: string;
  ip?: string;
  timezone?: string;
}): string {
  // Hash-based fingerprint from browser characteristics
  const str = `${data.userAgent || ''}|${data.screenRes || ''}|${data.language || ''}|${data.timezone || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}
