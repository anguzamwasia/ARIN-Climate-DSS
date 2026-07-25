'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Radio, Clock, Globe } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCards'
import { ClimateChart } from '@/components/dashboard/ClimateChart'
import { AfricaMap } from '@/components/dashboard/AfricaMap'
import { useAuth } from '@/contexts/auth-context'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Overview {
  total_documents: number
  total_media: number
  total_blogs: number
  countries_covered: number
}

interface Country {
  code: string
  name: string
  avg_temperature_rise: number
  flood_risk: string
  drought_index: number
  population_affected: number
}

interface TSPoint {
  year: number
  value: number
  metric: string
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [timeseries, setTimeseries] = useState<TSPoint[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [userBlogs, setUserBlogs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [ovRes, tsRes] = await Promise.all([
          fetch(`${API}/analytics/overview`),
          fetch(`${API}/analytics/timeseries?indicator=temperature_anomaly`),
        ])
        if (ovRes.ok) setOverview(await ovRes.json())
        if (tsRes.ok) setTimeseries(await tsRes.json())

        // Load user blogs if logged in
        if (user?.email) {
          try {
            const blogRes = await fetch(`${API}/blogs`)
            if (blogRes.ok) {
              const data = await blogRes.json()
              setUserBlogs(data.filter((b: any) => b.author_email === user.email))
            }
          } catch (err) {}
        }

        // Load all countries from known codes
        const codes = ['KE','TZ','UG','ET','NG','GH','ZA','EG','SD','SS','CD','MZ','MW','ZM','ZW','SN','ML','NE','BF','TD','SO','CM','RW','MA','TN','DZ','AO','MG']
        const countryResults: Country[] = []
        for (const code of codes) {
          try {
            const r = await fetch(`${API}/analytics/country/${code}`)
            if (r.ok) countryResults.push(await r.json())
          } catch {}
        }
        setCountries(countryResults)
      } catch (e) {
        console.error('Failed to load dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#14b8a6', borderTopColor: 'transparent' }} />
          <p style={{ color: '#94a3b8' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Africa Climate Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Real-time overview of climate data across the African continent
        </p>
      </div>

      {/* Logged-In User Contribution Stats */}
      {user && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">Welcome back, {user.name}!</h2>
            <p className="text-xs text-slate-400 mt-1">Track the status of your research and community story drafts.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-center flex-1 sm:flex-none min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">My Submissions</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{userBlogs.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-center flex-1 sm:flex-none min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Awaiting Review</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{userBlogs.filter(b => b.status === 'pending').length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-center flex-1 sm:flex-none min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">Approved / Live</span>
              <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{userBlogs.filter(b => b.status === 'approved').length}</span>
            </div>
            {userBlogs.filter(b => b.status === 'rejected').length > 0 && (
              <Link href="/blog/submit" className="flex-1 sm:flex-none">
                <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-4 py-2.5 text-center min-w-[120px] cursor-pointer hover:bg-red-950/60 transition-colors animate-pulse">
                  <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">Needs Revision ⚠️</span>
                  <span className="text-2xl font-extrabold text-red-400 mt-1 block">{userBlogs.filter(b => b.status === 'rejected').length}</span>
                </div>
              </Link>
            )}
          </div>
          <div className="w-full lg:w-auto">
            <Link href="/blog/submit">
              <button className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Submit New Draft
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FileText} title="Documents Ingested" value={overview?.total_documents || 0} color="#14b8a6" />
        <KpiCard icon={Radio} title="Field Submissions" value={overview?.total_media || 0} color="#10b981" />
        <KpiCard icon={Clock} title="Blog Posts" value={overview?.total_blogs || 0} color="#f59e0b" />
        <KpiCard icon={Globe} title="Countries Tracked" value={overview?.countries_covered || 28} color="#3b82f6" />
      </div>

      {/* Map + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AfricaMap countries={countries} />
        <ClimateChart data={timeseries} title="Temperature Anomaly (2015–2025)" color="#14b8a6" />
      </div>
    </div>
  )
}
