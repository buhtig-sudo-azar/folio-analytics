'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Trash2, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModelStore } from '@/lib/analytics/model-store';

export function ApiTokenInput() {
  const { apiToken, setApiToken, clearApiToken, checkModel } = useModelStore();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSave = () => {
    const val = draft.trim();
    if (val) {
      setApiToken(val);
      setDraft('');
      setEditing(false);
      setShow(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const info = await checkModel('moonshotai/kimi-k2.6:free');
      if (info.available) {
        setCheckResult({ ok: true, msg: `Токен работает (${info.latency}мс)` });
      } else {
        setCheckResult({ ok: false, msg: `Не работает: ${info.reason || 'ошибка'}` });
      }
    } catch {
      setCheckResult({ ok: false, msg: 'Ошибка проверки' });
    } finally {
      setChecking(false);
    }
  };

  const handleClear = () => {
    clearApiToken();
    setCheckResult(null);
  };

  const maskToken = (t: string) => {
    if (t.length <= 8) return '••••••••';
    return t.slice(0, 4) + '••••' + t.slice(-4);
  };

  if (!show && !apiToken) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2"
        onClick={() => { setShow(true); setEditing(true); }}
      >
        <Key className="h-3 w-3" />
        Свой токен
      </Button>
    );
  }

  if (!show && apiToken) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2"
          onClick={() => setShow(true)}
        >
          <Key className="h-3 w-3 text-emerald-500" />
          <span className="max-w-[80px] truncate font-mono">{maskToken(apiToken)}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive"
          onClick={handleClear}
          title="Удалить токен"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 border border-border rounded-lg bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">API-ключ OpenRouter</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => { setShow(false); setEditing(false); setCheckResult(null); }}
        >
          ✕
        </Button>
      </div>

      {editing ? (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-or-v1-..."
            className="flex-1 h-7 px-2 text-xs bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      ) : (
        <div className="flex gap-1.5 items-center">
          <div className="flex-1 flex items-center gap-1 h-7 px-2 bg-muted rounded-md text-xs font-mono">
            {apiToken ? (show ? apiToken : maskToken(apiToken)) : 'не задан'}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-auto shrink-0"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
            </Button>
          </div>
        </div>
      )}

      {checkResult && (
        <div className={`flex items-center gap-1.5 text-[10px] ${checkResult.ok ? 'text-emerald-500' : 'text-red-500'}`}>
          {checkResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {checkResult.msg}
        </div>
      )}

      <div className="flex gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px]"
          onClick={handleCheck}
          disabled={checking || !apiToken}
        >
          {checking ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" /> : <Key className="h-2.5 w-2.5 mr-1" />}
          Проверить
        </Button>
        {apiToken && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-destructive hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="h-2.5 w-2.5 mr-1" />
            Удалить
          </Button>
        )}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Получить ключ <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
