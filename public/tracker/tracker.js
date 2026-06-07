/**
 * ADMIN Panel Tracker v3.0
 * Embeddable tracking script for ADMIN Panel analytics
 * Features: enhanced bot detection, unique user identification,
 *           Canvas/WebGL fingerprint, behavioral signals
 *
 * Usage (same domain):
 * <script data-project-id="my-project" src="/tracker/tracker.js"></script>
 *
 * Usage (cross-domain, e.g. GitHub Pages → analytics server):
 * <script>
 *   window.AdminPanelTracker = {
 *     endpoint: 'https://your-analytics-server.com/api/track',
 *     projectId: 'my-project',
 *     projectName: 'My Project'
 *   };
 * </script>
 * <script src="https://your-analytics-server.com/tracker/tracker.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  var config = window.AdminPanelTracker || window.FolioTracker || {};
  var scriptEl = document.currentScript || document.querySelector('script[src*="tracker"]');

  // Determine API endpoint
  var API_ENDPOINT = config.endpoint ||
    (scriptEl && scriptEl.src ? scriptEl.src.replace(/\/tracker\/tracker\.js.*$/, '/api/track') : '/api/track');

  var SESSION_KEY = 'admin_panel_sid';
  var USER_KEY = 'admin_panel_uid';
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  var projectId = config.projectId ||
    (scriptEl && scriptEl.getAttribute('data-project-id')) ||
    window.location.hostname;
  var projectName = config.projectName ||
    (scriptEl && scriptEl.getAttribute('data-project-name')) ||
    document.title;

  // ============================================================
  // BOT DETECTION — enhanced client-side preliminary check
  // Server will also verify via UA parsing
  // ============================================================
  function detectBot() {
    var ua = navigator.userAgent;
    if (!ua || ua.length < 10) return { isBot: true, botName: 'empty-ua' };

    var botPatterns = [
      /Googlebot/i, /bingbot/i, /Slurp/i, /DuckDuckBot/i, /Baiduspider/i,
      /YandexBot/i, /YandexMetrika/i, /AhrefsBot/i, /SemrushBot/i,
      /MJ12bot/i, /DotBot/i, /rogerbot/i, /Screaming Frog/i,
      /facebookexternalhit/i, /Facebot/i, /Twitterbot/i, /LinkedInBot/i,
      /Pinterest/i, /Slackbot/i, /Discordbot/i, /TelegramBot/i,
      /WhatsApp/i, /SkypeUriPreview/i,
      /GPTBot/i, /ChatGPT-User/i, /CCBot/i, /ClaudeBot/i, /Anthropic-AI/i,
      /PerplexityBot/i, /Bytespider/i, /cohere-ai/i, /Diffbot/i,
      /Applebot-Extended/i, /Bytespider/i,
      /HeadlessChrome/i, /PhantomJS/i, /Selenium/i, /Puppeteer/i, /Playwright/i,
      /wkhtmlto/i,
      /UptimeRobot/i, /Pingdom/i, /NewRelicPinger/i, /StatusCake/i,
      /Jetpack/i, /Site24x7/i, /Monitority/i,
      /curl/i, /wget/i, /python-requests/i, /python-urllib/i,
      /node-fetch/i, /axios/i, /Go-http-client/i, /Java\//i, /http.rb/i,
      /bot\//i, /bot$/i, /spider/i, /crawler/i, /scraper/i, /fetcher/i,
      /Feedfetcher/i, /RSS/i
    ];
    for (var i = 0; i < botPatterns.length; i++) {
      if (botPatterns[i].test(ua)) {
        var match = ua.match(botPatterns[i]);
        return { isBot: true, botName: match ? match[0] : 'Bot' };
      }
    }

    // Advanced bot signals — check automation indicators
    var automationSignals = 0;

    // navigator.webdriver = true means controlled by automation
    try {
      if (navigator.webdriver === true) automationSignals++;
    } catch(e) {}

    // Missing standard browser APIs that bots usually don't have
    try {
      if (!window.requestAnimationFrame) automationSignals++;
    } catch(e) { automationSignals++; }

    try {
      if (!window.IntersectionObserver) automationSignals++;
    } catch(e) { automationSignals++; }

    // PhantomJS-specific
    try {
      if (window._phantom || window.__phantomas) {
        return { isBot: true, botName: 'PhantomJS' };
      }
    } catch(e) {}

    // NightmareJS-specific
    try {
      if (window.__nightmare) {
        return { isBot: true, botName: 'NightmareJS' };
      }
    } catch(e) {}

    // Cesium-specific (puppeteer-extra-stealth sometimes leaves traces)
    try {
      if (window.callPhantom || window._selenium || window.__selenium_unwrapped) {
        return { isBot: true, botName: 'Automation' };
      }
    } catch(e) {}

    // Too many automation signals = likely bot
    if (automationSignals >= 2) {
      return { isBot: true, botName: 'automation-detected' };
    }

    return { isBot: false, botName: null };
  }

  var botInfo = detectBot();

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================
  function getSessionId() {
    try {
      var stored = localStorage.getItem(SESSION_KEY);
      var storedTime = localStorage.getItem(SESSION_KEY + '_t');
      if (stored && storedTime && (Date.now() - parseInt(storedTime)) < SESSION_TIMEOUT) {
        localStorage.setItem(SESSION_KEY + '_t', String(Date.now()));
        return stored;
      }
    } catch(e) {}
    var newId = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    try {
      localStorage.setItem(SESSION_KEY, newId);
      localStorage.setItem(SESSION_KEY + '_t', String(Date.now()));
    } catch(e) {}
    return newId;
  }

  // ============================================================
  // ENHANCED FINGERPRINT — Canvas + WebGL + Audio + standard
  // Much more unique than simple UA+screen hash
  // ============================================================
  function getFingerprint() {
    try {
      var parts = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        (navigator.hardwareConcurrency || 0).toString(),
        (navigator.deviceMemory || 0).toString(),
        screen.colorDepth.toString(),
        new Date().getTimezoneOffset().toString(),
        (navigator.plugins ? navigator.plugins.length : 0).toString(),
        navigator.platform || '',
        (navigator.maxTouchPoints || 0).toString()
      ];

      // Canvas fingerprint — draws text and reads pixel data
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        var ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(50, 0, 100, 50);
          ctx.fillStyle = '#069';
          ctx.fillText('ADMINfp', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('ADMINfp', 4, 17);
          parts.push(canvas.toDataURL().slice(-50));
        }
      } catch(e) {}

      // WebGL fingerprint — renderer info
      try {
        var glCanvas = document.createElement('canvas');
        var gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        if (gl) {
          var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            parts.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
            parts.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
          }
        }
      } catch(e) {}

      var str = parts.join('|');
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'fp_' + Math.abs(hash).toString(36);
    } catch(e) {
      return '';
    }
  }

  // ============================================================
  // USER ID — persistent unique identifier
  // Priority: localStorage userId > fingerprint-based recovery
  // ============================================================
  function getUserId() {
    try {
      var stored = localStorage.getItem(USER_KEY);
      if (stored) return stored;
    } catch(e) {}
    var id = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    try { localStorage.setItem(USER_KEY, id); } catch(e) {}
    return id;
  }

  // ============================================================
  // DEVICE DETECTION — laptop vs desktop vs mobile vs tablet
  // Enhanced with more accurate laptop detection
  // ============================================================
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) return 'mobile';

    var w = screen.width;
    var h = screen.height;
    var dpr = window.devicePixelRatio || 1;

    // macOS = most likely laptop
    if (/Mac OS X/.test(ua)) {
      // Known desktop Mac resolutions
      if (w === 5120 && h === 2880) return 'desktop'; // iMac 5K
      if (w === 6016 && h === 3384) return 'desktop'; // Pro Display XDR
      // MacBook common physical resolutions (before DPR scaling)
      if (w === 2560 && h === 1600) return 'laptop';  // MacBook Air M2/M3
      if (w === 3024 && h === 1964) return 'laptop';  // MacBook Pro 14"
      if (w === 3456 && h === 2234) return 'laptop';  // MacBook Pro 16"
      if (w === 1440 && h === 900) return 'laptop';   // MacBook Air 13"
      if (w === 1680 && h === 1050) return 'laptop';  // MacBook Pro 15"
      // macOS with DPR > 1 and screen width <= 1800 = laptop
      if (dpr > 1 && w <= 1800) return 'laptop';
      // Default macOS = laptop (most Macs are laptops)
      return 'laptop';
    }

    // Windows/Linux — check if touch is primary input
    var isTouchPrimary = false;
    try {
      isTouchPrimary = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
    } catch(e) {}

    // If touch is primary on a device with large screen = tablet
    if (isTouchPrimary && w >= 600 && h >= 600) return 'tablet';

    // Laptop heuristics based on screen resolution
    if (h <= 900) return 'laptop';
    if (h === 1080) {
      var laptopWidths = [1280, 1360, 1366, 1440, 1536, 1600, 1680];
      if (laptopWidths.indexOf(w) !== -1) return 'laptop';
      // 1920x1080 with DPR > 1 is likely a laptop with scaling
      if (dpr > 1 && w === 1920) return 'laptop';
    }

    return 'desktop';
  }

  function getScreenRes() {
    return screen.width + 'x' + screen.height;
  }

  // ============================================================
  // BEHAVIORAL SIGNALS — collect human-like interaction data
  // Helps server distinguish human from bot more accurately
  // ============================================================
  var behaviorData = {
    mouseMoves: 0,
    keyPresses: 0,
    touchEvents: 0,
    scrollEvents: 0,
    clickEvents: 0,
    interactionScore: 0 // 0-5 scale
  };

  function updateBehaviorScore() {
    var score = 0;
    if (behaviorData.mouseMoves > 5) score++;
    if (behaviorData.keyPresses > 0) score++;
    if (behaviorData.touchEvents > 0) score++;
    if (behaviorData.scrollEvents > 2) score++;
    if (behaviorData.clickEvents > 1) score++;
    behaviorData.interactionScore = score;
  }

  // Track mouse movements (lightweight)
  var mouseMoveThrottle = 0;
  document.addEventListener('mousemove', function() {
    var now = Date.now();
    if (now - mouseMoveThrottle < 2000) return; // Throttle: count every 2s
    mouseMoveThrottle = now;
    behaviorData.mouseMoves++;
    updateBehaviorScore();
  }, { passive: true });

  document.addEventListener('keydown', function() {
    behaviorData.keyPresses++;
    updateBehaviorScore();
  }, { passive: true });

  document.addEventListener('touchstart', function() {
    behaviorData.touchEvents++;
    updateBehaviorScore();
  }, { passive: true });

  document.addEventListener('scroll', function() {
    behaviorData.scrollEvents++;
    updateBehaviorScore();
  }, { passive: true });

  // ============================================================
  // UTM PARSING
  // ============================================================
  function getUTMParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      return {
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmContent: params.get('utm_content'),
        utmTerm: params.get('utm_term'),
      };
    } catch(e) {
      return {};
    }
  }

  // ============================================================
  // GEO DETECTION
  // ============================================================
  var geoCache = null;
  function getGeo() {
    return new Promise(function(resolve) {
      if (geoCache) { resolve(geoCache); return; }
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://ipapi.co/json/', true);
        xhr.timeout = 3000;
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              geoCache = {
                country: data.country_name,
                countryCode: data.country_code,
                city: data.city,
                region: data.region,
              };
            } catch(e) { geoCache = {}; }
          } else { geoCache = {}; }
          resolve(geoCache);
        };
        xhr.onerror = function() { geoCache = {}; resolve(geoCache); };
        xhr.ontimeout = function() { geoCache = {}; resolve(geoCache); };
        xhr.send();
      } catch(e) { geoCache = {}; resolve(geoCache); }
    });
  }

  // ============================================================
  // CORE TRACKING FUNCTION
  // ============================================================
  function track(eventType, eventData) {
    var sessionId = getSessionId();
    var userId = getUserId();
    var utm = getUTMParams();

    var payload = Object.assign({
      eventType: eventType,
      sessionId: sessionId,
      userId: userId,
      fingerprint: getFingerprint(),
      page: window.location.pathname + window.location.search,
      pageTitle: document.title,
      referrer: document.referrer,
      projectId: projectId,
      projectName: projectName,
      projectUrl: window.location.origin,
      deviceType: botInfo.isBot ? 'bot' : getDeviceType(),
      screenRes: getScreenRes(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      isBot: botInfo.isBot,
      botName: botInfo.botName,
      // Behavioral signals for human verification
      behavior: {
        mouse: behaviorData.mouseMoves,
        keys: behaviorData.keyPresses,
        touch: behaviorData.touchEvents,
        scroll: behaviorData.scrollEvents,
        clicks: behaviorData.clickEvents,
        score: behaviorData.interactionScore
      },
      // Platform details for better identification
      platform: navigator.platform || '',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
    }, utm, eventData || {});

    if (geoCache) {
      payload.country = geoCache.country;
      payload.countryCode = geoCache.countryCode;
      payload.city = geoCache.city;
      payload.region = geoCache.region;
    }

    var data = JSON.stringify(payload);

    // fetch with keepalive (supports CORS, works on page unload)
    try {
      if (typeof fetch === 'function') {
        fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
          mode: 'cors',
          credentials: 'omit',
        }).catch(function() {
          sendViaXHR(data);
        });
        return;
      }
    } catch(e) {}

    sendViaXHR(data);
  }

  function sendViaXHR(data) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.withCredentials = false;
      xhr.send(data);
    } catch(e) {}
  }

  // ============================================================
  // BEHAVIOR TRACKING
  // ============================================================

  // Click tracking
  document.addEventListener('click', function(e) {
    behaviorData.clickEvents++;
    updateBehaviorScore();

    var target = e.target.closest ? e.target.closest('a') || e.target : e.target;

    if (target.tagName === 'A' && target.href) {
      var isExternal = target.hostname !== window.location.hostname;
      if (isExternal) {
        track('external_link_click', {
          eventName: 'external_link_click',
          metadata: { url: target.href, text: (target.textContent || '').slice(0, 50) },
        });
      }
      if (target.href.includes('demo') || (target.textContent && target.textContent.toLowerCase().includes('demo'))) {
        track('demo_open');
      }
    }
  }, true);

  // Scroll depth tracking
  var maxScrollDepth = 0;
  var scrollTimeout;
  window.addEventListener('scroll', function() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    if (pct > maxScrollDepth) maxScrollDepth = pct;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      if (maxScrollDepth > 0) {
        track('scroll', { value: maxScrollDepth, eventName: 'scroll_depth' });
        maxScrollDepth = 0;
      }
    }, 2000);
  });

  // Visibility change tracking (time on page)
  var pageVisibleStart = Date.now();
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      var dur = Math.round((Date.now() - pageVisibleStart) / 1000);
      if (dur > 0) track('page_hide', { value: dur, eventName: 'time_on_page' });
    } else {
      pageVisibleStart = Date.now();
    }
  });

  window.addEventListener('beforeunload', function() {
    var dur = Math.round((Date.now() - pageVisibleStart) / 1000);
    if (dur > 0) track('page_hide', { value: dur, eventName: 'time_on_page' });
  });

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.AdminAnalytics = {
    track: track,
    trackEvent: function(name, data) {
      track('custom', Object.assign({ eventName: name }, data));
    },
    trackProjectView: function() { track('project_view'); },
    trackDemoOpen: function() { track('demo_open'); },
    trackContactOpen: function() { track('contact_open'); },
    trackContactFormOpen: function() { track('contact_form_open'); },
    trackFormSubmit: function() { track('form_submit'); },
    // Get current user ID (for debugging)
    getUserId: getUserId,
    // Get current fingerprint (for debugging)
    getFingerprint: getFingerprint,
  };
  window.FolioAnalytics = window.AdminAnalytics;

  // ============================================================
  // INIT
  // ============================================================
  getGeo().then(function() {
    track('page_view');
  });

  // SPA navigation tracking
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    setTimeout(function() { track('page_view'); }, 100);
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    setTimeout(function() { track('page_view'); }, 100);
  };
  window.addEventListener('popstate', function() {
    setTimeout(function() { track('page_view'); }, 100);
  });

})();
