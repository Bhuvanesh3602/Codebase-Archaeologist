import { useCallback, useRef, useState } from 'react'
import { SSEEvent } from '../types'

interface UseSSEReturn {
  connect: (url: string, formData: FormData) => void
  disconnect: () => void
  isConnected: boolean
  error: string | null
}

export function useSSE(onEvent: (event: SSEEvent) => void): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const disconnect = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsConnected(false)
  }, [])

  const connect = useCallback(
    async (url: string, formData: FormData) => {
      disconnect()
      setError(null)
      setIsConnected(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim()
              if (!raw || raw === '[DONE]') continue
              try {
                const parsed = JSON.parse(raw) as SSEEvent
                onEvent(parsed)
              } catch {
                // malformed SSE line, skip
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
        }
      } finally {
        setIsConnected(false)
      }
    },
    [disconnect, onEvent],
  )

  return { connect, disconnect, isConnected, error }
}
