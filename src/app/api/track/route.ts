import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseUserAgent, classifyTrafficSource, detectDeviceType, generateFingerprint, detectBot } from '@/lib/analytics/ua-parser';

// CORS headers for cross-origin tracking
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS /api/track - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// POST /api/track - Collect analytics events from ANY website
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventType,
      eventName,
      page,
      pageTitle,
      referrer,
      sessionId,
      userId: clientUserId,
      fingerprint: clientFingerprint,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      browser: clientBrowser,
      os: clientOs,
      deviceType: clientDeviceType,
      screenRes,
      language,
      timezone: clientTimezone,
      country: clientCountry,
      city: clientCity,
      projectId: rawProjectId,
      projectName,
      projectUrl,
      value,
      metadata,
      isBot: clientIsBot,
      botName: clientBotName,
    } = body;

    // Parse user agent server-side — this is the authoritative check
    const uaString = req.headers.get('user-agent') || '';
    const uaInfo = parseUserAgent(uaString);
    const serverBotInfo = detectBot(uaString);

    // Server-side bot detection takes priority over client
    const isBot = serverBotInfo.isBot || !!clientIsBot;
    const botName = serverBotInfo.isBot ? serverBotInfo.botName : (clientBotName || null);

    const browser = clientBrowser || uaInfo.browser;
    const os = clientOs || uaInfo.os;
    const deviceType = isBot ? 'bot' : (clientDeviceType || detectDeviceType(uaString, screenRes));

    // ============================================================
    // HYBRID USER IDENTIFICATION
    // Priority: localStorage userId > fingerprint match > new ID
    // ============================================================
    let userId = clientUserId || '';
    const serverFingerprint = generateFingerprint({
      userAgent: uaString,
      screenRes: screenRes || '',
      language: language || '',
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
      timezone: clientTimezone || '',
    });
    const fingerprint = clientFingerprint || serverFingerprint;

    if (!userId && fingerprint) {
      // No localStorage userId — try to match by fingerprint in recent events
      // Use a more efficient query: search by fingerprint in metadata
      // Only look at recent events (last 30 days) for performance
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const existingEvent = await db.event.findFirst({
        where: {
          metadata: { contains: fingerprint },
          timestamp: { gte: thirtyDaysAgo },
          isBot: false, // Don't match bot events
        },
        select: { userId: true },
        orderBy: { timestamp: 'desc' },
      });
      if (existingEvent?.userId) {
        userId = existingEvent.userId; // Restore the known user ID
      }
    }
    if (!userId) {
      userId = `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    // AUTO-DISCOVER: If projectId sent but not in DB → create project + goals
    let projectDbId: string | null = null;
    if (rawProjectId) {
      const existingProject = await db.project.findUnique({
        where: { projectId: rawProjectId },
      });
      if (existingProject) {
        if (!existingProject.deletedAt) {
          projectDbId = existingProject.id;
        }
      } else {
        const newProject = await db.project.create({
          data: {
            projectId: rawProjectId,
            name: projectName || rawProjectId,
            url: projectUrl || null,
          },
        });
        projectDbId = newProject.id;

        // Auto-create conversion goals
        const defaultGoals = [
          { eventType: 'project_view', name: 'Просмотр проекта' },
          { eventType: 'demo_open', name: 'Открытие демо' },
          { eventType: 'external_link_click', name: 'Переход по ссылке' },
          { eventType: 'contact_open', name: 'Открытие контактов' },
          { eventType: 'contact_form_open', name: 'Открытие формы связи' },
          { eventType: 'form_submit', name: 'Отправка формы' },
        ];
        for (const goal of defaultGoals) {
          await db.goal.create({
            data: {
              projectId: newProject.id,
              eventType: goal.eventType,
              name: goal.name,
              description: `Авто-цель: ${goal.name}`,
            },
          });
        }
      }
    }

    // Classify traffic source
    const trafficInfo = classifyTrafficSource(referrer, utmSource);

    // Create the event — always store, even bot events (for statistics)
    const event = await db.event.create({
      data: {
        sessionId: sessionId || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId,
        eventType: eventType || 'page_view',
        eventName: eventName || null,
        page: page || null,
        pageTitle: pageTitle || null,
        referrer: referrer || null,
        userAgent: uaString,
        browser,
        browserVersion: uaInfo.browserVersion,
        os,
        osVersion: uaInfo.osVersion,
        deviceType,
        deviceModel: uaInfo.deviceModel,
        isBot,
        botName,
        screenRes: screenRes || null,
        language: language || null,
        country: clientCountry || null,
        countryCode: null,
        region: null,
        city: clientCity || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        value: value || null,
        metadata: JSON.stringify({ ...(typeof metadata === 'object' ? metadata : {}), fp: fingerprint }),
        projectId: projectDbId,
      },
    });

    // Update or create session
    if (sessionId) {
      const existingSession = await db.analyticsSession.findUnique({
        where: { sessionId },
      });

      if (existingSession) {
        const projectIds: string[] = JSON.parse(existingSession.projectIds || '[]');
        if (projectDbId && !projectIds.includes(projectDbId)) {
          projectIds.push(projectDbId);
        }

        await db.analyticsSession.update({
          where: { sessionId },
          data: {
            projectIds: JSON.stringify(projectIds),
            lastActivityAt: new Date(),
            duration: Math.floor((Date.now() - existingSession.startedAt.getTime()) / 1000),
            pageViews: existingSession.pageViews + (eventType === 'page_view' ? 1 : 0),
            isBounce: false,
          },
        });
      } else {
        const isReturning = (await db.analyticsSession.findFirst({
          where: { userId, isBot: false },
        })) !== null;

        await db.analyticsSession.create({
          data: {
            sessionId,
            userId,
            browser,
            os,
            deviceType,
            screenRes: screenRes || null,
            language: language || null,
            country: clientCountry || null,
            region: null,
            city: clientCity || null,
            referrer: referrer || null,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            trafficSource: trafficInfo.source,
            trafficName: trafficInfo.name,
            pageViews: eventType === 'page_view' ? 1 : 0,
            isNewUser: !isReturning,
            isBot,
            botName,
            projectIds: projectDbId ? JSON.stringify([projectDbId]) : '[]',
          },
        });
      }
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDailyStats(today, projectDbId, eventType, isBot, userId);
    } catch {}

    // Check goal conversions (only for non-bot events)
    if (!isBot) {
      try {
        await checkGoalConversions(eventType, eventName, sessionId, userId, projectDbId);
      } catch {}
    }

    return NextResponse.json(
      { success: true, eventId: event.id, isBot },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

async function updateDailyStats(date: string, projectId: string | null, eventType: string, isBot: boolean, userId: string) {
  const where = { date_projectId: { date, projectId } };
  const existing = await db.dailyStats.findUnique({ where });

  if (existing) {
    const updateData: Record<string, unknown> = {
      visits: existing.visits + (eventType === 'page_view' ? 1 : 0),
    };

    // For non-bot events, recalculate unique visitors accurately
    if (!isBot && eventType === 'page_view') {
      // Count unique human visitors today
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      const uniqueHumanVisitors = await db.event.findMany({
        where: {
          timestamp: { gte: startOfDay, lte: endOfDay },
          eventType: 'page_view',
          isBot: false,
          ...(projectId ? { projectId } : {}),
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      updateData.uniqueVisitors = uniqueHumanVisitors.length;

      // Count new users (first event ever for this userId)
      const allTodaySessions = await db.analyticsSession.findMany({
        where: {
          startedAt: { gte: startOfDay, lte: endOfDay },
          isBot: false,
          ...(projectId ? { projectIds: { contains: projectId } } : {}),
        },
        select: { isNewUser: true },
      });
      updateData.newVisitors = allTodaySessions.filter(s => s.isNewUser).length;
      updateData.returningVisitors = allTodaySessions.filter(s => !s.isNewUser).length;
      updateData.totalSessions = allTodaySessions.length;
    }

    await db.dailyStats.update({ where, data: updateData });
  } else {
    await db.dailyStats.create({
      data: {
        date,
        projectId,
        visits: eventType === 'page_view' ? 1 : 0,
        uniqueVisitors: isBot ? 0 : 1,
        newVisitors: isBot ? 0 : 1,
        totalSessions: isBot ? 0 : 1,
      },
    });
  }
}

async function checkGoalConversions(
  eventType: string,
  eventName: string | null,
  sessionId: string,
  userId: string,
  projectId: string | null
) {
  const goals = await db.goal.findMany({
    where: {
      eventType,
      isActive: true,
      ...(projectId ? { projectId } : {}),
    },
  });

  for (const goal of goals) {
    if (goal.eventName && goal.eventName !== eventName) continue;
    await db.conversion.create({
      data: { goalId: goal.id, projectId, sessionId, userId },
    });
  }
}

// GET /api/track - Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'admin-panel-tracker' });
}
