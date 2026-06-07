// User-Agent parser utility
// Extracts browser, OS, device info from UA string

interface UAInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  deviceModel: string;
}

export function parseUserAgent(ua: string): UAInfo {
  const result: UAInfo = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    deviceType: 'desktop',
    deviceModel: '',
  };

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
  // Laptop detection (heuristic: Mac/Windows with no touch indication)
  if (result.deviceType === 'desktop' && (result.os === 'macOS' || result.os === 'Windows')) {
    // Can't reliably distinguish laptop from desktop in UA alone
    // Keep as desktop
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

// Generate a fingerprint-based anonymous user ID
export function generateFingerprint(data: {
  userAgent?: string;
  screenRes?: string;
  language?: string;
  ip?: string;
}): string {
  // Simple hash-based fingerprint
  const str = `${data.userAgent || ''}|${data.screenRes || ''}|${data.language || ''}|${data.ip || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}
