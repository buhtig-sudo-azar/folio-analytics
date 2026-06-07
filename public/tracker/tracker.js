/**
 * ADMIN Panel Tracker v2.0
 * Embeddable tracking script for ADMIN Panel analytics
 * Features: bot detection, unique user identification, fingerprint
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
  // BOT DETECTION — client-side preliminary check
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
      /HeadlessChrome/i, /PhantomJS/i, /Selenium/i, /Puppeteer/i, /Playwright/i,
      /UptimeRobot/i, /Pingdom/i, /NewRelicPinger/i, /StatusCake/i,
      /curl/i, /wget/i, /python-requests/i, /python-urllib/i,
      /node-fetch/i, /axios/i, /Go-http-client/i, /Java\//i,
      /bot\//i, /spider/i, /crawler/i, /scraper/i
    ];
    for (var i = 0; i < botPatterns.length; i++) {
      if (botPatterns[i].test(ua)) {
        var match = ua.match(botPatterns[i]);
        return { isBot: true, botName: match ? match[0] : 'Bot' };
      }
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
  // FINGERPRINT — unique browser signature
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
        new Date().getTimezoneOffset().toString()
      ];
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
  // ============================================================
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) return 'mobile';

    var w = screen.width;
    var h = screen.height;

    // macOS = most likely laptop
    if (/Mac OS X/.test(ua)) {
      if (w === 5120 && h === 2880) return 'desktop';
      if (w === 6016 && h === 3384) return 'desktop';
      return 'laptop';
    }

    // Windows/Linux
    if (h <= 900) return 'laptop';
    if (h === 1080) {
      var laptopWidths = [1280, 1360, 1366, 1440, 1536, 1600, 1680];
      if (laptopWidths.indexOf(w) !== -1) return 'laptop';
    }

    return 'desktop';
  }

  function getScreenRes() {
    return screen.width + 'x' + screen.height;
  }

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
              geoCache = { country: data.country_name, city: data.city };
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
    }, utm, eventData || {});

    if (geoCache) {
      payload.country = geoCache.country;
      payload.city = geoCache.city;
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
