import { useState, useRef, useEffect, FormEvent } from 'react'
import type { Message } from '../App'

interface Props {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

export default function ChatPanel({ messages, setMessages }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!question.trim() || loading) return

    const q = question.trim()
    setQuestion('')
    setError(null)
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setMessages(m => [...m, { role: 'assistant', content: data.answer, sources: data.sources }])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Messages */}
      <div className="flex flex-col gap-4 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium text-slate-600">Document ready — ask anything</p>
            <p className="text-sm mt-1">Try "Summarise this document" or "What are the key points?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm'
              : 'flex flex-col gap-2'}`}>
              {msg.role === 'assistant' ? (
                <>
                  <div className="card px-4 py-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <details className="text-xs">
                      <summary className="text-slate-400 cursor-pointer hover:text-slate-600 select-none px-1">
                        {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} used
                      </summary>
                      <div className="mt-2 flex flex-col gap-2">
                        {msg.sources.map(s => (
                          <div key={s.index} className="card px-3 py-2 text-slate-500 font-mono leading-relaxed">
                            <span className="text-indigo-400 font-sans font-semibold not-italic">#{s.index + 1} </span>
                            {s.snippet}…
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
        className="sticky bottom-0 bg-slate-50 pt-3 pb-2 flex gap-2">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about your document…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button type="submit" disabled={loading || !question.trim()}
          className="px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 transition-opacity">
          Ask
        </button>
      </form>
    </div>
  )
}
