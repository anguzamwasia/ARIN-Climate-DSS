"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, FileText, ExternalLink, Globe, Database, Mic } from "lucide-react"

interface Doc {
  id: number
  title: string
  url: string
  file_url: string
  source: string
  country: string
  type: string
  scraped_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const sourceConfig: Record<string, { label: string; icon: any; description: string }> = {
  UNFCCC: { label: "UNFCCC Reports", icon: Globe, description: "International policy reports and NDC submissions" },
  KNBS: { label: "KNBS Reports", icon: FileText, description: "Kenya National Bureau of Statistics reports" },
  KMD: { label: "KMD Meteorological Data", icon: Database, description: "Kenya Meteorological Department reports" },
  WHISPER: { label: "Audio/Video Transcripts", icon: Mic, description: "Transcribed community interviews" },
}

export default function DataSourcesPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeSource, setActiveSource] = useState<string>(searchParams.get("source") || "ALL")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch(`${API_URL}/documents?limit=100`)
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  const sources = Array.from(new Set(docs.map((d) => d.source)))

  const filtered = docs.filter((d) => {
    const matchesSource = activeSource === "ALL" || d.source === activeSource
    const matchesSearch = search === "" || d.title?.toLowerCase().includes(search.toLowerCase()) || d.country?.toLowerCase().includes(search.toLowerCase())
    return matchesSource && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-white">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={100} height={32} className="object-contain" style={{ width: "auto", height: "32px" }} />
            <span className="font-semibold hidden sm:inline">Climate DSS</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Data Sources</h1>
          <p className="text-muted-foreground">Browse all documents and field data ingested into the Climate DSS, grouped by source.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveSource("ALL")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === "ALL" ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            All ({docs.length})
          </button>
          {sources.map((src) => {
            const config = sourceConfig[src] || { label: src, icon: Database, description: "" }
            const Icon = config.icon
            const count = docs.filter((d) => d.source === src).length
            return (
              <button key={src} onClick={() => setActiveSource(src)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === src ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                <Icon className="w-4 h-4" />
                {config.label} ({count})
              </button>
            )
          })}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or country..."
          className="w-full md:w-96 mb-6 px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {loading ? (
          <p className="text-muted-foreground">Loading documents...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground text-sm">
            No documents found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <div key={doc.id} className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">{doc.source}</span>
                  {doc.country && <span className="text-[10px] text-muted-foreground">{doc.country}</span>}
                </div>
                <h3 className="font-medium text-sm text-foreground line-clamp-3">{doc.title}</h3>
                <div className="flex gap-3 mt-auto pt-2">
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" /> View Source
                    </a>
                  )}
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent hover:underline">
                      <FileText className="w-3 h-3" /> File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
