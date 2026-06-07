'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings as SettingsIcon,
  Code,
  Shield,
  Bell,
  Copy,
  Check,
  Link as LinkIcon,
  Globe,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SettingsSection() {
  const [copied, setCopied] = useState<string | null>(null);
  const [notifSettings, setNotifSettings] = useState({
    trafficSpike: true,
    trafficDrop: true,
    newCountry: true,
    goalAchieved: true,
    conversionSpike: false,
  });

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-server.com';

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const trackerSameDomain = `<!-- ADMIN Panel: тот же домен -->
<script>
  window.AdminPanelTracker = {
    projectId: 'YOUR_PROJECT_ID',
    projectName: 'YOUR_PROJECT_NAME'
  };
</script>
<script src="/tracker/tracker.js" async></script>`;

  const trackerCrossDomain = `<!-- ADMIN Panel: кросс-домен (GitHub Pages → сервер) -->
<script>
  window.AdminPanelTracker = {
    endpoint: '${serverOrigin}/api/track',
    projectId: 'YOUR_PROJECT_ID',
    projectName: 'YOUR_PROJECT_NAME'
  };
</script>
<script src="${serverOrigin}/tracker/tracker.js" async></script>`;

  const trackerApi = `// Отслеживание пользовательских событий
AdminAnalytics.trackEvent('custom_event_name', { key: 'value' });

// Предустановленные события
AdminAnalytics.trackProjectView();
AdminAnalytics.trackDemoOpen();
AdminAnalytics.trackContactOpen();
AdminAnalytics.trackContactFormOpen();
AdminAnalytics.trackFormSubmit();

// Произвольная отправка
AdminAnalytics.track('my_event', { value: 42 });`;

  const curlExample = `# Ручная отправка события (тестирование)
curl -X POST "${serverOrigin}/api/track" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventType": "page_view",
    "sessionId": "test_session_1",
    "userId": "test_user_1",
    "page": "/",
    "projectId": "my-project",
    "projectName": "My Project",
    "deviceType": "desktop",
    "screenRes": "1920x1080",
    "language": "ru-RU"
  }'`;

  return (
    <div className="space-y-6">
      {/* Step-by-step guide: WHERE to insert the tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-emerald-500" />
            Куда вставлять трекер-код? Пошаговая инструкция
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">1</div>
            <div>
              <h4 className="text-sm font-medium">Скопируйте трекер-код</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Перейдите в раздел <strong className="text-foreground">«Проекты»</strong>, найдите ваш проект и нажмите кнопку &lt;/&gt; (скопировать трекер-код).
                Либо возьмите код ниже — подставьте свои значения <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">projectId</code> и <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">projectName</code>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">2</div>
            <div>
              <h4 className="text-sm font-medium">Откройте HTML-файл вашего сайта</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Найдите главный файл вашего сайта. Вот типичные пути:
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">GitHub Pages</Badge>
                  <span className="text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">index.html</code> в корне репозитория</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">React / Next.js</Badge>
                  <span className="text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">src/app/layout.tsx</code> или <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">pages/_document.tsx</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">Vue / Nuxt</Badge>
                  <span className="text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">app.vue</code> или <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">nuxt.config.ts</code> (head)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">WordPress</Badge>
                  <span className="text-muted-foreground"><code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">header.php</code> вашей темы или плагин «Insert Headers & Footers»</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">Tilda / Конструктор</Badge>
                  <span className="text-muted-foreground">Настройки сайта → «Код в HEAD» или «Пользовательский HTML»</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">3</div>
            <div>
              <h4 className="text-sm font-medium">Вставьте код перед закрывающим тегом &lt;/head&gt;</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Найдите в HTML-файле строку <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">&lt;/head&gt;</code> и вставьте трекер-код
                <strong className="text-foreground"> прямо перед ней</strong>. Вот как это должно выглядеть:
              </p>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono mt-2">{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Мой сайт</title>

  <!-- 👇 ADMIN Panel трекер — вставить СЮДА -->
  <script>
    window.AdminPanelTracker = {
      endpoint: '${serverOrigin}/api/track',
      projectId: 'ваш-project-id',
      projectName: 'Название проекта'
    };
  </script>
  <script src="${serverOrigin}/tracker/tracker.js" async></script>
  <!-- 👆 Конец трекера -->

</head>
<body>
  ...содержимое сайта...
</body>
</html>`}</pre>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">4</div>
            <div>
              <h4 className="text-sm font-medium">Сохраните и опубликуйте</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Сохраните файл, закоммитьте изменения (если Git) и запушьте. Для GitHub Pages — подождите 1-2 минуты,
                пока GitHub пересоберёт сайт. После этого откройте ваш сайт в браузере — данные начнут поступать в ADMIN Panel автоматически.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">5</div>
            <div>
              <h4 className="text-sm font-medium">Проверьте, что всё работает</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Откройте ваш сайт, полистайте страницы. Затем вернитесь в ADMIN Panel — в разделе
                <strong className="text-foreground"> «Реальное время»</strong> должны появиться события.
                Также можно проверить через консоль браузера (F12 → Network → ищите запросы к <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/track</code>).
              </p>
            </div>
          </div>

          {/* Important notes */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-amber-600">Важные моменты</h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• Трекер-код вставляется <strong className="text-foreground">один раз</strong> — на каждую страницу, которую хотите отслеживать</li>
              <li>• Если у вас SPA (React/Vue/Angular) — трекер автоматически ловит переходы между страницами</li>
              <li>• Если сайт на другом домене (GitHub Pages, Netlify и т.п.) — обязательно используйте <strong className="text-foreground">Вариант 2</strong> с полным URL</li>
              <li>• Данные появятся не мгновенно — подождите 5-10 секунд после посещения</li>
            </ul>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-emerald-600 mb-1">Автомасштабирование</h4>
            <p className="text-sm text-muted-foreground">
              Проект автоматически появится в дашборде при первом посещении. Цели и конверсии создаются автоматически.
              Не нужно настраивать таблицы или события вручную — просто вставьте код.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracker code variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-500" />
            Код трекера — выберите ваш вариант
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Вариант 1: Тот же домен
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Если аналитика и проект на одном сервере — используйте относительный путь:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">{trackerSameDomain}</pre>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy('same', trackerSameDomain)}>
                    {copied === 'same' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{copied === 'same' ? 'Скопировано!' : 'Скопировать код'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Вариант 2: Кросс-домен (GitHub Pages, Vercel, Netlify)
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Если проект на другом домене — укажите полный URL до сервера аналитики:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">{trackerCrossDomain}</pre>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy('cross', trackerCrossDomain)}>
                    {copied === 'cross' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{copied === 'cross' ? 'Скопировано!' : 'Скопировать код'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-500" />
                JavaScript API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">{trackerApi}</pre>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy('api', trackerApi)}>
                      {copied === 'api' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">{copied === 'api' ? 'Скопировано!' : 'Скопировать код'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <p className="text-xs text-primary-foreground/80">Методы JavaScript API для отслеживания событий на сайте. Можно вызывать из любого места вашего кода</p>
        </TooltipContent>
      </Tooltip>

      {/* cURL test */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-500" />
                Тестирование (cURL)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">{curlExample}</pre>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy('curl', curlExample)}>
                      {copied === 'curl' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">{copied === 'curl' ? 'Скопировано!' : 'Скопировать команду'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <p className="text-xs text-primary-foreground/80">Команда для тестирования API вручную через терминал. Отправьте событие и проверьте, что оно появилось в дашборде</p>
        </TooltipContent>
      </Tooltip>

      {/* Roles */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Роли пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50">
                  <div>
                    <span className="text-sm font-medium">Admin</span>
                    <p className="text-xs text-muted-foreground">Полный доступ: управление проектами, настройка, удаление</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500">Полный доступ</Badge>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50">
                  <div>
                    <span className="text-sm font-medium">Analyst</span>
                    <p className="text-xs text-muted-foreground">Просмотр аналитики и отчётов, без изменения настроек</p>
                  </div>
                  <Badge variant="secondary">Только чтение</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <p className="text-xs text-primary-foreground/80">Admin может всё — добавлять/удалять проекты, менять настройки. Analyst может только смотреть данные и отчёты</p>
        </TooltipContent>
      </Tooltip>

      {/* Notification Settings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Уведомления
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'trafficSpike', label: 'Всплеск трафика', desc: 'При резком увеличении посещаемости', hint: 'Сработает, если трафик вырастет значительно выше обычного' },
                  { key: 'trafficDrop', label: 'Падение трафика', desc: 'При резком снижении посещаемости', hint: 'Сработает, если трафик упадёт ниже обычного уровня' },
                  { key: 'newCountry', label: 'Новая страна', desc: 'При посещении из новой страны', hint: 'Оповещение, если сайт посетили из страны, откуда ещё не было заходов' },
                  { key: 'goalAchieved', label: 'Достижение цели', desc: 'При выполнении конверсионной цели', hint: 'Оповещение при каждом достижении отслеживаемой цели' },
                  { key: 'conversionSpike', label: 'Резкая конверсия', desc: 'При резком увеличении конверсий', hint: 'Сработает, если конверсии резко пошли вверх' },
                ].map((item) => (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between cursor-help">
                        <div>
                          <Label className="text-sm">{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifSettings[item.key as keyof typeof notifSettings]}
                          onCheckedChange={(checked) =>
                            setNotifSettings(prev => ({ ...prev, [item.key]: checked }))
                          }
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                      <p className="text-xs text-primary-foreground/80">{item.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs text-primary-foreground/80">Настройте, о каких событиях хотите получать уведомления. Включите/выключите нужные категории</p>
        </TooltipContent>
      </Tooltip>

      {/* System info */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Система
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Версия</div>
                <div>1.0.0</div>
                <div className="text-muted-foreground">База данных</div>
                <div>PostgreSQL / Prisma</div>
                <div className="text-muted-foreground">Фреймворк</div>
                <div>Next.js 16</div>
                <div className="text-muted-foreground">CORS</div>
                <div><Badge variant="secondary" className="text-xs">Включён</Badge></div>
                <div className="text-muted-foreground">Автомасштабирование</div>
                <div><Badge variant="secondary" className="text-xs">Включено</Badge></div>
                <div className="text-muted-foreground">Трекер</div>
                <div>/tracker/tracker.js</div>
                <div className="text-muted-foreground">Endpoint</div>
                <div className="font-mono text-xs">/api/track</div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs text-primary-foreground/80">Техническая информация о системе. CORS нужен для кросс-доменного отслеживания</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
