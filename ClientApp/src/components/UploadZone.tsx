import { useState, useRef, DragEvent } from 'react'

interface Props {
  onUploaded: (fileName: string) => void
}

export default function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return }
      onUploaded(data.fileName)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Ask your PDF anything</h1>
        <p className="text-slate-500 text-sm max-w-sm">
          Upload a PDF — your CV, a contract, a research paper — and ask questions about it in plain English.
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="w-full max-w-md border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all"
        style={{
          borderColor: dragging ? '#6366F1' : '#CBD5E1',
          background: dragging ? '#EEF2FF' : '#FAFAFA',
        }}>
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">
          📄
        </div>
        {uploading ? (
          <>
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Processing your PDF…</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-slate-700 text-sm">Drop your PDF here</p>
            <p className="text-xs text-slate-400">or click to browse · max 20 MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="flex gap-5 text-xs text-slate-400">
        {['RAG-powered retrieval', 'Voyage AI embeddings', 'Claude answers'].map(t => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />{t}
          </span>
        ))}
      </div>
    </div>
  )
}
