'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Country {
  code: string
  name: string
  avg_temperature_rise: number
  flood_risk: string
  drought_index: number
}

const REGIONS: Record<string, string[]> = {
  'East Africa': ['KE', 'TZ', 'UG', 'ET', 'RW', 'SS', 'SO'],
  'West Africa': ['NG', 'GH', 'SN', 'ML', 'NE', 'BF', 'CM', 'TD'],
  'Southern Africa': ['ZA', 'MZ', 'MW', 'ZM', 'ZW', 'AO', 'MG'],
  'North Africa': ['EG', 'MA', 'TN', 'DZ', 'SD'],
  'Central Africa': ['CD'],
}

function getColor(index: number): string {
  if (index >= 0.8) return '#ef4444'
  if (index >= 0.6) return '#f59e0b'
  if (index >= 0.4) return '#eab308'
  return '#10b981'
}

function getRiskBadge(risk: string) {
  const colors: Record<string, string> = {
    low: '#10b981', medium: '#eab308', high: '#f59e0b', very_high: '#ef4444',
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase"
      style={{ background: `${colors[risk] || '#64748b'}20`, color: colors[risk] || '#64748b' }}>
      {risk.replace('_', ' ')}
    </span>
  )
}

export function AfricaMap({ countries }: { countries: Country[] }) {
  const countryMap = Object.fromEntries(countries.map(c => [c.code, c]))

  return (
    <div className="rounded-xl p-6 border"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <h3 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">
        Climate Vulnerability by Region
      </h3>
      <div className="space-y-6">
        {Object.entries(REGIONS).map(([region, codes]) => (
          <div key={region}>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>{region}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {codes.map((code) => {
                const c = countryMap[code]
                if (!c) return null
                return (
                  <Link key={code} href={`/dashboard/country/${code}`} className="no-underline">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="rounded-lg p-3 border cursor-pointer transition-all"
                      style={{
                        background: `${getColor(c.drought_index)}10`,
                        borderColor: `${getColor(c.drought_index)}30`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-xs font-semibold">{c.name}</span>
                        <span className="text-[10px] font-mono" style={{ color: getColor(c.drought_index) }}>
                          {c.drought_index.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRiskBadge(c.flood_risk)}
                        <span className="text-[10px]" style={{ color: '#64748b' }}>+{c.avg_temperature_rise}°C</span>
                      </div>
                      {/* Mini bar */}
                      <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${c.drought_index * 100}%`,
                          background: `linear-gradient(90deg, #10b981, ${getColor(c.drought_index)})`,
                        }} />
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
