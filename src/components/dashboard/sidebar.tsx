'use client';

import { useAppStore, type Section } from '@/lib/analytics/store';
import { sectionLabels, sectionDescriptions } from '@/lib/analytics/api';
import {
  LayoutDashboard,
  Activity,
  FolderKanban,
  Globe,
  Monitor,
  ArrowLeftRight,
  GitCompareArrows,
  FileText,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems: { section: Section; icon: React.ElementType; label?: string }[] = [
  { section: 'overview', icon: LayoutDashboard },
  { section: 'realtime', icon: Activity },
  { section: 'projects', icon: FolderKanban },
  { section: 'geography', icon: Globe },
  { section: 'devices', icon: Monitor },
  { section: 'traffic', icon: TrendingUp },
  { section: 'conversions', icon: ArrowLeftRight },
  { section: 'comparison', icon: GitCompareArrows },
  { section: 'pages', icon: BarChart3 },
  { section: 'reports', icon: FileText },
  { section: 'settings', icon: Settings },
];

export function DashboardSidebar() {
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen, setShowOnboarding } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">ADMIN Panel</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-8 w-8"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = item.label || sectionLabels[item.section];
            const description = sectionDescriptions[item.section];
            const isActive = activeSection === item.section;

            const button = (
              <Button
                key={item.section}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={() => setActiveSection(item.section)}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                {sidebarOpen && <span className="text-sm">{label}</span>}
              </Button>
            );

            // Show tooltip when sidebar is collapsed OR always for extra info
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.section}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-primary-foreground/80 mt-1">{description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Tooltip key={item.section}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px]">
                  <p className="text-xs text-primary-foreground/80">{description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {sidebarOpen && (
          <>
            <Separator className="mx-4 my-2" />

            {/* Help button */}
            <div className="px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOnboarding(true)}
                  >
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">Как пользоваться</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-xs text-primary-foreground/80">Показать справку и описание всех разделов панели</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator className="mx-4 my-2" />
            <div className="px-4 py-2">
              <p className="text-xs text-muted-foreground">
                ADMIN Panel — аналитика ваших сайтов
              </p>
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}
