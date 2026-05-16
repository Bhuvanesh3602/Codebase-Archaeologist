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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 shrink-0">
        Q&amp;A — Ask the Red Team
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm italic">
            Ask anything about the report findings...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-900/40 text-blue-100 self-end ml-8'
                : 'bg-gray-800 text-gray-200 mr-8'
            }`}
          >
            {msg.content || <span className="animate-pulse text-gray-500">▋</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="e.g. What should the board have done about governance?"
          className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={!input.trim() || isStreaming}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
