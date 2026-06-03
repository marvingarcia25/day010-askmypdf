import { useState, useEffect } from 'react'
import UploadZone from './components/UploadZone'
import ChatPanel from './components/ChatPanel'

export type Source = { index: number; snippet: string }
export type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[] }

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => { if (d.hasDoc) setFileName(d.fileName) })
      .finally(() => setChecking(false))
  }, [])

  function handleUploaded(name: string) {
    setFileName(name)
    setMessages([])
  }

  function handleReset() {
    setFileName(null)
    setMessages([])
  }

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <span className="font-bold text-slate-900">Ask<span className="text-indigo-600">MyPDF</span></span>
          </div>
          {fileName && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 truncate max-w-[180px]">{fileName}</span>
              <button onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                Change PDF
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {!fileName
          ? <UploadZone onUploaded={handleUploaded} />
          : <ChatPanel messages={messages} setMessages={setMessages} />
        }
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 text-xs text-slate-400 flex justify-between">
          <span>Day 010 · 1000-day challenge</span>
          <span>Voyage AI + Claude + ASP.NET Core</span>
        </div>
      </footer>
    </div>
  )
}
