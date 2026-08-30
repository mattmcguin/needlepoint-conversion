(function () {
  'use strict';

  const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://needlepoint-api-production.up.railway.app';
  const VISITOR_KEY = 'needlepoint_analytics_visitor';
  const SESSION_KEY = 'needlepoint_analytics_session';
  const OPT_OUT_KEY = 'needlepoint_analytics_opt_out';
  const SESSION_LENGTH_MS = 30 * 60 * 1000;
  const FLUSH_DELAY_MS = 5_000;
  const MAX_QUEUE_SIZE = 50;

  let queue = [];
  let flushTimer = null;

  function uuid() {
    return crypto.randomUUID();
  }

  function isEnabled() {
    return localStorage.getItem(OPT_OUT_KEY) !== 'true';
  }

  function getVisitorId() {
    if (!isEnabled()) return null;
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function getSessionId() {
    if (!isEnabled()) return null;
    const now = Date.now();
    let session;
    try {
      session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch (_error) {
      session = null;
    }

    if (!session?.id || !session.lastSeen || now - session.lastSeen > SESSION_LENGTH_MS) {
      session = { id: uuid(), lastSeen: now };
    } else {
      session.lastSeen = now;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session.id;
  }

  function cleanPath() {
    const cleaned = window.location.pathname.replace(/[^A-Za-z0-9/_-]/g, '');
    return cleaned.startsWith('/') ? cleaned.slice(0, 200) : '/';
  }

  function deviceClass() {
    if (window.innerWidth < 600) return 'phone';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  function safeCampaignValue(value, maxLength) {
    if (!value) return undefined;
    const cleaned = value.replace(/[^A-Za-z0-9._-]/g, '').slice(0, maxLength);
    return cleaned || undefined;
  }

  function acquisitionProperties() {
    const params = new URLSearchParams(window.location.search);
    const properties = {
      landingPage: cleanPath(),
      deviceClass: deviceClass()
    };

    if (document.referrer) {
      try {
        const domain = new URL(document.referrer).hostname.slice(0, 120);
        if (domain && domain !== window.location.hostname) properties.referrerDomain = domain;
      } catch (_error) {
        // Ignore malformed browser referrers.
      }
    }

    const campaignValues = {
      utmSource: safeCampaignValue(params.get('utm_source'), 80),
      utmMedium: safeCampaignValue(params.get('utm_medium'), 80),
      utmCampaign: safeCampaignValue(params.get('utm_campaign'), 100)
    };
    Object.entries(campaignValues).forEach(([key, value]) => {
      if (value) properties[key] = value;
    });
    return properties;
  }

  function scheduleFlush() {
    if (flushTimer || !isEnabled()) return;
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flush();
    }, FLUSH_DELAY_MS);
  }

  function track(eventName, properties, projectId) {
    if (!isEnabled()) return;
    queue.push({
      eventId: uuid(),
      ...(projectId ? { projectId: String(projectId).slice(0, 64) } : {}),
      eventName,
      path: cleanPath(),
      properties: properties || {},
      occurredAt: new Date().toISOString()
    });
    if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
    if (queue.length >= 10) void flush();
    else scheduleFlush();
  }

  function takePayload() {
    const anonymousId = getVisitorId();
    const sessionId = getSessionId();
    if (!anonymousId || !sessionId || queue.length === 0) return null;
    const events = queue.splice(0, 20);
    return { anonymousId, sessionId, events };
  }

  async function flush(options) {
    if (!isEnabled()) return false;
    const payload = takePayload();
    if (!payload) return true;
    const endpoint = `${API_BASE_URL}/v1/events/batch`;

    if (options?.beacon && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        endpoint,
        new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' })
      );
      if (sent) return true;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok && response.status >= 500) {
        queue = [...payload.events, ...queue].slice(0, MAX_QUEUE_SIZE);
      }
      return response.ok;
    } catch (_error) {
      queue = [...payload.events, ...queue].slice(0, MAX_QUEUE_SIZE);
      return false;
    }
  }

  async function submit(path, body) {
    const anonymousId = getVisitorId() || uuid();
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anonymousId, ...body })
      });
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  function setEnabled(enabled) {
    if (enabled) {
      localStorage.removeItem(OPT_OUT_KEY);
      track('page_view', acquisitionProperties());
    } else {
      localStorage.setItem(OPT_OUT_KEY, 'true');
      localStorage.removeItem(VISITOR_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      queue = [];
      if (flushTimer) window.clearTimeout(flushTimer);
      flushTimer = null;
    }
  }

  window.NeedlepointAnalytics = {
    track,
    flush,
    isEnabled,
    setEnabled,
    submitIntent(body) {
      return submit('/v1/intent', body);
    },
    submitFeedback(body) {
      return submit('/v1/feedback', body);
    }
  };

  if (isEnabled()) track('page_view', acquisitionProperties());
  window.addEventListener('pagehide', () => void flush({ beacon: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush({ beacon: true });
  });
})();
