'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface KpiCardProps {
  icon: LucideIcon
  title: string
  value: number
  suffix?: string
  color?: string
}

export function KpiCard({ icon: Icon, title, value, suffix = '', color = '#14b8a6' }: KpiCardProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 40
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-5 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {count.toLocaleString()}{suffix}
      </div>
    </motion.div>
  )
}
