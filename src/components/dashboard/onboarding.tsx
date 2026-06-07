'use client';

import { useAppStore, type Section } from '@/lib/analytics/store';
import { sectionLabels, sectionDescriptions } from '@/lib/analytics/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Activity,
  FolderKanban,
  Globe,
  Monitor,
  TrendingUp,
  ArrowLeftRight,
  GitCompareArrows,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

const sections: { section: Section; icon: React.ElementType }[] = [
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

export function OnboardingDialog() {
  const { showOnboarding, setShowOnboarding, setActiveSection } = useAppStore();

  const handleGoToSection = (section: Section) => {
    setActiveSection(section);
    setShowOnboarding(false);
  };

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            ADMIN Panel — Как пользоваться
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* What is this */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Что это такое?</h3>
            <p className="text-sm text-muted-foreground">
              ADMIN Panel — это панель аналитики для ваших сайтов. Она автоматически собирает данные о посетителях:
              откуда они приходят, какие страницы смотрят, на каких устройствах сидят, и многое другое.
              Вы подключаете трекер-код на свой сайт, и данные начинают собираться автоматически.
            </p>
          </div>

          {/* How to start */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <h3 className="font-medium text-emerald-600 mb-2">Как начать?</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Перейдите в раздел <strong className="text-foreground">«Проекты»</strong> и подключите ваш сайт</li>
              <li>Скопируйте трекер-код и вставьте его на ваш сайт перед закрывающим тегом &lt;/head&gt;</li>
              <li>Данные начнут появляться автоматически при первых посещениях</li>
            </ol>
          </div>

          {/* Sections guide */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Разделы панели
            </h3>
            <div className="space-y-2">
              {sections.map(({ section, icon: Icon }) => (
                <div
                  key={section}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{sectionLabels[section]}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs gap-1"
                        onClick={() => handleGoToSection(section)}
                      >
                        Перейти <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sectionDescriptions[section]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-600 mb-2">Подсказки</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• Наведите курсор на любой элемент, чтобы увидеть подсказку</li>
              <li>• Используйте селектор проекта вверху для фильтрации данных по конкретному сайту</li>
              <li>• Выберите период (7 дней, 30 дней и т.д.) для изменения временного диапазона</li>
              <li>• Сверните боковое меню кнопкой ← чтобы освободить место</li>
              <li>• Раздел «Настройки» содержит код подключения и API-документацию</li>
            </ul>
          </div>

          {/* Close button */}
          <Button onClick={() => setShowOnboarding(false)} className="w-full gap-2">
            Понятно, начать работу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
