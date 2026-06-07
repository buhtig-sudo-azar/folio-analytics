import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/analytics - Main analytics query endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '7d';
    const projectId = searchParams.get('projectId');
    const page = searchParams.get('page');

    const dateFilter = getDateFilter(period);

    switch (type) {
      case 'overview':
        return NextResponse.json(await getOverview(dateFilter, projectId));
      case 'visits':
        return NextResponse.json(await getVisitsTimeline(dateFilter, projectId));
      case 'geography':
        return NextResponse.json(await getGeography(dateFilter, projectId));
      case 'devices':
        return NextResponse.json(await getDevices(dateFilter, projectId));
      case 'browsers':
        return NextResponse.json(await getBrowsers(dateFilter, projectId));
      case 'os':
        return NextResponse.json(await getOS(dateFilter, projectId));
      case 'traffic':
        return NextResponse.json(await getTrafficSources(dateFilter, projectId));
      case 'utm':
        return NextResponse.json(await getUTMAnalytics(dateFilter, projectId));
      case 'projects':
        return NextResponse.json(await getProjectAnalytics(dateFilter));
      case 'project-detail':
        return NextResponse.json(await getProjectDetail(projectId, dateFilter));
      case 'ranking':
        return NextResponse.json(await getProjectRanking(dateFilter));
      case 'conversions':
        return NextResponse.json(await getConversions(dateFilter, projectId));
      case 'funnel':
        return NextResponse.json(await getFunnel(dateFilter));
      case 'pages':
        return NextResponse.json(await getPageAnalytics(dateFilter, projectId));
      case 'realtime':
        return NextResponse.json(await getRealtime());
      case 'sessions':
        return NextResponse.json(await getSessionMetrics(dateFilter, projectId));
      case 'comparison':
        return NextResponse.json(await getComparison(searchParams));
      case 'notifications':
        return NextResponse.json(await getNotifications());
      default:
        return NextResponse.json({ error: 'Unknown analytics type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function getDateFilter(period: string): Date {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '365d': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

async function getOverview(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = {
    timestamp: { gte: since },
  };
  if (projectId) where.projectId = projectId;

  const [
    totalEvents,
    pageViews,
    uniqueUsers,
    sessions,
    projectViews,
    demoOpens,
    contactOpens,
    linkClicks,
    todayEvents,
    weekEvents,
    monthEvents,
  ] = await Promise.all([
    db.event.count({ where }),
    db.event.count({ where: { ...where, eventType: 'page_view' } }),
    db.event.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    }),
    db.analyticsSession.count({
      where: { startedAt: { gte: since } },
    }),
    db.event.count({ where: { ...where, eventType: 'project_view' } }),
    db.event.count({ where: { ...where, eventType: 'demo_open' } }),
    db.event.count({ where: { ...where, eventType: 'contact_open' } }),
    db.event.count({ where: { ...where, eventType: 'external_link_click' } }),
    db.event.count({
      where: { ...where, timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    db.event.count({
      where: { ...where, timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    db.event.count({
      where: { ...where, timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const avgDurationResult = await db.analyticsSession.aggregate({
    _avg: { duration: true },
    where: { startedAt: { gte: since } },
  });

  const [bounceCount, totalSessionsForBounce] = await Promise.all([
    db.analyticsSession.count({ where: { startedAt: { gte: since }, isBounce: true } }),
    db.analyticsSession.count({ where: { startedAt: { gte: since } } }),
  ]);

  const bounceRate = totalSessionsForBounce > 0 ? Math.round((bounceCount / totalSessionsForBounce) * 100) : 0;

  return {
    totalEvents,
    pageViews,
    uniqueVisitors: uniqueUsers.length,
    sessions,
    avgSessionDuration: Math.round(avgDurationResult._avg.duration || 0),
    bounceRate,
    projectViews,
    demoOpens,
    contactOpens,
    linkClicks,
    todayVisitors: todayEvents,
    weekVisitors: weekEvents,
    monthVisitors: monthEvents,
    conversionRate: pageViews > 0 ? ((projectViews + demoOpens) / pageViews * 100).toFixed(1) : 0,
  };
}

async function getVisitsTimeline(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = {
    timestamp: { gte: since },
  };
  if (projectId) where.projectId = projectId;

  const events = await db.event.findMany({
    where: { ...where, eventType: 'page_view' },
    select: { timestamp: true, userId: true },
    orderBy: { timestamp: 'asc' },
  });

  // Group by date
  const byDate: Record<string, { date: string; visits: number; users: Set<string> }> = {};
  for (const e of events) {
    const date = e.timestamp.toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, visits: 0, users: new Set() };
    }
    byDate[date].visits++;
    byDate[date].users.add(e.userId);
  }

  return Object.values(byDate).map(d => ({
    date: d.date,
    visits: d.visits,
    uniqueVisitors: d.users.size,
  }));
}

async function getGeography(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { timestamp: { gte: since } };
  if (projectId) where.projectId = projectId;

  const events = await db.event.findMany({
    where,
    select: { country: true, city: true, userId: true },
  });

  const countries: Record<string, { country: string; visitors: number; sessions: Set<string> }> = {};
  const cities: Record<string, { city: string; country: string; visitors: number }> = {};

  for (const e of events) {
    if (e.country) {
      if (!countries[e.country]) {
        countries[e.country] = { country: e.country, visitors: 0, sessions: new Set() };
      }
      countries[e.country].visitors++;
      countries[e.country].sessions.add(e.userId);

      if (e.city) {
        const key = `${e.city}_${e.country}`;
        if (!cities[key]) {
          cities[key] = { city: e.city, country: e.country, visitors: 0 };
        }
        cities[key].visitors++;
      }
    }
  }

  return {
    countries: Object.values(countries)
      .map(c => ({ country: c.country, visitors: c.visitors, uniqueVisitors: c.sessions.size }))
      .sort((a, b) => b.visitors - a.visitors),
    cities: Object.values(cities)
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 50),
  };
}

async function getDevices(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { startedAt: { gte: since } };

  const sessions = await db.analyticsSession.findMany({
    where,
    select: { deviceType: true, screenRes: true },
  });

  const devices: Record<string, number> = {};
  const screens: Record<string, number> = {};
  const models: Record<string, number> = {};

  for (const s of sessions) {
    const dt = s.deviceType || 'unknown';
    devices[dt] = (devices[dt] || 0) + 1;

    if (s.screenRes) screens[s.screenRes] = (screens[s.screenRes] || 0) + 1;
    // deviceModel not in session table, skip
  }

  return {
    devices: Object.entries(devices).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    screenResolutions: Object.entries(screens).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 20),
    models: Object.entries(models).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 20),
  };
}

async function getBrowsers(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { startedAt: { gte: since } };

  const sessions = await db.analyticsSession.findMany({
    where,
    select: { browser: true },
  });

  const browsers: Record<string, number> = {};
  for (const s of sessions) {
    const b = s.browser || 'Unknown';
    browsers[b] = (browsers[b] || 0) + 1;
  }

  return Object.entries(browsers)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

async function getOS(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { startedAt: { gte: since } };

  const sessions = await db.analyticsSession.findMany({
    where,
    select: { os: true },
  });

  const oses: Record<string, number> = {};
  for (const s of sessions) {
    const o = s.os || 'Unknown';
    oses[o] = (oses[o] || 0) + 1;
  }

  return Object.entries(oses)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

async function getTrafficSources(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { startedAt: { gte: since } };

  const sessions = await db.analyticsSession.findMany({
    where,
    select: { trafficSource: true, trafficName: true },
  });

  const sources: Record<string, number> = {};
  const names: Record<string, number> = {};

  for (const s of sessions) {
    const src = s.trafficSource || 'direct';
    sources[src] = (sources[src] || 0) + 1;

    const name = s.trafficName || 'Direct';
    names[name] = (names[name] || 0) + 1;
  }

  return {
    sources: Object.entries(sources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    details: Object.entries(names).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

async function getUTMAnalytics(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { timestamp: { gte: since }, utmSource: { not: null } };
  if (projectId) where.projectId = projectId;

  const events = await db.event.findMany({
    where,
    select: { utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true, utmTerm: true },
  });

  const bySource: Record<string, number> = {};
  const byMedium: Record<string, number> = {};
  const byCampaign: Record<string, number> = {};
  const byContent: Record<string, number> = {};
  const byTerm: Record<string, number> = {};

  for (const e of events) {
    if (e.utmSource) bySource[e.utmSource] = (bySource[e.utmSource] || 0) + 1;
    if (e.utmMedium) byMedium[e.utmMedium] = (byMedium[e.utmMedium] || 0) + 1;
    if (e.utmCampaign) byCampaign[e.utmCampaign] = (byCampaign[e.utmCampaign] || 0) + 1;
    if (e.utmContent) byContent[e.utmContent] = (byContent[e.utmContent] || 0) + 1;
    if (e.utmTerm) byTerm[e.utmTerm] = (byTerm[e.utmTerm] || 0) + 1;
  }

  return {
    sources: Object.entries(bySource).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    mediums: Object.entries(byMedium).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    campaigns: Object.entries(byCampaign).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    contents: Object.entries(byContent).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    terms: Object.entries(byTerm).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

async function getProjectAnalytics(since: Date) {
  const projects = await db.project.findMany({
    include: {
      events: {
        where: { timestamp: { gte: since } },
        select: { eventType: true, userId: true, timestamp: true },
      },
    },
  });

  return projects.map(p => {
    const views = p.events.filter(e => e.eventType === 'project_view' || e.eventType === 'page_view').length;
    const uniqueUsers = new Set(p.events.map(e => e.userId)).size;
    const opens = p.events.filter(e => e.eventType === 'demo_open').length;
    const returns = p.events.filter(e => e.eventType === 'project_view').length;

    return {
      id: p.id,
      projectId: p.projectId,
      name: p.name,
      url: p.url,
      views,
      uniqueVisitors: uniqueUsers,
      opens,
      returns,
      totalEvents: p.events.length,
    };
  }).sort((a, b) => b.views - a.views);
}

async function getProjectDetail(projectId: string | null | undefined, since: Date) {
  if (!projectId) return { error: 'projectId required' };

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      events: {
        where: { timestamp: { gte: since } },
        select: {
          eventType: true,
          userId: true,
          timestamp: true,
          page: true,
          country: true,
          deviceType: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      },
    },
  });

  if (!project) return { error: 'Project not found' };

  const views = project.events.filter(e => e.eventType === 'page_view').length;
  const uniqueVisitors = new Set(project.events.map(e => e.userId)).size;

  return {
    ...project,
    stats: {
      views,
      uniqueVisitors,
      opens: project.events.filter(e => e.eventType === 'demo_open').length,
      returns: project.events.filter(e => e.eventType === 'project_view').length,
    },
  };
}

async function getProjectRanking(since: Date) {
  const projects = await getProjectAnalytics(since);

  const mostVisited = [...projects].sort((a, b) => b.views - a.views)[0];
  const fastestGrowing = [...projects].sort((a, b) => b.totalEvents - a.totalEvents)[0];
  const longestViewed = [...projects].sort((a, b) => b.returns - a.returns)[0];
  const bestConversion = [...projects]
    .filter(p => p.views > 0)
    .sort((a, b) => (b.opens / b.views) - (a.opens / a.views))[0];

  return {
    mostVisited: mostVisited || null,
    fastestGrowing: fastestGrowing || null,
    longestViewed: longestViewed || null,
    bestConversion: bestConversion || null,
    all: projects,
  };
}

async function getConversions(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (projectId) where.projectId = projectId;

  const conversions = await db.conversion.findMany({
    where,
    include: { goal: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const goals = await db.goal.findMany({
    where: { isActive: true },
    include: {
      conversions: {
        where: { createdAt: { gte: since } },
        select: { id: true },
      },
    },
  });

  return {
    total: conversions.length,
    byGoal: goals.map(g => ({
      id: g.id,
      name: g.name,
      eventType: g.eventType,
      conversions: g.conversions.length,
    })),
    recent: conversions.slice(0, 50),
  };
}

async function getFunnel(since: Date) {
  const [portfolioViews, projectViews, projectOpens, demoOpens, contacts] = await Promise.all([
    db.event.count({ where: { eventType: 'page_view', timestamp: { gte: since } } }),
    db.event.count({ where: { eventType: 'project_view', timestamp: { gte: since } } }),
    db.event.count({ where: { eventType: 'demo_open', timestamp: { gte: since } } }),
    db.event.count({ where: { eventType: 'external_link_click', timestamp: { gte: since } } }),
    db.event.count({ where: { eventType: 'contact_open', timestamp: { gte: since } } }),
  ]);

  const steps = [
    { name: 'Портфолио', value: portfolioViews },
    { name: 'Просмотр проекта', value: projectViews },
    { name: 'Открытие проекта', value: projectOpens },
    { name: 'Переход в демо', value: demoOpens },
    { name: 'Связь с владельцем', value: contacts },
  ];

  return steps.map((step, i) => ({
    ...step,
    dropoff: i > 0 && steps[i - 1].value > 0
      ? Math.round((1 - step.value / steps[i - 1].value) * 100)
      : 0,
    conversionRate: steps[0].value > 0
      ? Math.round((step.value / steps[0].value) * 100)
      : 0,
  }));
}

async function getPageAnalytics(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { timestamp: { gte: since }, page: { not: null } };
  if (projectId) where.projectId = projectId;

  const events = await db.event.findMany({
    where: { ...where, eventType: 'page_view' },
    select: { page: true, userId: true },
  });

  const pages: Record<string, { page: string; views: number; users: Set<string> }> = {};
  for (const e of events) {
    if (!e.page) continue;
    if (!pages[e.page]) {
      pages[e.page] = { page: e.page, views: 0, users: new Set() };
    }
    pages[e.page].views++;
    pages[e.page].users.add(e.userId);
  }

  return Object.values(pages)
    .map(p => ({ page: p.page, views: p.views, uniqueVisitors: p.users.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);
}

async function getRealtime() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [recentEvents, recentSessions] = await Promise.all([
    db.event.findMany({
      where: { timestamp: { gte: fiveMinAgo } },
      select: { page: true, projectId: true, country: true, eventType: true, userId: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    db.analyticsSession.findMany({
      where: { lastActivityAt: { gte: fiveMinAgo } },
      select: { sessionId: true, country: true, deviceType: true },
    }),
  ]);

  const activeUsers = new Set(recentEvents.map(e => e.userId)).size;
  const activePages = [...new Set(recentEvents.map(e => e.page).filter(Boolean))];
  const activeProjects = [...new Set(recentEvents.map(e => e.projectId).filter(Boolean))];
  const activeCountries = [...new Set(recentEvents.map(e => e.country).filter(Boolean))];

  return {
    activeVisitors: activeUsers,
    activePages,
    activeProjects,
    activeCountries,
    recentEvents: recentEvents.map(e => ({ ...e, timestamp: e.timestamp.toISOString() })).slice(0, 20),
    totalActive: recentSessions.length,
  };
}

async function getSessionMetrics(since: Date, projectId?: string | null) {
  const where: Record<string, unknown> = { startedAt: { gte: since } };

  const [totalSessions, avgDuration, avgDepth, bounceCount, bounceTotal] = await Promise.all([
    db.analyticsSession.count({ where }),
    db.analyticsSession.aggregate({ _avg: { duration: true }, where }),
    db.analyticsSession.aggregate({ _avg: { pageViews: true }, where }),
    db.analyticsSession.count({ where: { ...where, isBounce: true } }),
    db.analyticsSession.count({ where }),
  ]);

  return {
    totalSessions,
    avgDuration: Math.round(avgDuration._avg.duration || 0),
    avgPageDepth: Math.round((avgDepth._avg.pageViews || 0) * 10) / 10,
    bounceRate: bounceTotal > 0 ? Math.round((bounceCount / bounceTotal) * 100) : 0,
  };
}

async function getComparison(searchParams: URLSearchParams) {
  const projectA = searchParams.get('projectA');
  const projectB = searchParams.get('projectB');
  const period = searchParams.get('period') || '30d';

  if (!projectA || !projectB) {
    return { error: 'projectA and projectB required' };
  }

  const since = getDateFilter(period);

  const [dataA, dataB] = await Promise.all([
    getProjectDetail(projectA, since),
    getProjectDetail(projectB, since),
  ]);

  return { projectA: dataA, projectB: dataB };
}

async function getNotifications() {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    unread: notifications.filter(n => !n.isRead).length,
    notifications,
  };
}
