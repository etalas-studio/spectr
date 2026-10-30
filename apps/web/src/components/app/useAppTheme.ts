import { useEffect } from 'react'
import '../../app/app-theme.css'

// The root <html> is `dark` for the marketing site. While the app shell is mounted we flip to the light app tokens
// (on <html>, so portaled dialogs/menus inherit them) and restore on unmount.
export function useAppTheme() {
  useEffect(() => {
    const el = document.documentElement
    const wasDark = el.classList.contains('dark')
    el.classList.remove('dark')
    el.classList.add('ap-theme')
    return () => {
      el.classList.remove('ap-theme')
      if (wasDark) el.classList.add('dark')
    }
  }, [])
}
