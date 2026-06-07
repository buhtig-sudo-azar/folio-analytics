'use client';

import { useAppStore } from '@/lib/analytics/store';
import { periodLabels, periodDescriptions, sectionLabels, sectionDescriptions } from '@/lib/analytics/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Moon, Sun, FolderKanban, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

import { cn } from '@/lib/utils';

interface ProjectOption {
  id: string;
  projectId: string;
  name: string;
}

export function DashboardHeader() {
  const { period, setPeriod, activeSection, selectedProject, setSelectedProject, sidebarOpen, setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const isMobile = useIsMobile();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : [])
      .then((data: ProjectOption[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Mobile menu button */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <h1 className="text-sm md:text-lg font-semibold cursor-help truncate">
              {sectionLabels[activeSection]}
            </h1>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px]">
            <p className="text-xs text-primary-foreground/80">{sectionDescriptions[activeSection]}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Project selector — hidden on very small screens */}
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select value={selectedProject || '__all__'} onValueChange={(v) => setSelectedProject(v === '__all__' ? null : v)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Все проекты" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Все проекты</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[250px]">
              <p className="font-medium text-xs">Фильтр по проекту</p>
              <p className="text-xs text-primary-foreground/80 mt-1">Выберите конкретный сайт для фильтрации данных, или оставьте «Все проекты» для общей статистики</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Period selector */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className={cn('h-9', isMobile ? 'w-[100px]' : 'w-[140px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(periodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="font-medium text-xs">Период</p>
            <p className="text-xs text-primary-foreground/80 mt-1">{periodDescriptions[period]}</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Уведомления — пока нет новых</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        {mounted && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
