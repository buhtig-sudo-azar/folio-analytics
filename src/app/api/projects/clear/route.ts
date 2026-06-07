import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/clear — Delete all analytics data for a project (keep project + goals)
// Or clear ALL data if no projectId specified
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, all } = body;

    if (all) {
      // Nuclear option: clear ALL analytics data across all projects
      await db.conversion.deleteMany({});
      await db.dailyStats.deleteMany({});
      await db.event.deleteMany({});
      await db.analyticsSession.deleteMany({});
      await db.pageView.deleteMany({});

      return NextResponse.json({
        success: true,
        message: 'Все аналитические данные очищены',
      });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Укажите projectId или all: true' },
        { status: 400 }
      );
    }

    // Find the project by projectId (the slug, not the DB id)
    const project = await db.project.findUnique({ where: { projectId } });
    if (!project || project.deletedAt) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    const id = project.id;

    // Delete conversions, then events, then sessions, then page views, then daily stats
    // Keep: project itself, goals (so tracking continues working)
    const [conversions, events, sessions, pageViews, dailyStats] = await Promise.all([
      db.conversion.deleteMany({ where: { projectId: id } }),
      db.event.deleteMany({ where: { projectId: id } }),
      db.analyticsSession.deleteMany({ where: { projectIds: { contains: id } } }),
      db.pageView.deleteMany({ where: { projectId: id } }),
      db.dailyStats.deleteMany({ where: { projectId: id } }),
    ]);

    const total =
      conversions.count + events.count + sessions.count + pageViews.count + dailyStats.count;

    return NextResponse.json({
      success: true,
      message: `Данные проекта «${project.name}» очищены`,
      deleted: {
        conversions: conversions.count,
        events: events.count,
        sessions: sessions.count,
        pageViews: pageViews.count,
        dailyStats: dailyStats.count,
        total,
      },
    });
  } catch (error) {
    console.error('Clear data error:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
