import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/export - Export analytics data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'events';
    const period = searchParams.get('period') || '30d';

    const since = getSince(period);

    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'events': {
        const events = await db.event.findMany({
          where: { timestamp: { gte: since } },
          orderBy: { timestamp: 'desc' },
          take: 10000,
        });
        data = events.map(e => ({
          timestamp: e.timestamp.toISOString(),
          sessionId: e.sessionId,
          userId: e.userId,
          eventType: e.eventType,
          eventName: e.eventName,
          page: e.page,
          referrer: e.referrer,
          browser: e.browser,
          os: e.os,
          deviceType: e.deviceType,
          country: e.country,
          city: e.city,
          utmSource: e.utmSource,
          utmMedium: e.utmMedium,
          utmCampaign: e.utmCampaign,
          value: e.value,
        }));
        break;
      }
      case 'sessions': {
        const sessions = await db.analyticsSession.findMany({
          where: { startedAt: { gte: since } },
          orderBy: { startedAt: 'desc' },
          take: 10000,
        });
        data = sessions.map(s => ({
          sessionId: s.sessionId,
          userId: s.userId,
          browser: s.browser,
          os: s.os,
          deviceType: s.deviceType,
          country: s.country,
          city: s.city,
          trafficSource: s.trafficSource,
          trafficName: s.trafficName,
          duration: s.duration,
          pageViews: s.pageViews,
          isBounce: s.isBounce,
          isNewUser: s.isNewUser,
          startedAt: s.startedAt.toISOString(),
        }));
        break;
      }
      case 'pages': {
        const pages = await db.pageView.findMany({
          where: { date: { gte: since.toISOString().split('T')[0] } },
          orderBy: { date: 'desc' },
        });
        data = pages.map(p => ({
          page: p.page,
          date: p.date,
          views: p.views,
          uniqueUsers: p.uniqueUsers,
          avgTimeOnPage: p.avgTimeOnPage,
          exitRate: p.exitRate,
          bounceRate: p.bounceRate,
        }));
        break;
      }
    }

    if (format === 'csv') {
      const csv = toCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_export.csv"`,
        },
      });
    }

    if (format === 'json') {
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unsupported format. Use csv or json.' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function getSince(period: string): Date {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '365d': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
