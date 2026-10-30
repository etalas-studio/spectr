import { toast } from 'sonner'

// Copies text and tells the user whether it worked; clipboard access can be denied (permissions, insecure context).
export async function copyText(text: string, successTitle = 'Copied to clipboard'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successTitle)
    return true
  } catch {
    toast.error("Couldn't copy", { description: 'Your browser blocked clipboard access.' })
    return false
  }
}
