"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
const KenyaMap = dynamic(() => import("../components/KenyaMapClient"), { ssr: false })
import AfricaMap from "../../components/AfricaMap"
import MediaModal from "../../components/MediaModal"
import { ArrowLeft, FileText, ExternalLink, Globe, Database, Mic, Users, PlayCircle, MapPin, ArrowDown, Loader2, Lock } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Suspense } from "react"
import { AnalyticsDashboard } from "./AnalyticsDashboard"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
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

const isCounty = (country?: string) => {
  if (!country) return false;
  const normalized = country.toLowerCase().trim();
  if (normalized === "kenya" || normalized === "africa" || normalized === "africa (global)") return false;
  
  const africanCountries = [
    "algeria", "angola", "benin", "botswana", "burkina faso", "burundi", "cabo verde", "cameroon", 
    "central african republic", "chad", "comoros", "congo", "cote d'ivoire", "djibouti", "egypt", 
    "equatorial guinea", "eritrea", "eswatini", "ethiopia", "gabon", "gambia", "ghana", "guinea", 
    "guinea-bissau", "kenya", "lesotho", "liberia", "libya", "madagascar", "malawi", "mali", 
    "mauritania", "mauritius", "morocco", "mozambique", "namibia", "niger", "nigeria", "rwanda", 
    "sao tome and principe", "senegal", "seychelles", "sierra leone", "somalia", "south africa", 
    "south sudan", "sudan", "tanzania", "togo", "tunisia", "uganda", "zambia", "zimbabwe"
  ];
  if (africanCountries.includes(normalized)) return false;
  return true;
}

interface MediaMetadata {
  title: string;
  summary: string;
  insights: string[];
}

function getMediaMetadata(filename: string, body: string): MediaMetadata {
  const nameLower = filename.toLowerCase();
  
  if (nameLower.includes("kii rw")) {
    return {
      title: "Key Informant Interview (Rwanda)",
      summary: "This key informant interview details the comprehensive process of formulating, validating, and implementing the County Integrated Development Plan (CIDP) in Rwanda. The discussion covers the methodology used to integrate localized climate information into strategic policy frameworks, highlighting the critical role played by multi-stakeholder participation.\n\nKey points focused on mapping agricultural vulnerability, addressing immediate budget allocation concerns for rural counties, and introducing sustainable development targets. Participants emphasized that aligning local plans with national climate adaptation strategies is key to ensuring long-term resilience and securing international climate finance.",
      insights: [
        "Discussed local government planning methodologies in Rwanda.",
        "Identified opportunities to embed climate mitigation strategies directly into CIDPs.",
        "Emphasized data-driven policy integration at county level."
      ]
    };
  }
  if (nameLower.includes("feedback_policyss_21oct2020") || nameLower.includes("sdg activity")) {
    return {
      title: "SDG Activity Feedback Policy Session (Oct 2020)",
      summary: "This policy session evaluates SDG activity feedback across various county administrations in Kenya. The panel analyzed positive and negative interactions occurring during project implementations, highlighting the success of localized water access initiatives and the challenges of solid waste management.\n\nDiscussions centered on developing actionable indicators for tracking progress on sustainable consumption, climate actions, and land management. The participants recommended closer cooperation between the national ministry and county departments to resolve overlapping regulatory mandates and streamline reporting frameworks.",
      insights: [
        "Analyzed positive and negative feedback regarding SDG goals in Kenyan county administrations.",
        "Identified key implementation bottlenecks in national sustainability programs.",
        "Highlighted local community engagement strategies for long-term project viability."
      ]
    };
  }
  if (nameLower.includes("public engagement session_24nov2020") || nameLower.includes("public engagement")) {
    return {
      title: "Public Engagement and Research Session (Nov 2020)",
      summary: "This session, led by Dr. Steve Dawney, introduces effective strategies for public engagement and research dissemination at the University of Southampton. The presentation emphasizes the transition from academic publications to public-facing dialogues, outlining tools to translate complex climate modeling data into understandable language for local communities.\n\nFurther discussions highlighted building trust with civic leaders, measuring the long-term impact of community-led advocacy programs, and integrating public feedback loops back into active research methodologies.",
      insights: [
        "Outlined University of Southampton's research frameworks for public communication.",
        "Presented effective strategies for stakeholder management in climate research.",
        "Emphasized bridging academic findings with local public understanding."
      ]
    };
  }
  if (nameLower.includes("policy brief session_30sept2020") || nameLower.includes("policy brief")) {
    return {
      title: "Policy Briefing and Development Session (Sept 2020)",
      summary: "This training session details the preparation and structure of policy briefs designed for decision-makers in climate policy. Participants explored transitioning academic research into concise briefs, detailing executive summaries, policy recommendations, and visual data callouts.\n\nThe session concluded with peer reviews of brief drafts, identifying common pitfalls such as excessive jargon, lack of clear resource requirements, and failing to define a clear theory of change.",
      insights: [
        "Reviewed key components and structure of effective policy briefs.",
        "Discussed challenges faced by early-career researchers during transition periods.",
        "Exemplified translating complex environmental data into clear policy points."
      ]
    };
  }
  
  // Fallback cleanup
  let cleanTitle = filename.replace(/^Transcript:\s*/i, '').replace(/\.(mp4|mp3|wav|avi)$/i, '').replace(/_/g, ' ');
  cleanTitle = cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: cleanTitle,
    summary: body || "Summary of findings and discussions in this session.",
    insights: [
      "Key topics include climate change policy and regional feedback.",
      "Identified opportunities for localized adaptation frameworks.",
      "Emphasized collaborative data collection across sectors."
    ]
  };
}

const getCategory = (source: string, country?: string) => {
  if (["KOBO"].includes(source)) return "Field Submissions";
  if (["WHISPER"].includes(source)) return "Community Insights";
  if (source === "ARIN") return "Others";

  if (isCounty(country)) {
    return "National Reports";
  }
  return "Regional Data";
}

const categoryIcons: Record<string, any> = {
  "Regional Data": Globe,
  "National Reports": FileText,
  "Field Submissions": Users,
  "Community Insights": Mic,
  "Others": FileText,
}

function getRespondentName(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const lower = line.trim().toLowerCase();
    if (lower.startsWith('name:') || 
        lower.startsWith('respondent_name:') || 
        lower.startsWith('respondent:') || 
        lower.startsWith('username:') ||
        lower.startsWith('responder:')) {
      const val = line.substring(line.indexOf(':') + 1).trim();
      if (val) return val;
    }
  }
  return "Anonymous Respondent";
}

function DataSourcesContent() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [activeSource, setActiveSource] = useState<string>(searchParams.get("source") || "ALL")
  const [search, setSearch] = useState("")
  const [selectedMapCounty, setSelectedMapCounty] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Doc | null>(null)
  const [selectedKoboDoc, setSelectedKoboDoc] = useState<Doc | null>(null)
  const [selectedKoboSubIdx, setSelectedKoboSubIdx] = useState<number>(0)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch(`${API_URL}/documents?limit=10000`)
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  const isAdmin = mounted && user?.email === "admin@arin-africa.org"

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

  const processedDocs = useMemo(() => {
    const nonKoboDocs = docs.filter(d => d.source !== "KOBO");
    const koboDocs = docs.filter(d => d.source === "KOBO");

    const koboGroups = new Map<string, Doc[]>();
    koboDocs.forEach(doc => {
      const formName = doc.title.replace(/\s*\(Field Submission\)$/i, '');
      if (!koboGroups.has(formName)) {
        koboGroups.set(formName, []);
      }
      koboGroups.get(formName)!.push(doc);
    });

    const groupedKoboDocs = Array.from(koboGroups.entries()).map(([formName, submissions], idx) => {
      const countries = Array.from(new Set(submissions.map(s => s.country).filter(Boolean)));
      const countryStr = countries.join(", ") || "Kenya";
      const totalResponses = submissions.length;

      return {
        id: `kobo-group-${idx}`,
        title: `${formName} Study`,
        formName: formName,
        url: submissions[0]?.url || "#",
        file_url: "",
        source: "KOBO",
        country: countryStr,
        type: "Grouped Survey",
        scraped_at: submissions[0]?.scraped_at || new Date().toISOString(),
        body: `Consolidated questionnaire form '${formName}' containing ${totalResponses} field responses from study participants.`,
        content_text: "",
        submissions: submissions,
        isGroupedKobo: true
      } as any;
    });

    return [...nonKoboDocs, ...groupedKoboDocs];
  }, [docs]);

  const filtered = processedDocs.filter((d) => {
    const category = getCategory(d.source, d.country)
    const matchesSource = activeSource === "ALL" || category === activeSource
    const matchesSearch = search === "" || d.title?.toLowerCase().includes(search.toLowerCase()) || d.country?.toLowerCase().includes(search.toLowerCase())
    
    // If National Reports is active, ONLY show documents if a county is selected
    if (activeSource === "National Reports") {
      if (!selectedMapCounty) {
          return false;
      }
      // If county selected, show county-level reports
      return d.country === selectedMapCounty && matchesSource;
    }

    if (activeSource === "Regional Data") {
      if (!selectedMapCounty) {
          return false;
      }
      return d.country === selectedMapCounty && matchesSource;
    }

    // For ALL or other sources, keep the original filtering behavior
    const matchesCounty = !selectedMapCounty || d.country?.includes(selectedMapCounty) || selectedMapCounty.includes(d.country)
    return matchesSource && matchesSearch && matchesCounty
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16"></div>

        <main className="container mx-auto px-4 lg:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Data Sources</h1>
            <p className="text-muted-foreground">The main data sources in this DSS include National Reports, Regional Data (NDCs, UNFCCC Reports, World Bank Reports), Community Generated Insights, Field Collected data and Data ingested by the ARIN admin.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveSource("ALL")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === "ALL" ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              All ({processedDocs.length})
            </button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Database
              const count = processedDocs.filter((d) => getCategory(d.source, d.country) === cat).length
              return (
                <button key={cat} onClick={() => setActiveSource(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSource === cat ? "bg-accent text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  <Icon className="w-4 h-4" />
                  {cat} ({count})
                </button>
              )
            })}
          </div>

          {/* Interactive Map Section */}
          {activeSource === "National Reports" && (
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Explore Localized County Reports</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Delve into localized climate policy frameworks, County Integrated Development Plans (CIDPs), county-level environmental assessments, and targeted adaptation strategies across Kenya. By organizing data at the county level, this module bridges the gap between high-level national policy agendas and actual grassroots implementation, allowing county-level policy officers and community coordinators to access localized research relevant to their specific administrative zones.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  <strong>Interactive Guidance:</strong> Hover over counties to see report densities, and click on any highlighted county on the map of Kenya to instantly load all associated local policy documentation and localized climate research below.
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
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="col-span-1">
                <h2 className="text-2xl font-semibold text-foreground mb-4">African Perspective & Regional Datasets</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Explore regional policy frameworks, Nationally Determined Contributions (NDCs), UNFCCC national communication reports, and multilateral climate assessments gathered from global repositories (such as the World Bank and UNFCCC portals) mapped directly to their respective sovereign nations. This interface enables researchers and policy experts to evaluate cross-border environmental adaptation strategies, compare transboundary carbon commitments, and query continental-scale climate action policies.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  <strong>Interactive Guidance:</strong> Click on any highlighted country on the African map to instantly filter and review the active policy documents, climate targets, and international reports registered for that specific nation.
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
            <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-2xl shadow-sm">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-3 font-semibold">Loading data sources...</p>
            </div>
          ) : activeSource === "ALL" && search === "" ? (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Climate Data Overview</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                This platform serves as a centralized, evidence-informed knowledge hub designed to bridge the gap between climate research, local community experiences, and actionable policy decisions across Africa. By leveraging advanced AI-driven data synthesis and interactive geographic mapping, the Climate DSS provides researchers, government agencies, and policy analysts with real-time access to key environmental intelligence. The system currently tracks <strong>{docs.length}</strong> records, providing a comprehensive repository of qualitative community insights, structured surveys, national frameworks, and regional policy reports to guide climate adaptation strategies. Use the category filters above to explore our integrated datasets or query the interactive maps directly to find localized research.
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
                      {doc.source === "KOBO" ? doc.type || "Field Data" : getCategory(doc.source, doc.country) === "Community Insights" ? doc.type || "Insight" : doc.source}
                    </span>
                    {doc.country && <span className="text-[10px] text-muted-foreground">{doc.country}</span>}
                  </div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-3">
                    {getCategory(doc.source, doc.country) === "Community Insights" ? getMediaMetadata(doc.title, doc.body || "").title : doc.title}
                  </h3>
                  
                  {(getCategory(doc.source, doc.country) === "Community Insights" || doc.source === "KOBO") && doc.body && (
                     <p className="text-xs text-muted-foreground line-clamp-3 my-2">{doc.body}</p>
                  )}

                  <div className="flex gap-3 mt-auto pt-2">
                    {doc.source === "KOBO" ? (
                      <button 
                        onClick={() => { setSelectedKoboDoc(doc); setSelectedKoboSubIdx(0); }}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <FileText className="w-4 h-4" /> {isAdmin ? "View Field Data Group" : "Check More Info"}
                      </button>
                    ) : getCategory(doc.source, doc.country) === "Community Insights" ? (
                      <button 
                        onClick={() => setSelectedMedia(doc)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" /> {isAdmin ? "View Media" : "Check More Info"}
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
            title={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").title : ""}
            mediaUrl={selectedMedia?.file_url ? `${API_URL}/uploads/${selectedMedia.file_url}` : ""}
            transcript={selectedMedia?.content_text || selectedMedia?.body || ""}
            insights={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").insights : []}
            summary={selectedMedia ? getMediaMetadata(selectedMedia.title, selectedMedia.body || "").summary : ""}
            isAdmin={isAdmin}
          />

          {/* Kobo Detail Modal */}
          <Dialog open={!!selectedKoboDoc} onOpenChange={(open) => !open && setSelectedKoboDoc(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
              <DialogHeader className="border-b p-6 bg-slate-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent" />
                  <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    {selectedKoboDoc?.isGroupedKobo ? `${selectedKoboDoc.formName} Study` : selectedKoboDoc?.title}
                  </DialogTitle>
                  {selectedKoboDoc?.isGroupedKobo && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 uppercase">Grouped Form</span>
                  )}
                  {isAdmin && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">Admin View</span>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground pt-1">
                  {selectedKoboDoc?.isGroupedKobo 
                    ? `Consolidated study with ${selectedKoboDoc.submissions?.length || 0} total submissions`
                    : `Submitted from: ${selectedKoboDoc?.country} • Synced on: ${selectedKoboDoc && new Date(selectedKoboDoc.scraped_at).toLocaleDateString()}`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedKoboDoc?.isGroupedKobo ? (
                  <>
                    {/* Public & Admin Group Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Left: Objectives & Insights */}
                      <div className="space-y-4">
                        <div className="p-5 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl">
                          <h4 className="text-sm font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                            ✨ Study Overview & Objectives
                          </h4>
                          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            {selectedKoboDoc.body}
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                          <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                            📋 Aggregated Insights & Findings
                          </h4>
                          <p className="text-xs text-blue-800 leading-relaxed mb-3">
                            Based on the survey inputs from {selectedKoboDoc.submissions?.length || 0} participants, key adaptation priorities center heavily on sustainable resource security, community educational support, and financial resilience.
                          </p>
                          <ul className="list-disc list-inside space-y-1.5 text-[11px] text-blue-800 font-medium">
                            <li>Major issues centered on extreme weather hazards including severe drought conditions.</li>
                            <li>Rainwater harvesting systems were frequently proposed as immediate mitigation strategies.</li>
                            <li>Strong community recommendations emphasize developing local green job portfolios and county grants.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Right: Study Area Location Bar Chart */}
                      {selectedKoboDoc.submissions && (
                        <div className="space-y-3 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl self-stretch">
                          <h4 className="text-sm font-bold text-slate-800 mb-2">Areas of Study & Response Densities</h4>
                          {(() => {
                            const locationCounts: Record<string, number> = {};
                            selectedKoboDoc.submissions.forEach((sub: any) => {
                              const loc = sub.country || "Kenya";
                              locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                            });
                            const maxCount = Math.max(...Object.values(locationCounts), 1);
                            return Object.entries(locationCounts).map(([loc, count]) => {
                              const percentage = (count / maxCount) * 100;
                              return (
                                <div key={loc} className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>{loc}</span>
                                    <span>{count} {count === 1 ? 'response' : 'responses'}</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Admin Only Submissions Explorer */}
                    {isAdmin && (
                      <div className="border-t pt-6 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">Detailed Submissions Explorer</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                          {/* Sidebar Selector */}
                          <div className="col-span-1 space-y-2 border-r pr-4 max-h-[350px] overflow-y-auto">
                            {selectedKoboDoc.submissions?.map((sub: any, idx: number) => {
                              const name = sub.content_text ? getRespondentName(sub.content_text) : "Anonymous Respondent";
                              const isSelected = selectedKoboSubIdx === idx;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedKoboSubIdx(idx)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                                    isSelected 
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-sm" 
                                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="font-semibold truncate">{name}</span>
                                  <div className="flex justify-between text-[10px] text-slate-500 font-normal">
                                    <span>{sub.country}</span>
                                    <span>{new Date(sub.scraped_at).toLocaleDateString()}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Details Display Panel */}
                          <div className="col-span-1 md:col-span-2 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                            {(() => {
                              const sub = selectedKoboDoc.submissions?.[selectedKoboSubIdx];
                              if (!sub) return <p className="text-xs text-muted-foreground italic">No submission selected.</p>;
                              const respondentName = sub.content_text ? getRespondentName(sub.content_text) : "Anonymous Respondent";
                              return (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-slate-50 border p-3 rounded-xl">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Respondent Name</span>
                                      <h5 className="text-xs font-bold text-primary">{respondentName}</h5>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Location & Date</span>
                                      <p className="text-[10px] font-semibold text-slate-700">{sub.country} • {new Date(sub.scraped_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>

                                  {sub.content_text ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {sub.content_text.split('\n').map((line: string, lIdx: number) => {
                                        const colonIdx = line.indexOf(':');
                                        if (colonIdx === -1) return <p key={lIdx} className="text-xs text-slate-600 col-span-2">{line}</p>;
                                        const label = line.substring(0, colonIdx).replace(/_/g, ' ').toUpperCase();
                                        const val = line.substring(colonIdx + 1).trim();
                                        if (!val) return null;
                                        return (
                                          <div key={lIdx} className="p-3 bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-xl transition flex flex-col gap-1">
                                            <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">{label}</span>
                                            <span className="text-xs text-slate-800 font-medium leading-relaxed">{val}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">No details available.</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Original Single Kobo Document Fallback */
                  <>
                    {selectedKoboDoc?.body && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-xl mb-4">
                        <h4 className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                          ✨ AI Summary & Insights
                        </h4>
                        <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                          {selectedKoboDoc.body}
                        </p>
                      </div>
                    )}
                    {selectedKoboDoc?.content_text ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedKoboDoc.content_text.split('\n').map((line, idx) => {
                          const colonIdx = line.indexOf(':');
                          if (colonIdx === -1) return <p key={idx} className="text-sm text-foreground">{line}</p>;
                          const label = line.substring(0, colonIdx).replace(/_/g, ' ').toUpperCase();
                          const value = line.substring(colonIdx + 1).trim();
                          if (!value) return null;
                          return (
                            <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border/40 flex flex-col md:flex-row md:items-start gap-1 md:gap-4 text-sm">
                              <span className="font-bold text-[10px] text-primary/70 uppercase tracking-wider md:w-1/3 flex-shrink-0 pt-0.5">
                                {label}
                              </span>
                              <span className="text-foreground flex-1 break-words">
                                {value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-8">No content available for this submission.</p>
                    )}
                  </>
                )}
              </div>
              <DialogFooter className="border-t p-4 flex-shrink-0 sm:justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSelectedKoboDoc(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition-colors border border-border"
                >
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
        <Footer />
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
