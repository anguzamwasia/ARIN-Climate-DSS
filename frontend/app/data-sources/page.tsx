"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
const KenyaMap = dynamic(() => import("../components/KenyaMapClient"), { ssr: false })
import AfricaMap from "../../components/AfricaMap"
import MediaModal from "../../components/MediaModal"
import { ArrowLeft, FileText, ExternalLink, Globe, Database, Mic, Users, PlayCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

interface Doc {
  id: number
  title: string
  url: string
  file_url: string
  source: string
  country: string
  type: string
  scraped_at: string
  content_text?: string
  body?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const getCategory = (source: string) => {
  if (["KNBS", "KMD", "World Bank"].includes(source)) return "National Reports";
  if (["KOBO"].includes(source)) return "Field Submissions";
  if (["UNFCCC"].includes(source)) return "Regional Data";
  if (["WHISPER"].includes(source)) return "Community Insights";
  return source;
}

const categoryIcons: Record<string, any> = {
  "Regional Data": Globe,
  "National Reports": FileText,
  "Field Submissions": Users,
  "Community Insights": Mic,
}

export default function DataSourcesPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeSource, setActiveSource] = useState<string>(searchParams.get("source") || "ALL")
  const [search, setSearch] = useState("")
  const [selectedMapCounty, setSelectedMapCounty] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Doc | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/documents?limit=1000`)
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = ["National Reports", "Regional Data", "Community Insights", "Field Submissions"];

  const countyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source) === "National Reports" && d.country) {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const globalCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source) === "Regional Data" && d.country && d.country !== "Africa (Global)") {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const filtered = docs.filter((d) => {
    const category = getCategory(d.source)
    const matchesSource = activeSource === "ALL" || category === activeSource
    const matchesSearch = search === "" || d.title?.toLowerCase().includes(search.toLowerCase()) || d.country?.toLowerCase().includes(search.toLowerCase())
    
    // If National Reports is active, ONLY show documents if a county is selected OR it is a national report
    if (activeSource === "National Reports") {
      if (search !== "") {
        return matchesSearch && matchesSource
      }
      if (!selectedMapCounty) {
          // If no county selected, only show national-level reports
          return (!d.country || d.country === "Kenya") && matchesSource
      }
      // If county selected, show county-level reports
      return d.country === selectedMapCounty && matchesSource
    }

    if (activeSource === "Regional Data") {
      if (!selectedMapCounty) {
          return matchesSearch && matchesSource
      }
      return d.country === selectedMapCounty && matchesSearch && matchesSource
    }

    // For ALL or other sources, keep the original filtering behavior
    const matchesCounty = !selectedMapCounty || d.country === selectedMapCounty
    return matchesSource && matchesSearch && matchesCounty
  })

  return (
    <ProtectedRoute>
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
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Database
              const count = docs.filter((d) => getCategory(d.source) === cat).length
              return (
                <button key={cat} onClick={() => setActiveSource(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === cat ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  <Icon className="w-4 h-4" />
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          {activeSource !== "Community Insights" && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or country..."
              className="w-full md:w-96 mb-6 px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}

          {/* Interactive Map Section */}
          {activeSource === "National Reports" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Explore by County</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Dive deep into national climate strategies, localized policies, and evidence-informed data from across Kenya. 
                  Hover over the map to view data availability, and click on any highlighted county to instantly filter the reports below.
                </p>
              </div>
              <div className="col-span-1 lg:col-span-2 z-0">
                <KenyaMap 
                  countyCounts={countyCounts} 
                  selectedCounty={selectedMapCounty} 
                  onSelectCounty={setSelectedMapCounty} 
                />
              </div>
            </div>
          )}

          {activeSource === "Regional Data" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">African Perspective</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Explore global datasets, UNFCCC submissions, and regional frameworks tailored to the African continent.
                  Select a specific country on the map to filter global datasets relevant to that region.
                </p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AfricaMap 
                  countryCounts={globalCounts} 
                  selectedCountry={selectedMapCounty} 
                  onSelectCountry={setSelectedMapCounty} 
                />
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading documents...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground text-sm shadow-sm">
              {activeSource === "National Reports" && !selectedMapCounty && search === ""
                ? "Select a county on the map to view its reports." 
                : "No documents found matching your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <div key={doc.id} className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">
                      {getCategory(doc.source) === "Community Insights" ? doc.type || "Insight" : doc.source}
                    </span>
                    {doc.country && <span className="text-[10px] text-muted-foreground">{doc.country}</span>}
                  </div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-3">{doc.title}</h3>
                  
                  {getCategory(doc.source) === "Community Insights" && (
                     <p className="text-xs text-muted-foreground line-clamp-3 my-2">{doc.body}</p>
                  )}

                  <div className="flex gap-3 mt-auto pt-2">
                    {getCategory(doc.source) === "Community Insights" ? (
                      <button 
                        onClick={() => setSelectedMedia(doc)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" /> View Media
                      </button>
                    ) : (
                      <>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                            <ExternalLink className="w-3 h-3" /> View Source
                          </a>
                        )}
                        {(doc.file_url || doc.url) && (
                          <a href={doc.file_url || doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent hover:underline">
                            <FileText className="w-3 h-3" /> File
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <MediaModal 
            isOpen={!!selectedMedia}
            onClose={() => setSelectedMedia(null)}
            title={selectedMedia?.title || ""}
            mediaUrl={selectedMedia?.file_url ? `${API_URL}/uploads/${selectedMedia.file_url}` : ""}
            transcript={selectedMedia?.content_text || selectedMedia?.body || ""}
            insights={selectedMedia ? ["Discussed climate change impacts on local agriculture.", "Highlighted the need for immediate funding.", "Identified key vulnerable regions in Kenya."] : []}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}
