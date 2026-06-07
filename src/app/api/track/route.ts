import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseUserAgent, classifyTrafficSource } from '@/lib/analytics/ua-parser';

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
      userId,
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
      country: clientCountry,
      city: clientCity,
      projectId: rawProjectId,
      projectName,
      projectUrl,
      value,
      metadata,
    } = body;

    // Parse user agent server-side
    const uaString = req.headers.get('user-agent') || '';
    const uaInfo = parseUserAgent(uaString);

    const browser = clientBrowser || uaInfo.browser;
    const os = clientOs || uaInfo.os;
    const deviceType = clientDeviceType || uaInfo.deviceType;

    // AUTO-DISCOVER: If projectId sent but not in DB → create project + goals automatically
    let projectDbId: string | null = null;
    if (rawProjectId) {
      const existingProject = await db.project.findUnique({
        where: { projectId: rawProjectId },
      });
      if (existingProject) {
        projectDbId = existingProject.id;
      } else {
        // AUTO-CREATE project with default goals
        const newProject = await db.project.create({
          data: {
            projectId: rawProjectId,
            name: projectName || rawProjectId,
            url: projectUrl || null,
          },
        });
        projectDbId = newProject.id;

        // Auto-create conversion goals for the new project
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

    // Create the event
    const event = await db.event.create({
      data: {
        sessionId: sessionId || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId: userId || `anon_${Date.now()}`,
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
        metadata: metadata ? JSON.stringify(metadata) : null,
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
          where: { userId: userId || '' },
        })) !== null;

        await db.analyticsSession.create({
          data: {
            sessionId,
            userId: userId || `anon_${Date.now()}`,
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
            projectIds: projectDbId ? JSON.stringify([projectDbId]) : '[]',
          },
        });
      }
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDailyStats(today, projectDbId, eventType);
    } catch {}

    // Check goal conversions
    try {
      await checkGoalConversions(eventType, eventName, sessionId, userId, projectDbId);
    } catch {}

    return NextResponse.json(
      { success: true, eventId: event.id },
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

async function updateDailyStats(date: string, projectId: string | null, eventType: string) {
  const where = { date_projectId: { date, projectId } };
  const existing = await db.dailyStats.findUnique({ where });

  if (existing) {
    await db.dailyStats.update({
      where,
      data: { visits: existing.visits + (eventType === 'page_view' ? 1 : 0) },
    });
  } else {
    await db.dailyStats.create({
      data: {
        date,
        projectId,
        visits: eventType === 'page_view' ? 1 : 0,
        uniqueVisitors: 1,
        newVisitors: 1,
        totalSessions: 1,
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
