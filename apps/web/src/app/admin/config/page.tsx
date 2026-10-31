'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Activity, ChevronDownIcon, Eye, EyeOff, FlaskConical, Cpu, Plug, PlugZap, Server, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  fetchAdminEngine,
  updateAdminEngine,
  connectProvider,
  testProvider,
  pingProvider,
  disconnectProvider,
  type EngineConfig,
  type IntegrationStatus,
} from '../../../api/admin'

const STAGE_LABELS: Record<string, string> = {
  chat: 'Chat / PRD / Quotation / Specs',
  prototype: 'Prototype (pass-1)',
  glowup: 'Glowup (design polish)',
  vision: 'Vision (attachment & screenshot)',
}

function ProviderCard({
  integration, form, busy, showKey,
  onToggleKey, onFormChange,
  onConnect, onTest, onPing, onDisconnect,
}: {
  integration: IntegrationStatus
  form: { apiKey: string; baseUrl: string }
  busy: boolean
  showKey: boolean
  onToggleKey: () => void
  onFormChange: (patch: { apiKey?: string; baseUrl?: string }) => void
  onConnect: () => void
  onTest: () => void
  onPing: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--ap-ink,#111827)]">{integration.name}</span>
          <Badge tone={integration.connected ? 'green' : 'gray'}>
            {integration.connected ? 'connected' : 'disconnected'}
          </Badge>
        </div>
        <span className="text-xs text-[var(--ap-ink-3,#5b6472)]">{integration.models.length} model{integration.models.length !== 1 ? 's' : ''}</span>
      </div>

      {integration.error && !integration.connected && (
        <p className="mb-3 text-xs text-orange-600 dark:text-orange-300">{integration.error}</p>
      )}

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder="API key"
            autoComplete="off"
            value={form.apiKey}
            onChange={(e) => onFormChange({ apiKey: e.target.value })}
            className="pr-10"
          />
          <Button variant="ghost" size="icon-xs" type="button" tabIndex={-1} onClick={onToggleKey} aria-label={showKey ? 'Hide API key' : 'Show API key'} className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--ap-ink-4,#6b7280)]">
            {showKey ? <EyeOff /> : <Eye />}
          </Button>
        </div>

        {integration.id === '9router' && (
          <Input
            type="text"
            placeholder="Base URL (https://…/v1)"
            value={form.baseUrl}
            onChange={(e) => onFormChange({ baseUrl: e.target.value })}
          />
        )}

        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="primary" className="h-10 gap-2 px-4 font-semibold" onClick={onConnect} disabled={busy || !form.apiKey.trim()}><PlugZap /> Connect & save</Button>
          <Button variant="secondary" className="h-10 gap-2 bg-[rgb(var(--ap-ov,0_0_0)/0.06)] px-4 font-semibold" onClick={onTest} disabled={busy || !form.apiKey.trim()}><FlaskConical /> Test (no save)</Button>
          {integration.connected && (
            <>
              <Button variant="secondary" className="h-10 gap-2 bg-[rgb(var(--ap-ov,0_0_0)/0.06)] px-4 font-semibold" onClick={onPing} disabled={busy}><Activity /> Ping</Button>
              <Button variant="destructive" className="h-10 gap-2 px-4 font-semibold" onClick={onDisconnect} disabled={busy}><Plug /> Disconnect</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const { state } = useAuth()
  const [config, setConfig] = useState<EngineConfig | null>(null)
  const [stageValues, setStageValues] = useState<Record<string, string>>({})
  const [formState, setFormState] = useState<Record<string, { apiKey: string; baseUrl: string }>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const toggleKey = useCallback((id: string) => setShowKey(p => ({ ...p, [id]: !p[id] })), [])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminEngine()
      setConfig(data)
      const values: Record<string, string> = {}
      for (const [stage, cfg] of Object.entries(data.stages)) values[stage] = cfg.value
      setStageValues(values)
      const forms: Record<string, { apiKey: string; baseUrl: string }> = {}
      for (const i of data.integrations) forms[i.id] = { apiKey: i.apiKey ?? '', baseUrl: i.baseUrl ?? '' }
      setFormState(forms)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load config')
    }
  }, [])

  useEffect(() => { if (state.status === 'authenticated') void load() }, [state.status, load])

  const models = (config?.integrations ?? []).filter(i => i.connected).flatMap(i => i.models)

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true)
    try {
      const result = await fn()
      await load()
      const text = okMsg ?? (typeof result === 'string' ? result : undefined)
      if (text) toast.success(text)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-6 pt-2 pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ap-ink,#111827)]">Configuration</h1>
        <p className="mt-1.5 text-sm text-[var(--ap-ink-4,#6b7280)]">AI engine and provider settings. Changes apply immediately.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <Tabs defaultValue="providers" className="gap-5">
          <TabsList>
            <TabsTrigger value="providers"><Server /> Providers</TabsTrigger>
            <TabsTrigger value="engine"><Cpu /> Engine</TabsTrigger>
          </TabsList>

          <TabsContent value="providers">
            <div className="flex flex-col gap-3">
              {(config?.integrations ?? []).map((integration) => (
                <ProviderCard
                  key={integration.id}
                  integration={integration}
                  form={formState[integration.id] ?? { apiKey: '', baseUrl: '' }}
                  busy={busy}
                  showKey={!!showKey[integration.id]}
                  onToggleKey={() => toggleKey(integration.id)}
                  onFormChange={(patch) => setFormState(p => ({ ...p, [integration.id]: { ...(p[integration.id] ?? { apiKey: '', baseUrl: '' }), ...patch } }))}
                  onConnect={() => run(() => connectProvider(integration.id, formState[integration.id]?.apiKey ?? '', formState[integration.id]?.baseUrl || undefined), 'Connected')}
                  onTest={() => run(() => testProvider(integration.id, formState[integration.id]?.apiKey ?? '', formState[integration.id]?.baseUrl || undefined))}
                  onPing={() => run(async () => { const r = await pingProvider(integration.id); if (!r.ok) throw new Error(r.message || 'Ping failed'); return r.message })}
                  onDisconnect={() => run(() => disconnectProvider(integration.id))}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="engine">
            <div className="rounded-2xl border border-[rgb(var(--ap-ov,0_0_0)/0.08)] bg-[var(--ap-surface,#fff)] p-6">
              <div className="flex flex-col gap-4">
                {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                  <div key={stage} className="flex flex-wrap items-center gap-4">
                    <div className="min-w-[220px]">
                      <div className="text-sm font-medium text-[var(--ap-ink,#111827)]">{label}</div>
                      <div className="text-xs text-[var(--ap-ink-3,#5b6472)]">{stage}</div>
                    </div>
                    <Select
                      value={stageValues[stage] ?? ''}
                      onValueChange={(v) => { if (v) setStageValues(p => ({ ...p, [stage]: v as string })) }}
                      disabled={models.length === 0}
                    >
                      <SelectTrigger className="h-10 min-w-[220px] flex-1 justify-between rounded-xl border border-input bg-muted/60 px-3.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-disabled:cursor-not-allowed data-disabled:opacity-60" aria-label={label}>
                        <SelectValue>{(v) => (v ? (v as string) : models.length === 0 ? 'Connect a provider first' : 'Select model')}</SelectValue>
                        <SelectIcon><ChevronDownIcon className="size-3.5 text-[var(--ap-ink-4,#6b7280)]" /></SelectIcon>
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(m => <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button variant="primary" className="h-10 gap-2 px-4 font-semibold" onClick={() => run(() => updateAdminEngine(stageValues), 'Engine config saved')} disabled={busy || models.length === 0}>
                  <Save /> {busy ? 'Saving…' : 'Save engine config'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
