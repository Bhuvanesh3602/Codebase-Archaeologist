import { useRef, useState } from 'react'

interface NewAnalysisCardProps {
  onStart: (formData: FormData) => void
  isLoading: boolean
}

type InputMode = 'upload' | 'url'

export function NewAnalysisCard({ onStart, isLoading }: NewAnalysisCardProps) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleDemo() {
    const fd = new FormData()
    fd.append('demo_mode', 'true')
    onStart(fd)
  }

  function handleRun() {
    const fd = new FormData()
    if (mode === 'upload' && file) {
      fd.append('decision_doc', file)
    } else if (mode === 'url' && url.trim()) {
      fd.append('source_url', url.trim())
      fd.append('demo_mode', 'true') // fallback until URL fetch is implemented
    }
    onStart(fd)
  }

  const canRun = mode === 'upload' ? !!file : !!url.trim()

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">New Analysis</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Upload a strategic document or paste a URL</p>
        </div>
        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm rounded-lg border border-zinc-700 transition-colors font-medium"
        >
          <span className="text-xs">▶</span>
          WeWork Demo
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-zinc-950 rounded-lg p-1 mb-5 w-fit">
        {(['upload', 'url'] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m === 'upload' ? '📄 Document' : '🔗 URL'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-red-500 bg-red-500/5'
              : file
                ? 'border-zinc-700 bg-zinc-800/40'
                : 'border-zinc-700 hover:border-zinc-500'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.md,.txt,.docx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-zinc-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB — ready</p>
            </div>
          ) : (
            <div>
              <p className="text-zinc-500 text-sm">Drop your file here or click to browse</p>
              <p className="text-zinc-700 text-xs mt-1">PDF, Markdown, Word, TXT</p>
            </div>
          )}
        </div>
      ) : (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/strategy-doc"
          className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        />
      )}

      <button
        onClick={handleRun}
        disabled={!canRun || isLoading}
        className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isLoading ? 'Red Team is running...' : 'Run Red Team Analysis'}
      </button>
    </div>
  )
}
