'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #1a2332 100%)' }}>
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
