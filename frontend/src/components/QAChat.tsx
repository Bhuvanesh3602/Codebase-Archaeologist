import { useRef, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function QAChat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  async function send() {
    const question = input.trim()
    if (!question || isStreaming) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setIsStreaming(true)

    let assistantMsg = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch(`${API_BASE}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.delta) {
              assistantMsg += parsed.delta
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: assistantMsg }
                return next
              })
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: `Error: ${(err as Error).message}` }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const SUGGESTIONS = [
    'What should the board have done about governance?',
    'Which finding is most likely to kill the deal?',
    'How does this compare to similar cases?',
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-white">Q&amp;A</span>
        <span className="text-zinc-600 text-sm">—</span>
        <span className="text-sm text-zinc-400">Ask the Red Team</span>
      </div>

      <div className="p-5">
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-zinc-600 text-xs mb-3">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors border border-zinc-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div ref={messagesRef} className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-white ml-8'
                    : 'bg-zinc-950 text-zinc-300 mr-8'
                }`}
              >
                {msg.content || <span className="animate-pulse text-zinc-600">▋</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask anything about the findings..."
            className="flex-1 bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isStreaming ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
