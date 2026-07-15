"use client"

import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'

interface Doc {
  id: number
  title: string
  url: string
  file_url: string | null
  source: string
  country: string
  type: string
}

export function AnalyticsDashboard({ documents }: { documents: Doc[] }) {
  const { sourceData, countryData } = useMemo(() => {
    const sourceCount: Record<string, number> = {}
    const countryCount: Record<string, number> = {}

    documents.forEach(doc => {
      // Source mapping logic
      let src = "Others"
      if (["KOBO"].includes(doc.source)) src = "Field Submissions"
      else if (["UNFCCC"].includes(doc.source)) src = "Regional Data"
      else if (["WHISPER"].includes(doc.source)) src = "Community Insights"
      else if (doc.source === "World Bank") {
        if (doc.country && doc.country !== "Kenya" && !doc.country.endsWith("County")) src = "Regional Data"
        else src = "National Reports"
      }
      else if (["KNBS", "KMD"].includes(doc.source)) src = "National Reports"
      else if (doc.source === "ARIN") src = "Others"
      else src = doc.source

      // Standardize "Others"
      if (!["Field Submissions", "Regional Data", "Community Insights", "National Reports"].includes(src)) {
        src = "Others"
      }

      sourceCount[src] = (sourceCount[src] || 0) + 1

      // Country logic
      if (doc.country && doc.country.trim() !== "" && doc.country !== "Unknown" && doc.country !== "None") {
        countryCount[doc.country] = (countryCount[doc.country] || 0) + 1
      }
    })

    const sourceData = Object.entries(sourceCount)
      .filter(([name]) => name !== "Field Submissions") // filter out Kobo as requested
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const countryData = Object.entries(countryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10

    return { sourceData, countryData }
  }, [documents])

  const COLORS = ['#021d49', '#2563eb', '#60a5fa', '#bfdbfe', '#f1f5f9']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Source Distribution */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-primary mb-6">Document Source Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-primary mb-6">Top 10 Countries by Document Volume</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={countryData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={80} tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#021d49" radius={[0, 4, 4, 0]} name="Documents" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
