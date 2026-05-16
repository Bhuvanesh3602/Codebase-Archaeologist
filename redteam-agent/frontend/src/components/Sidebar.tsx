import logo from '../../logo.png'
import { DashboardSection, User } from '../types'

interface SidebarProps {
  section: DashboardSection
  onSection: (s: DashboardSection) => void
  user: User
  onLogout: () => void
}

const NAV_ITEMS: { id: DashboardSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '⬡' },
  { id: 'sources', label: 'Data Sources', icon: '⬡' },
  { id: 'agents', label: 'Agents', icon: '⬡' },
  { id: 'history', label: 'History', icon: '⬡' },
]

export function Sidebar({ section, onSection, user, onLogout }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col z-20">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800">
        <img src={logo} alt="Red Team Agent" className="h-32 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              section === item.id
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <NavIcon id={item.id} active={section === item.id} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">Risk Analyst</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-1 px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

function NavIcon({ id, active }: { id: DashboardSection; active: boolean }) {
  const color = active ? 'text-white' : 'text-zinc-500'
  const icons: Record<DashboardSection, string> = {
    overview: '▦',
    sources: '⊞',
    agents: '◈',
    history: '≡',
  }
  return <span className={`text-base leading-none ${color}`}>{icons[id]}</span>
}
