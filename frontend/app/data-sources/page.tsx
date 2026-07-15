"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
const KenyaMap = dynamic(() => import("../components/KenyaMapClient"), { ssr: false })
import AfricaMap from "../../components/AfricaMap"
import MediaModal from "../../components/MediaModal"
import { ArrowLeft, FileText, ExternalLink, Globe, Database, Mic, Users, PlayCircle, MapPin, ArrowDown } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Suspense } from "react"
import { AnalyticsDashboard } from "./AnalyticsDashboard"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

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

const getCategory = (source: string, country?: string) => {
  if (["KOBO"].includes(source)) return "Field Submissions";
  if (["UNFCCC"].includes(source)) return "Regional Data";
  if (["WHISPER"].includes(source)) return "Community Insights";
  if (source === "World Bank") {
    if (country && country !== "Kenya" && !country.endsWith("County")) return "Regional Data";
    return "National Reports";
  }
  if (["KNBS", "KMD"].includes(source)) return "National Reports";
  if (source === "ARIN") return "Others";
  return source;
}

const categoryIcons: Record<string, any> = {
  "Regional Data": Globe,
  "National Reports": FileText,
  "Field Submissions": Users,
  "Community Insights": Mic,
  "Others": FileText,
}

function DataSourcesContent() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeSource, setActiveSource] = useState<string>(searchParams.get("source") || "ALL")
  const [search, setSearch] = useState("")
  const [selectedMapCounty, setSelectedMapCounty] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Doc | null>(null)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/documents?limit=10000`)
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = ["National Reports", "Regional Data", "Community Insights", "Field Submissions", "Others"];

  const countyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source, d.country) === "National Reports" && d.country) {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const globalCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    docs.forEach(d => {
      if (getCategory(d.source, d.country) === "Regional Data" && d.country && d.country !== "Africa (Global)") {
        counts[d.country] = (counts[d.country] || 0) + 1
      }
    })
    return counts
  }, [docs])

  const filtered = docs.filter((d) => {
    const category = getCategory(d.source, d.country)
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
      if (search !== "") {
          return matchesSearch && matchesSource
      }
      if (!selectedMapCounty) {
          return false
      }
      return d.country === selectedMapCounty && matchesSource
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
              const count = docs.filter((d) => getCategory(d.source, d.country) === cat).length
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
              placeholder={activeSource === "National Reports" ? "Search by title or county..." : "Search by title or country..."}
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
                  onSelectCounty={(county) => {
                    setSelectedMapCounty(county);
                    if (county && countyCounts[county] > 0) {
                      setIsInfographicOpen(true);
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {activeSource === "Regional Data" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">African Perspective</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Explore global datasets, multilateral institution reports, and regional frameworks tailored to the African continent.
                  Select a specific country on the map to filter global datasets relevant to that region.
                </p>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AfricaMap 
                  countryCounts={globalCounts} 
                  selectedCountry={selectedMapCounty} 
                  onSelectCountry={(country) => {
                    setSelectedMapCounty(country);
                    if (country && globalCounts[country] > 0) {
                      setIsInfographicOpen(true);
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading documents...</p>
          ) : activeSource === "ALL" && search === "" ? (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Climate Data Overview</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                The Climate DSS automatically ingests, processes, and synthesizes climate policy data from multiple sources. It currently tracks <strong>{docs.length}</strong> documents across Africa.
                Select a specific category above to explore individual documents and datasets.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">National Reports</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Policy documents, county-level frameworks, and localized strategies tailored to Kenyan counties.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Regional Data</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Continental datasets, multilateral institution reports, and regional frameworks addressing cross-border climate challenges.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Community Insights</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">AI-transcribed audio interviews capturing qualitative feedback and local community vulnerabilities from the field.</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Field Submissions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Structured surveys and observational data points automatically synchronized from KoboCollect forms.</p>
                </div>
              </div>
              <AnalyticsDashboard documents={docs} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground text-sm shadow-sm">
              {activeSource === "National Reports" && !selectedMapCounty && search === ""
                ? "Select a county on the map to view its reports." 
                : activeSource === "Regional Data" && !selectedMapCounty && search === ""
                ? "Select a country on the map to view its reports."
                : "No documents found matching your search."}
            </div>
          ) : (
            <div id="reports-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
              {filtered.map((doc) => (
                <div key={doc.id} className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">
                      {getCategory(doc.source, doc.country) === "Community Insights" ? doc.type || "Insight" : doc.source}
                    </span>
                    {doc.country && <span className="text-[10px] text-muted-foreground">{doc.country}</span>}
                  </div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-3">{doc.title}</h3>
                  
                  {getCategory(doc.source, doc.country) === "Community Insights" && (
                     <p className="text-xs text-muted-foreground line-clamp-3 my-2">{doc.body}</p>
                  )}

                  <div className="flex gap-3 mt-auto pt-2">
                    {getCategory(doc.source, doc.country) === "Community Insights" ? (
                      <button 
                        onClick={() => setSelectedMedia(doc)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" /> View Media
                      </button>
                    ) : (
                      <>
                        {doc.url && doc.source !== "ARIN" && doc.url !== "#" && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                            <ExternalLink className="w-3 h-3" /> View Source
                          </a>
                        )}
                        {(doc.file_url || doc.url) && (
                          <a 
                            href={doc.source === "ARIN" && doc.file_url ? `${API_URL}/uploads/documents/${doc.file_url}` : (doc.file_url || doc.url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent hover:underline"
                          >
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

          <Dialog open={isInfographicOpen} onOpenChange={setIsInfographicOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl text-center">{selectedMapCounty}</DialogTitle>
                <DialogDescription className="text-base pt-2 text-center">
                  This {activeSource === "National Reports" ? "county" : "country"} currently has <strong className="text-foreground">{activeSource === "National Reports" ? (countyCounts[selectedMapCounty || ""] || 0) : (globalCounts[selectedMapCounty || ""] || 0)} reports</strong> available in the decision support system.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsInfographicOpen(false);
                    setTimeout(() => {
                      document.getElementById('reports-grid')?.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  View Reports <ArrowDown className="ml-2 w-4 h-4" />
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function DataSourcesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading data sources...</p>
      </div>
    }>
      <DataSourcesContent />
    </Suspense>
  )
}
