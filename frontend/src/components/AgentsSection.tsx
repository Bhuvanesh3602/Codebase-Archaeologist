import { useState } from 'react'
import { Agent } from '../types'

interface AgentsSectionProps {
  agents: Agent[]
  onToggle: (id: string) => void
  onAdd: (agent: Omit<Agent, 'id' | 'isBuiltIn'>) => void
}

export function AgentsSection({ agents, onToggle, onAdd }: AgentsSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Agents</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Configure which adversarial agents attack your documents.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+</span>
          Add Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={() => onToggle(agent.id)} />
        ))}
      </div>

      {showModal && (
        <AddAgentModal
          onClose={() => setShowModal(false)}
          onSave={(agent) => {
            onAdd(agent)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function AgentCard({ agent, onToggle }: { agent: Agent; onToggle: () => void }) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 transition-all ${
      agent.enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5">{agent.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-medium text-sm">{agent.name}</p>
            {agent.isBuiltIn && (
              <span className="text-zinc-600 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">Built-in</span>
            )}
          </div>
          <p className={`text-xs font-medium mb-1 ${agent.color}`}>{agent.role}</p>
          <p className="text-zinc-500 text-xs leading-relaxed">{agent.description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
            agent.enabled ? 'bg-red-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              agent.enabled ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>
    </div>
  )
}

interface NewAgentForm {
  name: string
  role: string
  description: string
  icon: string
  enabled: boolean
  color: string
}

function AddAgentModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (agent: Omit<Agent, 'id' | 'isBuiltIn'>) => void
}) {
  const [form, setForm] = useState<NewAgentForm>({
    name: '',
    role: '',
    description: '',
    icon: '🤖',
    enabled: true,
    color: 'text-blue-400',
  })

  const [prompt, setPrompt] = useState('')

  function handleSave() {
    if (!form.name.trim()) return
    onSave({ ...form })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-semibold">Add Custom Agent</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Agent Name</label>
              <input
                type="text"
                placeholder="e.g. Risk Officer"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Role Label</label>
              <input
                type="text"
                placeholder="e.g. Regulatory Skeptic"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs mb-1.5 block">Description</label>
            <input
              type="text"
              placeholder="What does this agent attack?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs mb-1.5 block">System Prompt</label>
            <textarea
              rows={5}
              placeholder="You are a... Your goal is to find... RULES: ..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg">
            <span className="text-amber-400 text-sm">⚠</span>
            <p className="text-zinc-500 text-xs">Custom agents are in preview. Prompt engineering affects output quality.</p>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Agent
          </button>
        </div>
      </div>
    </div>
  )
}
