"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { 
  Check, X, User, FileText, LayoutDashboard, 
  Video, UploadCloud, CheckCircle2, Loader2, Play, AudioLines, BookOpen
} from "lucide-react"

// Types matching current systems
interface Blog {
  id: string
  title: string
  authorName: string
  imageUrl?: string
  postType: "research" | "story"
  status: "draft" | "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  feedback?: string
  formData?: Record<string, string>
}

interface LocalMediaLog {
  id: string
  originalName: string
  timestamp: string
  status: "processing" | "completed" | "failed"
  type: "audio" | "video" | "document"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function UnifiedAdminPortal() {
  // Navigation Tracking Layout Toggle
  const [activeTab, setActiveTab] = useState<"blogs" | "media" | "research">("blogs")

  // --- BLOG STATE MANAGEMENT ---
  const [allBlogs, setAllBlogs] = useState<Blog[]>([])
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showModal, setShowModal] = useState(false)

  // --- MEDIA / DOC STATE MANAGEMENT ---
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const [localHistory, setLocalHistory] = useState<LocalMediaLog[]>([])

  useEffect(() => {
    // Synchronize local browser caches for testing mock payloads
    const savedBlogs = localStorage.getItem("arin_climate_blogs")
    if (savedBlogs) setAllBlogs(JSON.parse(savedBlogs))

    const savedMedia = localStorage.getItem("arin_processed_media_logs")
    if (savedMedia) {
      setLocalHistory(JSON.parse(savedMedia))
    } else {
      // Seed default baseline views for interface tracking layout validation
      const initialLogs: LocalMediaLog[] = [
        { id: "1", originalName: "KII_Uasin_Gishu_Crop_Yield_Interview.mp3", timestamp: new Date().toISOString(), status: "completed", type: "audio" }
      ]
      setLocalHistory(initialLogs)
      localStorage.setItem("arin_processed_media_logs", JSON.stringify(initialLogs))
    }
  }, [])

  // Filter lists dynamically
  const pendingBlogs = allBlogs.filter((b) => b.status === "pending")

  // --- ACTIONS: BLOG QUEUE ---
  const handleApprove = (id: string) => {
    const updated = allBlogs.map((blog) =>
      blog.id === id ? { ...blog, status: "approved" as const, reviewedAt: new Date().toISOString() } : blog
    )
    setAllBlogs(updated)
    localStorage.setItem("arin_climate_blogs", JSON.stringify(updated))
    alert("Content successfully published to public views.")
  }

  const handleRejectSubmit = () => {
    if (!selectedBlog || !rejectionReason.trim()) return

    const updated = allBlogs.map((blog) =>
      blog.id === selectedBlog.id
        ? { ...blog, status: "rejected" as const, reviewedAt: new Date().toISOString(), feedback: rejectionReason.trim() }
        : blog
    )
    setAllBlogs(updated)
    localStorage.setItem("arin_climate_blogs", JSON.stringify(updated))
    setShowModal(false)
    setRejectionReason("")
    setSelectedBlog(null)
  }

  // --- ACTIONS: FILES (Media & Docs) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingFile(e.target.files[0])
      setUploadMessage("")
    }
  }

  const handleMediaUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadingFile) return

    setIsUploading(true)
    setUploadMessage("Uploading stream payload straight into local storage volumes...")

    const formData = new FormData()
    formData.append("file", uploadingFile)

    try {
      // Connects directly to our backend endpoint route layer
      const response = await fetch(`${API_URL}/api/v1/admin/media/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Backend server rejected binary ingestion connection matrix.")

      const data = await response.json()
      
      const fileType = uploadingFile.name.toLowerCase().endsWith(".mp4") ? "video" : "audio"
      const newLog: LocalMediaLog = {
        id: Math.random().toString(36).substr(2, 9),
        originalName: uploadingFile.name,
        timestamp: new Date().toISOString(),
        status: "processing",
        type: fileType as any
      }
      
      const updatedHistory = [newLog, ...localHistory]
      setLocalHistory(updatedHistory)
      localStorage.setItem("arin_processed_media_logs", JSON.stringify(updatedHistory))

      setUploadMessage(`🚀 Asset received! Processing local Whisper transcription on background threads.`)
      setUploadingFile(null)

      setTimeout(() => {
        const completedHistory = updatedHistory.map(log => 
          log.id === newLog.id ? { ...log, status: "completed" as const } : log
        )
        setLocalHistory(completedHistory)
        localStorage.setItem("arin_processed_media_logs", JSON.stringify(completedHistory))
      }, 8000)

    } catch (err: any) {
      setUploadMessage(`❌ Ingest process termination failure: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadingFile) return

    setIsUploading(true)
    setUploadMessage("Uploading document to secure storage...")

    const formData = new FormData()
    formData.append("file", uploadingFile)

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/documents/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Server rejected document ingestion.")
      }
      
      const newLog: LocalMediaLog = {
        id: Math.random().toString(36).substr(2, 9),
        originalName: uploadingFile.name,
        timestamp: new Date().toISOString(),
        status: "completed",
        type: "document"
      }
      
      const updatedHistory = [newLog, ...localHistory]
      setLocalHistory(updatedHistory)
      localStorage.setItem("arin_processed_media_logs", JSON.stringify(updatedHistory))

      setUploadMessage(`✅ Research paper received and stored successfully!`)
      setUploadingFile(null)

    } catch (err: any) {
      setUploadMessage(`❌ Document ingest failure: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Helper to reset upload state when switching tabs
  const switchTab = (tab: "blogs" | "media" | "research") => {
    setActiveTab(tab)
    setUploadingFile(null)
    setUploadMessage("")
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* GLOBAL HEADBOARD BAR */}
      <header className="sticky top-0 z-50 bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={90} height={30} className="object-contain" />
          <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Gate Keeper Gate</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION UTILITY */}
        <aside className="w-64 bg-white border-r flex flex-col p-4 space-y-2 hidden md:block">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Control Dashboard
          </div>
          <button 
            onClick={() => switchTab("blogs")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "blogs" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Blog Submissions</span>
            {pendingBlogs.length > 0 && (
              <span className="ml-auto bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded-full">{pendingBlogs.length}</span>
            )}
          </button>
          <button 
            onClick={() => switchTab("research")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "research" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Research Papers</span>
          </button>
          <button 
            onClick={() => switchTab("media")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "media" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Video className="w-4 h-4" />
            <span>Media Ingestion Node</span>
          </button>
        </aside>

        {/* CONTAINER WORKSPACE VIEWPORT LAYER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            
            {/* TAB SECTION A: BLOG WORKFLOW ARRAY */}
            {activeTab === "blogs" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Review Submissions Queue</h1>
                  <p className="text-sm text-gray-500">Inspect research methodologies and community stories awaiting approval.</p>
                </div>

                {pendingBlogs.length === 0 ? (
                  <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
                    No entries pending review cycles at this moment.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingBlogs.map((blog) => (
                      <div key={blog.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4 mb-4">
                          <div className="flex gap-4 items-start">
                            <img src={blog.imageUrl || "/placeholder.svg"} className="w-16 h-16 object-cover bg-gray-100 rounded-lg border flex-shrink-0" alt="" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900">{blog.title}</h2>
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${blog.postType === 'research' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {blog.postType}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" /> Contributor: {blog.authorName} • {new Date(blog.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button onClick={() => { setSelectedBlog(blog); setShowModal(true); }} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm bg-red-50 font-medium">Reject</button>
                            <button onClick={() => handleApprove(blog.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700">Approve</button>
                          </div>
                        </div>

                        {blog.formData && (
                          <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg border">
                            {blog.postType === "research" ? (
                              <>
                                <div><span className="font-semibold text-gray-700">Executive Summary:</span><p className="text-gray-600 mt-0.5">{blog.formData.summary}</p></div>
                                <div><span className="font-semibold text-gray-700">Key Findings:</span><p className="text-gray-600 mt-0.5">{blog.formData.findings}</p></div>
                                <div><span className="font-semibold text-gray-700">References:</span><p className="text-gray-500 text-xs italic mt-0.5">{blog.formData.sources}</p></div>
                              </>
                            ) : (
                              <>
                                <div><span className="font-semibold text-amber-900">Story Premise:</span><p className="text-gray-600 mt-0.5">{blog.formData.summary}</p></div>
                                <div><span className="font-semibold text-amber-900">Lived Narrative:</span><p className="text-gray-600 mt-0.5">{blog.formData.narrative}</p></div>
                                <div><span className="font-semibold text-amber-900">Impact Indicators:</span><p className="text-gray-600 mt-0.5">{blog.formData.impact}</p></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB SECTION B: RESEARCH PAPERS */}
            {activeTab === "research" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Research Documents Ingestion</h1>
                  <p className="text-sm text-gray-500">Upload official research papers, csv data, and reports to be stored securely.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* LEFT: UPLOAD BOX CONTROLS */}
                  <div className="md:col-span-1 bg-white p-6 border rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-gray-400">Upload Document</h3>
                    <form onSubmit={handleDocUploadSubmit} className="space-y-4">
                      <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-center block">
                        <BookOpen className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-semibold text-gray-700">Select Paper / Dataset</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">Supports .pdf, .docx, .csv, .xlsx</span>
                        <input type="file" accept=".pdf,.docx,.csv,.xlsx" onChange={handleFileChange} className="hidden" />
                      </label>

                      {uploadingFile && (
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                          <p className="font-bold text-gray-900 truncate">Selected File:</p>
                          <p className="text-gray-600 truncate mt-0.5">{uploadingFile.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{(uploadingFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!uploadingFile || isUploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 fill-current" />
                            <span>Store Securely</span>
                          </>
                        )}
                      </button>
                    </form>

                    {uploadMessage && (
                      <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${uploadMessage.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        {uploadMessage}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: TRACKING WORKER ENGINE HISTORY LIST */}
                  <div className="md:col-span-2 bg-white p-6 border rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-400">Secure Storage History</h3>
                    
                    <div className="space-y-3">
                      {localHistory.filter(log => log.type === 'document').map((log) => (
                        <div key={log.id} className="border rounded-lg p-4 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0 text-gray-600">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate pr-4">{log.originalName}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Stored</span>
                            </span>
                          </div>
                        </div>
                      ))}
                      {localHistory.filter(log => log.type === 'document').length === 0 && (
                        <p className="text-xs text-gray-400 italic">No documents uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB SECTION C: MEDIA ENGINE INGEST NODE LAYER */}
            {activeTab === "media" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Direct Media Ingestion Engine</h1>
                  <p className="text-sm text-gray-500">Manually upload and drop community dialogue video assets into local model processing matrices.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* LEFT: UPLOAD BOX CONTROLS */}
                  <div className="md:col-span-1 bg-white p-6 border rounded-xl shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-gray-400">Upload Media Asset</h3>
                    <form onSubmit={handleMediaUploadSubmit} className="space-y-4">
                      <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-center block">
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-semibold text-gray-700">Select Audio/Video</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">Supports .mp3, .mp4, .m4a, .wav</span>
                        <input type="file" accept=".mp3,.mp4,.wav,.m4a" onChange={handleFileChange} className="hidden" />
                      </label>

                      {uploadingFile && (
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                          <p className="font-bold text-gray-900 truncate">Selected File:</p>
                          <p className="text-gray-600 truncate mt-0.5">{uploadingFile.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{(uploadingFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!uploadingFile || isUploading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Execute Pipeline</span>
                          </>
                        )}
                      </button>
                    </form>

                    {uploadMessage && (
                      <div className="mt-4 p-3 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-800 leading-relaxed">
                        {uploadMessage}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: TRACKING WORKER ENGINE HISTORY LIST */}
                  <div className="md:col-span-2 bg-white p-6 border rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-400">Local Processing Logs History</h3>
                    
                    <div className="space-y-3">
                      {localHistory.filter(log => log.type !== 'document').map((log) => (
                        <div key={log.id} className="border rounded-lg p-4 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0 text-gray-600">
                              {log.type === "video" ? <Video className="w-4 h-4" /> : <AudioLines className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate pr-4">{log.originalName}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            {log.status === "processing" ? (
                              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Whisper Ring</span>
                              </span>
                            ) : log.status === "completed" ? (
                              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Success</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                <X className="w-3 h-3" />
                                <span>Failed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* REJECTION POPUP WINDOW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden p-6 shadow-xl border animate-in fade-in zoom-in-95 duration-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reason for Rejection</h2>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide action targets..." className="w-full h-28 border p-2 text-sm rounded bg-gray-50 outline-none focus:ring-1 focus:ring-red-500 resize-none mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); setRejectionReason(""); }} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRejectSubmit} disabled={!rejectionReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium disabled:opacity-50">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
