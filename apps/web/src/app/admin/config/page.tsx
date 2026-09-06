'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import {
  Select, Button, Text, Badge, TextField,
  IconButton, Flex, Box, Card, Callout, Tabs,
} from '@radix-ui/themes'
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

function omitKey<K extends string, V>(rec: Record<K, V>, key: string): Record<K, V> {
  const { [key as K]: _dropped, ...rest } = rec
  return rest as Record<K, V>
}

function SectionMsg({ kind, text, onDismiss }: { kind: 'error' | 'notice'; text: string; onDismiss: () => void }) {
  return (
    <Callout.Root color={kind === 'error' ? 'red' : 'green'} size="1">
      <Callout.Text>
        <Flex justify="between" align="center" gap="3">
          <span>{text}</span>
          <IconButton size="1" variant="ghost" color="gray" onClick={onDismiss}>✕</IconButton>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}

function ProviderCard({
  integration, form, msg, busy, showKey,
  onToggleKey, onDismissMsg, onFormChange,
  onConnect, onTest, onPing, onDisconnect,
}: {
  integration: IntegrationStatus
  form: { apiKey: string; baseUrl: string }
  msg?: { kind: 'error' | 'notice'; text: string }
  busy: boolean
  showKey: boolean
  onToggleKey: () => void
  onDismissMsg: () => void
  onFormChange: (patch: { apiKey?: string; baseUrl?: string }) => void
  onConnect: () => void
  onTest: () => void
  onPing: () => void
  onDisconnect: () => void
}) {
  return (
    <Card>
      <Flex justify="between" align="center" mb="3">
        <Flex align="center" gap="2">
          <Text size="2" weight="medium">{integration.name}</Text>
          <Badge color={integration.connected ? 'green' : 'gray'} variant="soft" radius="full">
            {integration.connected ? 'connected' : 'disconnected'}
          </Badge>
        </Flex>
        <Text size="1" color="gray">{integration.models.length} model{integration.models.length !== 1 ? 's' : ''}</Text>
      </Flex>

      {msg && <Box mb="3"><SectionMsg kind={msg.kind} text={msg.text} onDismiss={onDismissMsg} /></Box>}
      {integration.error && !integration.connected && (
        <Text size="1" color="orange" mb="3" as="p">{integration.error}</Text>
      )}

      <Flex direction="column" gap="2">
        <Box style={{ position: 'relative' }}>
          <TextField.Root
            type={showKey ? 'text' : 'password'}
            placeholder="API key"
            autoComplete="off"
            value={form.apiKey}
            onChange={(e) => onFormChange({ apiKey: e.target.value })}
          >
            <TextField.Slot side="right">
              <IconButton size="1" variant="ghost" color="gray" onClick={onToggleKey} type="button" tabIndex={-1}>
                <iconify-icon icon={showKey ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width="14" />
              </IconButton>
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {integration.id === '9router' && (
          <TextField.Root
            type="text"
            placeholder="Base URL (https://…/v1)"
            value={form.baseUrl}
            onChange={(e) => onFormChange({ baseUrl: e.target.value })}
          />
        )}

        <Flex wrap="wrap" gap="2" mt="1">
          <Button size="1" onClick={onConnect} disabled={busy || !form.apiKey.trim()}>Connect & save</Button>
          <Button size="1" variant="soft" onClick={onTest} disabled={busy || !form.apiKey.trim()}>Test (no save)</Button>
          {integration.connected && (
            <>
              <Button size="1" variant="soft" onClick={onPing} disabled={busy}>Ping</Button>
              <Button size="1" variant="soft" color="red" onClick={onDisconnect} disabled={busy}>Disconnect</Button>
            </>
          )}
        </Flex>
      </Flex>
    </Card>
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
  const [msgs, setMsgs] = useState<Record<string, { kind: 'error' | 'notice'; text: string }>>({})
  const setMsg = useCallback((section: string, kind: 'error' | 'notice', text: string) => {
    setMsgs(p => ({ ...p, [section]: { kind, text } }))
  }, [])

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
      setMsg('engine', 'error', err instanceof Error ? err.message : 'Failed to load config')
    }
  }, [setMsg])

  useEffect(() => { if (state.status === 'authenticated') void load() }, [state.status, load])

  const models = (config?.integrations ?? []).filter(i => i.connected).flatMap(i => i.models)

  const run = async (section: string, fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true)
    try {
      const result = await fn()
      await load()
      const text = okMsg ?? (typeof result === 'string' ? result : undefined)
      if (text) setMsg(section, 'notice', text)
    } catch (err) {
      setMsg(section, 'error', err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-10 pt-10 pb-6" style={{ backgroundColor: '#f8fafc' }}>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#111827', fontFamily: "'Instrument Serif', serif" }}>Configuration</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(0,0,0,0.45)' }}>AI engine and provider settings. Changes apply immediately.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <Tabs.Root defaultValue="providers">
          <Tabs.List mb="5">
            <Tabs.Trigger value="providers">Providers</Tabs.Trigger>
            <Tabs.Trigger value="engine">Engine</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="providers">
            <Flex direction="column" gap="3">
              {(config?.integrations ?? []).map((integration) => (
                <ProviderCard
                  key={integration.id}
                  integration={integration}
                  form={formState[integration.id] ?? { apiKey: '', baseUrl: '' }}
                  msg={msgs[`integ:${integration.id}`]}
                  busy={busy}
                  showKey={!!showKey[integration.id]}
                  onToggleKey={() => toggleKey(integration.id)}
                  onDismissMsg={() => setMsgs(p => omitKey(p, `integ:${integration.id}`))}
                  onFormChange={(patch) => setFormState(p => ({ ...p, [integration.id]: { ...(p[integration.id] ?? { apiKey: '', baseUrl: '' }), ...patch } }))}
                  onConnect={() => run(`integ:${integration.id}`, () => connectProvider(integration.id, formState[integration.id]?.apiKey ?? '', formState[integration.id]?.baseUrl || undefined), 'Connected')}
                  onTest={() => run(`integ:${integration.id}`, () => testProvider(integration.id, formState[integration.id]?.apiKey ?? '', formState[integration.id]?.baseUrl || undefined))}
                  onPing={() => run(`integ:${integration.id}`, async () => { const r = await pingProvider(integration.id); if (!r.ok) throw new Error(r.message || 'Ping failed'); return r.message })}
                  onDisconnect={() => run(`integ:${integration.id}`, () => disconnectProvider(integration.id))}
                />
              ))}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="engine">
            <Card>
              {msgs['engine'] && <Box mb="3"><SectionMsg kind={msgs['engine']!.kind} text={msgs['engine']!.text} onDismiss={() => setMsgs(p => omitKey(p, 'engine'))} /></Box>}
              <Flex direction="column" gap="3">
                {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                  <Flex key={stage} align="center" gap="4">
                    <Box style={{ minWidth: 220 }}>
                      <Text as="div" size="2" weight="medium">{label}</Text>
                      <Text as="div" size="1" color="gray">{stage}</Text>
                    </Box>
                    <Select.Root
                      value={stageValues[stage] ?? ''}
                      onValueChange={(v) => { if (v) setStageValues(p => ({ ...p, [stage]: v })) }}
                      disabled={models.length === 0}
                    >
                      <Select.Trigger placeholder={models.length === 0 ? 'Connect a provider first' : 'Select model'} style={{ flex: 1 }} />
                      <Select.Content>
                        {models.map(m => <Select.Item key={m.id} value={m.id}>{m.id}</Select.Item>)}
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                ))}
              </Flex>
              <Box mt="4">
                <Button onClick={() => run('engine', () => updateAdminEngine(stageValues))} disabled={busy || models.length === 0}>
                  {busy ? 'Saving…' : 'Save engine config'}
                </Button>
              </Box>
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}
