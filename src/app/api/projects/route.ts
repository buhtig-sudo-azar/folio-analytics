import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects - List all registered projects
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { events: true, conversions: true, goals: true } },
      },
    });

    // Also get event counts per project for the last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const recentEvents = await db.event.count({
          where: { projectId: p.id, timestamp: { gte: oneDayAgo } },
        });
        const recentUniqueUsers = await db.event.findMany({
          where: { projectId: p.id, timestamp: { gte: oneDayAgo } },
          select: { userId: true },
          distinct: ['userId'],
        });
        return {
          ...p,
          recentEvents,
          recentUniqueUsers: recentUniqueUsers.length,
        };
      })
    );

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Register a new project manually
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, name, url, description } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'projectId and name are required' },
        { status: 400 }
      );
    }

    const existing = await db.project.findUnique({ where: { projectId } });
    if (existing) {
      return NextResponse.json(
        { error: 'Project with this ID already exists', project: existing },
        { status: 409 }
      );
    }

    const project = await db.project.create({
      data: { projectId, name, url, description },
    });

    // Auto-create default goals for the new project
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
          projectId: project.id,
          eventType: goal.eventType,
          name: goal.name,
          description: `Авто-цель: ${goal.name}`,
        },
      });
    }

    const goals = await db.goal.findMany({ where: { projectId: project.id } });

    return NextResponse.json({
      ...project,
      goals,
      trackerScript: generateTrackerScript(projectId, name, url),
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PATCH /api/projects - Update a project
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, url, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project id required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;

    const project = await db.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects - Remove a project
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project id required' }, { status: 400 });
    }

    // Delete in correct order
    await db.conversion.deleteMany({ where: { projectId: id } });
    await db.goal.deleteMany({ where: { projectId: id } });
    await db.event.updateMany({ where: { projectId: id }, data: { projectId: null } });
    await db.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

function generateTrackerScript(projectId: string, name: string, url?: string): string {
  const host = url ? new URL(url).origin : 'YOUR_ADMIN_PANEL_URL';
  return `<!-- ADMIN Panel: ${name} -->
<script>
  window.AdminPanelTracker = {
    endpoint: '${host}/api/track',
    projectId: '${projectId}',
    projectName: '${name}'
  };
</script>
<script src="${host}/tracker/tracker.js" async></script>`;
}
