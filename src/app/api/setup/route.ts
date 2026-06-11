import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

// POST /api/setup - Initialize/sync database schema
// Call this endpoint once after deployment to ensure all tables exist
export async function POST() {
  try {
    // Test database connection by running a simple query
    await db.$queryRaw`SELECT 1`;

    // Check if Event table has isBot column
    const eventColumns = await db.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Event' AND column_name = 'isBot'
    ` as Array<{ column_name: string }>;

    const hasIsBot = eventColumns.length > 0;

    // Add missing columns if they don't exist
    if (!hasIsBot) {
      console.log('Adding missing columns to Event table...');

      await db.$executeRawUnsafe(`
        ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false;
      `);
      await db.$executeRawUnsafe(`
        ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "botName" TEXT;
      `);

      await db.$executeRawUnsafe(`
        ALTER TABLE "AnalyticsSession" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false;
      `);
      await db.$executeRawUnsafe(`
        ALTER TABLE "AnalyticsSession" ADD COLUMN IF NOT EXISTS "botName" TEXT;
      `);

      await db.$executeRawUnsafe(`
        ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
      `);

      // Add missing indexes
      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Event_isBot_idx" ON "Event"("isBot");
      `);
      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AnalyticsSession_isBot_idx" ON "AnalyticsSession"("isBot");
      `);

      console.log('Missing columns added successfully.');
    }

    // Check if any tables exist at all
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as Array<{ table_name: string }>;

    const tableNames = tables.map(t => t.table_name);

    if (tableNames.length === 0) {
      // No tables exist - need full migration
      // This will be handled by prisma migrate deploy on build
      return NextResponse.json({
        status: 'empty',
        message: 'Database is empty. Run prisma db push or prisma migrate deploy first.',
        tables: [],
      });
    }

    // Count events to verify data flow
    const eventCount = await db.event.count();
    const sessionCount = await db.analyticsSession.count();
    const projectCount = await db.project.count();

    return NextResponse.json({
      status: 'ok',
      message: hasIsBot ? 'Database schema is up to date' : 'Schema updated with missing columns',
      tables: tableNames,
      stats: {
        events: eventCount,
        sessions: sessionCount,
        projects: projectCount,
      },
      columnsAdded: !hasIsBot,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed or schema sync error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// GET /api/setup - Check database status
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as Array<{ table_name: string }>;

    const tableNames = tables.map(t => t.table_name);

    if (tableNames.length === 0) {
      return NextResponse.json({
        status: 'empty',
        message: 'Database has no tables',
        tables: [],
      });
    }

    const [eventCount, sessionCount, projectCount, botCount] = await Promise.all([
      db.event.count(),
      db.analyticsSession.count(),
      db.project.count({ where: { deletedAt: null } }),
      db.event.count({ where: { isBot: true } }),
    ]);

    return NextResponse.json({
      status: 'connected',
      tables: tableNames,
      stats: {
        events: eventCount,
        sessions: sessionCount,
        projects: projectCount,
        botEvents: botCount,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
