'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ClimateChartProps {
  data: { year: number; value: number; metric: string }[]
  title: string
  color?: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-4 py-2.5 text-sm border shadow-xl"
      style={{ background: 'rgba(10,15,30,0.95)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
      <p className="font-semibold">{label}</p>
      <p style={{ color: '#14b8a6' }}>{payload[0].value.toFixed(2)} {payload[0].payload.metric === 'temperature_anomaly' ? '°C' : 'mm'}</p>
    </div>
  )
}

export function ClimateChart({ data, title, color = '#14b8a6' }: ClimateChartProps) {
  return (
    <div className="rounded-xl p-6 border"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#chartGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
