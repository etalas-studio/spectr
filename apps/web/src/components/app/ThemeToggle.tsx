'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useThemePreference, type ThemePref } from './useAppTheme'

/** Light / Dark / System picker for the Settings pages. */
export function ThemePicker() {
  const { pref, setPref } = useThemePreference()
  return (
    <ToggleGroup value={[pref]} onValueChange={(v) => { if (v[0]) setPref(v[0] as ThemePref) }} aria-label="Theme">
      <ToggleGroupItem value="light" className="gap-2"><Sun className="size-4" /> Light</ToggleGroupItem>
      <ToggleGroupItem value="dark" className="gap-2"><Moon className="size-4" /> Dark</ToggleGroupItem>
      <ToggleGroupItem value="system" className="gap-2"><Monitor className="size-4" /> System</ToggleGroupItem>
    </ToggleGroup>
  )
}
