"use client"
import dynamic from 'next/dynamic'

const MapWithNoSSR = dynamic(() => import('./KenyaMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] border border-border rounded-xl bg-slate-50 overflow-hidden relative shadow-sm flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading interactive map...</p>
    </div>
  )
})

interface KenyaMapProps {
  countyCounts: Record<string, number>
  selectedCounty: string | null
  onSelectCounty: (county: string) => void
}

export default function KenyaMap(props: KenyaMapProps) {
  return <MapWithNoSSR {...props} />
}
