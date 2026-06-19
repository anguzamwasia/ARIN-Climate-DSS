'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, Mic, FileText, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/countries', label: 'Countries', icon: Globe },
  { href: '/dashboard/media', label: 'Media Reports', icon: Mic },
  { href: '/blog', label: 'Blog', icon: FileText },
  { href: '/chatbot', label: 'Chat', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-50 flex flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? 72 : 260,
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(24px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #14b8a6, #10b981)' }}>
          A
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-sm tracking-wide">ARIN Climate</div>
            <div className="text-xs" style={{ color: '#94a3b8' }}>Decision Support System</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
              style={{
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #14b8a6' : '3px solid transparent',
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#14b8a6' : '#64748b' }} />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-4 p-2 rounded-lg text-sm flex items-center justify-center transition-colors cursor-pointer"
        style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
