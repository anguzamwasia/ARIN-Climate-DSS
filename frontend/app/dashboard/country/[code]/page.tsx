'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Radio, Thermometer, Droplets } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCards'
import { ClimateChart } from '@/components/dashboard/ClimateChart'
import { TranscriptReport } from '@/components/dashboard/TranscriptReport'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CountryData {
  code: string
  name: string
  avg_temperature_rise: number
  flood_risk: string
  drought_index: number
  population_affected: number
}

export default function CountryPage() {
  const params = useParams()
  const code = (params?.code as string || '').toUpperCase()
  const [country, setCountry] = useState<CountryData | null>(null)
  const [tempData, setTempData] = useState<any[]>([])
  const [rainData, setRainData] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cRes, tRes, rRes] = await Promise.all([
          fetch(`${API}/analytics/country/${code}`),
          fetch(`${API}/analytics/timeseries?indicator=temperature_anomaly&country=${code}`),
          fetch(`${API}/analytics/timeseries?indicator=rainfall_index&country=${code}`),
        ])
        if (cRes.ok) setCountry(await cRes.json())
        if (tRes.ok) setTempData(await tRes.json())
        if (rRes.ok) setRainData(await rRes.json())

        // Fetch documents for this country
        const dRes = await fetch(`${API}/documents?country=${code}`)
        if (dRes.ok) setDocs(await dRes.json())
      } catch (e) {
        console.error('Failed to load country data:', e)
      } finally {
        setLoading(false)
      }
    }
    if (code) load()
  }, [code])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#14b8a6', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!country) {
    return <div className="text-center py-20" style={{ color: '#94a3b8' }}>Country not found: {code}</div>
  }

  const riskColors: Record<string, string> = { low: '#10b981', medium: '#eab308', high: '#f59e0b', very_high: '#ef4444' }

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-4 no-underline transition-colors" style={{ color: '#94a3b8' }}>
          <ArrowLeft size={14} /> Back to Overview
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">{country.name}</h1>
          <span className="text-xs px-3 py-1 rounded-full font-medium uppercase"
            style={{ background: `${riskColors[country.flood_risk] || '#64748b'}20`, color: riskColors[country.flood_risk] || '#94a3b8' }}>
            {country.flood_risk.replace('_', ' ')} flood risk
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {country.population_affected.toLocaleString()} people affected • Drought index: {country.drought_index.toFixed(2)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Thermometer} title="Avg Temp Rise" value={country.avg_temperature_rise} suffix="°C" color="#ef4444" />
        <KpiCard icon={Droplets} title="Drought Index" value={Math.round(country.drought_index * 100)} suffix="%" color="#f59e0b" />
        <KpiCard icon={FileText} title="Documents" value={docs.length} color="#14b8a6" />
        <KpiCard icon={Radio} title="Pop. Affected" value={Math.round(country.population_affected / 1000)} suffix="K" color="#3b82f6" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClimateChart data={tempData} title="Temperature Anomaly" color="#ef4444" />
        <ClimateChart data={rainData} title="Rainfall Index" color="#3b82f6" />
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div className="rounded-xl p-6 border"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Policy Documents</h3>
          <div className="space-y-3">
            {docs.map((d: any) => (
              <div key={d.id} className="p-3 rounded-lg border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{d.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#14b8a620', color: '#14b8a6' }}>{d.source}</span>
                </div>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94a3b8' }}>{d.content?.substring(0, 150)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
