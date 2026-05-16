import { useRef, useState } from 'react'

interface DocumentUploadProps {
  onStart: (formData: FormData) => void
  isLoading: boolean
}

export function DocumentUpload({ onStart, isLoading }: DocumentUploadProps) {
  const [decisionDoc, setDecisionDoc] = useState<File | null>(null)
  const [internalDocs, setInternalDocs] = useState<File[]>([])
  const decisionRef = useRef<HTMLInputElement>(null)
  const internalRef = useRef<HTMLInputElement>(null)

  function handleDemo() {
    const fd = new FormData()
    fd.append('demo_mode', 'true')
    onStart(fd)
  }

  function handleRun() {
    if (!decisionDoc) return
    const fd = new FormData()
    fd.append('decision_doc', decisionDoc)
    internalDocs.forEach((f) => fd.append('internal_docs', f))
    onStart(fd)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Upload Documents</h2>
        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
        >
          Load WeWork Demo
        </button>
      </div>

      {/* Decision doc */}
      <div
        className="border-2 border-dashed border-gray-600 hover:border-gray-400 rounded-xl p-8 cursor-pointer transition-colors"
        onClick={() => decisionRef.current?.click()}
      >
        <input
          ref={decisionRef}
          type="file"
          accept=".pdf,.md,.txt"
          className="hidden"
          onChange={(e) => setDecisionDoc(e.target.files?.[0] ?? null)}
        />
        <div className="text-center">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-gray-300 font-medium">
            {decisionDoc ? decisionDoc.name : 'Strategic Document'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {decisionDoc ? `${(decisionDoc.size / 1024).toFixed(0)} KB` : 'PDF, Markdown — required'}
          </p>
        </div>
      </div>

      {/* Internal docs */}
      <div
        className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-6 cursor-pointer transition-colors"
        onClick={() => internalRef.current?.click()}
      >
        <input
          ref={internalRef}
          type="file"
          accept=".pdf,.md,.txt"
          multiple
          className="hidden"
          onChange={(e) => setInternalDocs(Array.from(e.target.files ?? []))}
        />
        <div className="text-center">
          <div className="text-2xl mb-1">🗂️</div>
          <p className="text-gray-400 font-medium">Company Context</p>
          <p className="text-gray-600 text-sm mt-1">
            {internalDocs.length > 0
              ? `${internalDocs.length} file(s) selected`
              : 'Internal docs, financials — optional, multi-file'}
          </p>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={!decisionDoc || isLoading}
        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors"
      >
        {isLoading ? 'Running...' : 'Run Red Team'}
      </button>
    </div>
  )
}
