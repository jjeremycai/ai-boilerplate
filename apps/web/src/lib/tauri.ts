import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

// Check if running in Tauri
export const isTauri = () => '__TAURI__' in window

// Platform detection
export const getPlatform = async () => {
  if (!isTauri()) return 'web'
  
  const { platform } = await import('@tauri-apps/plugin-os')
  return platform()
}

// Tauri-specific utilities
export const tauriUtils = {
  // Invoke Rust commands
  invoke,
  
  // Open external links
  openExternal: async (url: string) => {
    if (isTauri()) {
      await open(url)
    } else {
      window.open(url, '_blank')
    }
  },
  
  // Notifications
  notify: async (title: string, body?: string) => {
    if (isTauri()) {
      await sendNotification({ title, body })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  },
  
  // Clipboard
  clipboard: {
    write: async (text: string) => {
      if (isTauri()) {
        await writeText(text)
      } else {
        await navigator.clipboard.writeText(text)
      }
    },
    read: async () => {
      if (isTauri()) {
        return await readText()
      } else {
        return await navigator.clipboard.readText()
      }
    }
  }
}

// Handle OAuth callbacks on mobile
if (isTauri()) {
  import('@tauri-apps/api/event').then(({ listen }) => {
    listen('oauth-callback', (event) => {
      // Handle OAuth callback
      const url = event.payload as string
      if (url.includes('clerk')) {
        // Process Clerk OAuth callback
        window.location.href = url
      }
    })
  })
}