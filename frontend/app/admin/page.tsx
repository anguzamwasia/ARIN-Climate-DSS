"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Check, X, User, FileText, LayoutDashboard, 
  Video, UploadCloud, CheckCircle2, Loader2, Play, AudioLines, BookOpen, Edit, BarChart2, Trash2
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"


// Types matching current systems
interface Blog {
  id: string
  title: string
  authorName: string
  authorEmail?: string
  imageUrl?: string
  postType: "research" | "story"
  status: "draft" | "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  feedback?: string
  previousVersion?: string
  editedByAdmin?: boolean
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
  const { token, logout } = useAuth()
  // Navigation Tracking Layout Toggle
  const [activeTab, setActiveTab] = useState<"blogs" | "media" | "research" | "analytics">("blogs")

  // --- BLOG STATE MANAGEMENT ---
  const [allBlogs, setAllBlogs] = useState<Blog[]>([])
  const [showComparison, setShowComparison] = useState<Record<string, boolean>>({})
  const [blogSubTab, setBlogSubTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [blogActionMessage, setBlogActionMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [rejectionError, setRejectionError] = useState<string | null>(null)
  const [isProcessingBlog, setIsProcessingBlog] = useState(false)
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [blogToEdit, setBlogToEdit] = useState<Blog | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [editImageError, setEditImageError] = useState<string | null>(null)

  // User Stats
  const [userStats, setUserStats] = useState({ total_users: 0, active_users: 0 })
  const [contentStats, setContentStats] = useState({ research_papers: 0, media_processed: 0 })

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.status === 401) {
        logout()
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUserStats(data)
      }
    } catch (err) {}
  }

  const fetchContentStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/content/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.status === 401) {
        logout()
        return
      }
      if (res.ok) {
        const data = await res.json()
        setContentStats(data)
      }
    } catch (err) {}
  }

  // Monthly stats state & fetcher
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  const fetchMonthlyData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/reports/monthly`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.status === 401) {
        logout()
        return
      }
      if (res.ok) {
        const data = await res.json()
        setMonthlyData(data)
      }
    } catch (err) {}
  }

  const fetchBlogs = async () => {
    setIsLoadingBlogs(true)
    try {
      const res = await fetch(`${API_URL}/blogs`)
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((b: any) => ({
          id: b.id.toString(),
          title: b.title,
          authorName: b.author_name,
          authorEmail: b.author_email,
          postType: b.post_type,
          status: b.status,
          submittedAt: b.submitted_at,
          reviewedAt: b.reviewed_at,
          imageUrl: b.image_url,
          feedback: b.feedback,
          previousVersion: b.previous_version,
          editedByAdmin: b.edited_by_admin,
          formData: {
            summary: b.summary,
            findings: b.findings,
            narrative: b.narrative,
            impact: b.impact,
            sources: b.sources,
            background: b.background,
            implications: b.implications
          }
        }))
        setAllBlogs(mapped)
      }
    } catch (err) {}
    setIsLoadingBlogs(false)
  }

  // --- MEDIA / DOC STATE MANAGEMENT ---
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [docDescription, setDocDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const [localHistory, setLocalHistory] = useState<LocalMediaLog[]>([])
  const [mediaDescription, setMediaDescription] = useState("")

  const fetchUploadHistory = async () => {
    try {
      const docRes = await fetch(`${API_URL}/documents?source=ARIN&limit=100`)
      let docsData: any[] = []
      if (docRes.ok) {
        docsData = await docRes.json()
      }

      const mediaRes = await fetch(`${API_URL}/documents?source=WHISPER&limit=100`)
      let mediaData: any[] = []
      if (mediaRes.ok) {
        mediaData = await mediaRes.json()
      }

      const mappedDocs: LocalMediaLog[] = docsData.map((d: any) => ({
        id: d.id.toString(),
        originalName: d.title,
        timestamp: d.scraped_at || new Date().toISOString(),
        status: "completed",
        type: "document"
      }))

      const mappedMedia: LocalMediaLog[] = mediaData.map((m: any) => {
        let title = m.title || ""
        let cleanName = title.replace(/^Transcript:\s*/i, "")
        cleanName = cleanName.replace(/^(admin_\d+_|kobo_\d+_)/i, "")
        const fileType = cleanName.toLowerCase().endsWith(".mp4") ? "video" : "audio"
        return {
          id: m.id.toString(),
          originalName: cleanName,
          timestamp: m.scraped_at || new Date().toISOString(),
          status: m.file_url === "failed" ? "failed" as const : "completed" as const,
          type: fileType as any
        }
      })

      const combined = [...mappedDocs, ...mappedMedia].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setLocalHistory(combined)
    } catch (err) {
      console.error("Failed to fetch upload history", err)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document/transcript and its search vector index?")) return
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/documents/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        setUploadMessage("🗑️ Document deleted successfully.")
        fetchUploadHistory()
      } else {
        const err = await res.json().catch(() => ({}))
        setUploadMessage(`❌ Delete failure: ${err.detail || "Server rejected delete request"}`)
      }
    } catch (err: any) {
      setUploadMessage(`❌ Delete failure: ${err.message || err}`)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    if (token) {
      fetchUserStats()
      fetchContentStats()
      fetchMonthlyData()
      fetchUploadHistory()
    }
  }, [token])

  // Deep-link handler: automatically open edit modal if ?editBlogId=... is in the URL
  useEffect(() => {
    if (typeof window !== "undefined" && allBlogs.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const editId = params.get("editBlogId")
      if (editId) {
        const target = allBlogs.find(b => b.id === editId)
        if (target) {
          setActiveTab("blogs")
          setBlogSubTab(target.status === "approved" ? "approved" : target.status === "rejected" ? "rejected" : "pending")
          openEditModal(target)
        }
      }
    }
  }, [allBlogs])

  // Filter lists dynamically
  const pendingBlogs = allBlogs.filter((b) => b.status === "pending")
  const approvedBlogs = allBlogs.filter((b) => b.status === "approved")
  const rejectedBlogs = allBlogs.filter((b) => b.status === "rejected")

  const openEditModal = (blog: Blog) => {
    setBlogToEdit(blog)
    setEditFormData({
      title: blog.title || "",
      authorName: blog.authorName || "",
      imageUrl: blog.imageUrl || "",
      summary: blog.formData?.summary || "",
      findings: blog.formData?.findings || "",
      narrative: blog.formData?.narrative || "",
      impact: blog.formData?.impact || "",
      sources: blog.formData?.sources || "",
      background: blog.formData?.background || "",
      implications: blog.formData?.implications || ""
    })
    setEditError(null)
    setEditImageError(null)
    setShowEditModal(true)
  }

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setEditImageError("Please upload a valid image file (.png, .jpg, .jpeg, .webp).")
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setEditImageError(`Image size is ${sizeMB}MB, which exceeds the 3MB limit. Please select an image up to 3MB only.`)
      e.target.value = ""
      return
    }

    setEditImageError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const maxWidth = 1200
        const maxHeight = 1200
        let width = img.width
        let height = img.height
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          setEditFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL("image/jpeg", 0.82) }))
        } else {
          setEditFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }))
        }
      }
      img.onerror = () => {
        setEditFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  // --- ACTIONS: BLOG QUEUE ---
  const handleApprove = async (id: string) => {
    setIsProcessingBlog(true)
    try {
      const res = await fetch(`${API_URL}/blogs/${id}/approve`, { 
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        await fetchBlogs()
        setBlogActionMessage("✅ Verified successfully!")
        setTimeout(() => setBlogActionMessage(""), 3000)
      }
    } catch (err) {}
    setIsProcessingBlog(false)
  }

  const handleRejectSubmit = async () => {
    if (!selectedBlog || !rejectionReason.trim()) return
    setIsProcessingBlog(true)
    setRejectionError(null)
    try {
      const res = await fetch(`${API_URL}/blogs/${selectedBlog.id}/reject`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: rejectionReason.trim() })
      })
      if (res.ok) {
        await fetchBlogs()
        setShowModal(false)
        setRejectionReason("")
        setSelectedBlog(null)
        setBlogActionMessage("❌ Submission rejected and revision feedback sent!")
        setTimeout(() => setBlogActionMessage(""), 3000)
      } else {
        const errorData = await res.json()
        setRejectionError(errorData.detail || "Failed to submit rejection. Please try again.")
      }
    } catch (err) {
      console.error(err)
      setRejectionError("Failed to connect to backend server.")
    }
    setIsProcessingBlog(false)
  }

  const handleEditSubmit = async (overrideStatus?: "approved" | "pending") => {
    if (!blogToEdit) return
    setIsProcessingBlog(true)
    setEditError(null)
    try {
      const targetStatus = overrideStatus || blogToEdit.status || "pending"
      const payload = {
        title: editFormData.title || blogToEdit.title,
        author_name: editFormData.authorName || blogToEdit.authorName,
        author_email: blogToEdit.authorEmail,
        post_type: blogToEdit.postType,
        summary: editFormData.summary !== undefined ? editFormData.summary : blogToEdit.formData?.summary,
        findings: editFormData.findings !== undefined ? editFormData.findings : blogToEdit.formData?.findings,
        narrative: editFormData.narrative !== undefined ? editFormData.narrative : blogToEdit.formData?.narrative,
        impact: editFormData.impact !== undefined ? editFormData.impact : blogToEdit.formData?.impact,
        sources: editFormData.sources !== undefined ? editFormData.sources : blogToEdit.formData?.sources,
        image_url: editFormData.imageUrl !== undefined ? editFormData.imageUrl : blogToEdit.imageUrl,
        background: editFormData.background !== undefined ? editFormData.background : blogToEdit.formData?.background,
        implications: editFormData.implications !== undefined ? editFormData.implications : blogToEdit.formData?.implications,
        status: targetStatus,
        edited_by_admin: true
      }

      const res = await fetch(`${API_URL}/blogs/${blogToEdit.id}`, { 
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        await fetchBlogs()
        setBlogActionMessage(
          targetStatus === "approved"
            ? "✅ Published blog updated and live on platform!"
            : "✍️ Changes saved and contributor notified of updates!"
        )
        setTimeout(() => setBlogActionMessage(""), 4000)
        setShowEditModal(false)
        setBlogToEdit(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        setEditError(errorData.detail || "Failed to save blog changes. Please check inputs.")
      }
    } catch (err) {
      setEditError("Failed to connect to backend server.")
    }
    setIsProcessingBlog(false)
  }

  const handleEditChange = (field: string, value: string) => {
    setEditFormData(prev => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    })
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
    if (!mediaDescription || !mediaDescription.trim()) {
      setUploadMessage("❌ Description/Tags are mandatory.")
      return
    }

    setIsUploading(true)
    setUploadMessage("Uploading stream payload straight into local storage volumes...")

    const formData = new FormData()
    formData.append("file", uploadingFile!)
    formData.append("description", mediaDescription.trim())

    try {
      // Connects directly to our backend endpoint route layer
      const response = await fetch(`${API_URL}/api/v1/admin/media/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Backend server rejected binary ingestion connection matrix.")

      const data = await response.json()
      
      const fileType = uploadingFile!.name.toLowerCase().endsWith(".mp4") ? "video" : "audio"
      const tempId = Math.random().toString(36).substr(2, 9)
      const newLog: LocalMediaLog = {
        id: tempId,
        originalName: uploadingFile!.name,
        timestamp: new Date().toISOString(),
        status: "processing",
        type: fileType as any
      }
      
      setLocalHistory(prev => [newLog, ...prev])

      setUploadMessage(`🚀 Asset received! Processing local Whisper transcription on background threads.`)
      setUploadingFile(null)
      setMediaDescription("")

      setTimeout(() => {
        fetchUploadHistory()
      }, 15000)

    } catch (err: any) {
      setUploadMessage(`❌ Ingest process termination failure: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadingFile) return
    if (!docDescription || !docDescription.trim()) {
      setUploadMessage("❌ Document description is mandatory.")
      return
    }

    setIsUploading(true)
    setUploadMessage("Uploading document to secure storage...")

    const formData = new FormData()
    formData.append("file", uploadingFile)
    formData.append("description", docDescription.trim())

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/documents/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Server rejected document ingestion.")
      }
      
      setUploadMessage(`✅ Research paper received and stored successfully!`)
      setUploadingFile(null)
      setDocDescription("")
      fetchUploadHistory()

    } catch (err: any) {
      setUploadMessage(`❌ Document ingest failure: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Helper to reset upload state when switching tabs
  const switchTab = (tab: "blogs" | "media" | "research" | "analytics") => {
    setActiveTab(tab)
    setUploadingFile(null)
    setUploadMessage("")
    setDocDescription("")
    setMediaDescription("")
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* GLOBAL HEADBOARD BAR */}
      <header className="sticky top-0 z-50 bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={90} height={30} className="object-contain cursor-pointer" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/blog/submit">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer border-0">
              <FileText className="w-4 h-4" />
              Write Blog (Company Voice)
            </button>
          </Link>
        </div>
      </header>

      {/* Mobile Tab Navigation Bar */}
      <div className="md:hidden bg-white border-b flex justify-around p-2 flex-shrink-0">
        <button 
          onClick={() => switchTab("blogs")} 
          className={`flex flex-col items-center gap-1 p-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "blogs" ? "text-emerald-700 font-bold" : "text-gray-500"}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Blogs ({pendingBlogs.length})</span>
        </button>
        <button 
          onClick={() => switchTab("research")} 
          className={`flex flex-col items-center gap-1 p-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "research" ? "text-emerald-700 font-bold" : "text-gray-500"}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Research</span>
        </button>
        <button 
          onClick={() => switchTab("media")} 
          className={`flex flex-col items-center gap-1 p-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "media" ? "text-emerald-700 font-bold" : "text-gray-500"}`}
        >
          <Video className="w-4 h-4" />
          <span>Media</span>
        </button>
        <button 
          onClick={() => switchTab("analytics")} 
          className={`flex flex-col items-center gap-1 p-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "analytics" ? "text-emerald-700 font-bold" : "text-gray-500"}`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

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
            <span className="ml-auto flex items-center gap-1.5">
              {pendingBlogs.length > 0 && (
                <span className="bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded-full" title="Pending">{pendingBlogs.length}</span>
              )}
              {approvedBlogs.length > 0 && (
                <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2 py-0.5 rounded-full" title="Approved">{approvedBlogs.length}</span>
              )}
              {rejectedBlogs.length > 0 && (
                <span className="bg-red-100 text-red-800 font-bold text-xs px-2 py-0.5 rounded-full" title="Rejected / Needs Revision">{rejectedBlogs.length}</span>
              )}
            </span>
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

          <button 
            onClick={() => switchTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "analytics" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Ingestion Analytics</span>
          </button>

          <div className="mt-8 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            User Statistics
          </div>
          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 mx-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 font-medium">Total Registered</span>
              <span className="text-sm font-bold text-gray-900">{userStats.total_users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Active (Logged In)</span>
              <span className="text-sm font-bold text-emerald-600">{userStats.active_users}</span>
            </div>
          </div>

          <div className="mt-6 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Content Ingestion
          </div>
          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 mx-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 font-medium">Research Papers</span>
              <span className="text-sm font-bold text-blue-600">{contentStats.research_papers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Processed Media</span>
              <span className="text-sm font-bold text-blue-600">{contentStats.media_processed}</span>
            </div>
          </div>
        </aside>

        {/* CONTAINER WORKSPACE VIEWPORT LAYER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            
            {/* Responsive stats summary at the top of main content */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 md:hidden">
              <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registered</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{userStats.total_users}</p>
              </div>
              <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Users</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">{userStats.active_users}</p>
              </div>
              <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Papers</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{contentStats.research_papers}</p>
              </div>
              <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Media</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{contentStats.media_processed}</p>
              </div>
            </div>

            {/* TAB SECTION D: MONTHLY INGESTION RATE CHART */}
            {activeTab === "analytics" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Monthly Report Ingestion Rate</h2>
                <p className="text-xs text-gray-500 mb-6 font-medium">Track the monthly volume of climate reports scraped vs. added manually through the admin panel.</p>
                
                {monthlyData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center border border-dashed rounded-xl bg-gray-50 text-xs text-gray-400 font-semibold">
                    No monthly ingestion data available.
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 500 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10, fontWeight: 500 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                        <Bar dataKey="scraped" stackId="a" fill="#2563eb" name="Scraped Reports" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="admin" stackId="a" fill="#10b981" name="Admin Uploads" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}


            {/* TAB SECTION A: BLOG WORKFLOW ARRAY */}
            {activeTab === "blogs" && (
              <>
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Review Submissions Queue</h1>
                    <p className="text-sm text-gray-500">Inspect research methodologies and community stories awaiting approval.</p>
                  </div>
                  {blogActionMessage && (
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                      {blogActionMessage}
                    </div>
                  )}
                </div>

                {/* Sub-Tabs for status filtering */}
                <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
                  <button 
                    onClick={() => setBlogSubTab("pending")}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${blogSubTab === "pending" ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Pending Review ({pendingBlogs.length})
                  </button>
                  <button 
                    onClick={() => setBlogSubTab("approved")}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${blogSubTab === "approved" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Approved & Live ({approvedBlogs.length})
                  </button>
                  <button 
                    onClick={() => setBlogSubTab("rejected")}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${blogSubTab === "rejected" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Rejected / Revisions ({rejectedBlogs.length})
                  </button>
                </div>

                {isLoadingBlogs ? (
                  <div className="bg-white border rounded-xl p-16 flex flex-col items-center justify-center shadow-sm">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-sm text-gray-500 mt-3 font-semibold">Loading review submissions...</p>
                  </div>
                ) : (blogSubTab === "pending" ? pendingBlogs : blogSubTab === "approved" ? approvedBlogs : rejectedBlogs).length === 0 ? (
                  <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
                    No entries in this status queue at this moment.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(blogSubTab === "pending" ? pendingBlogs : blogSubTab === "approved" ? approvedBlogs : rejectedBlogs).map((blog) => (
                      <div key={blog.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4 mb-4">
                          <div className="flex gap-4 items-start">
                            {blog.imageUrl && <img src={blog.imageUrl} className="w-16 h-16 object-cover bg-gray-100 rounded-lg border flex-shrink-0" alt="" />}
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
                          
                          {blog.status === "pending" ? (
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                              <button disabled={isProcessingBlog} onClick={() => openEditModal(blog)} className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-sm bg-blue-50 font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"><Edit className="w-3.5 h-3.5" /> Edit</button>
                              <button disabled={isProcessingBlog} onClick={() => { setSelectedBlog(blog); setRejectionError(null); setShowModal(true); }} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm bg-red-50 font-medium hover:bg-red-100 transition-colors cursor-pointer">Reject</button>
                              <button disabled={isProcessingBlog} onClick={() => handleApprove(blog.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer">Approve</button>
                            </div>
                          ) : blog.status === "approved" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved & Live
                              </span>
                              <button 
                                disabled={isProcessingBlog} 
                                onClick={() => openEditModal(blog)} 
                                className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs bg-blue-50 font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                                title="Edit this published blog"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Published Post
                              </button>
                              <Link 
                                href={`/blogs/${blog.id}`} 
                                target="_blank" 
                                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs bg-gray-50 font-medium hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View live article in new tab"
                              >
                                View Live ↗
                              </Link>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                              <div className="text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 max-w-xs">
                                <strong>Rejection Feedback:</strong> {blog.feedback}
                              </div>
                              <button 
                                disabled={isProcessingBlog} 
                                onClick={() => openEditModal(blog)} 
                                className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs bg-blue-50 font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                            </div>
                          )}
                        </div>

                        {blog.formData && (() => {
                          let parsedPrev = null;
                          if (blog.previousVersion) {
                            try {
                              parsedPrev = JSON.parse(blog.previousVersion);
                            } catch (e) {}
                          }

                          return (
                            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg border overflow-hidden break-words">
                              {blog.previousVersion && parsedPrev && (
                                <div className="mb-2 border-b pb-2">
                                  <button 
                                    type="button"
                                    onClick={() => setShowComparison(p => ({ ...p, [blog.id]: !p[blog.id] }))}
                                    className="text-xs font-bold text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                                  >
                                    {showComparison[blog.id] ? "Hide Original vs Corrected Version" : "👁️ Compare Original vs Corrected (Verify Corrections)"}
                                  </button>
                                </div>
                              )}

                              {showComparison[blog.id] && parsedPrev ? (
                                <div className="space-y-4 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                  <h4 className="font-bold text-xs uppercase text-amber-900 tracking-wide mb-2">Original vs Corrected Comparison (Left: Old / Right: New)</h4>
                                  {Object.keys(parsedPrev).map((field) => {
                                    const prevVal = parsedPrev[field] || "";
                                    const currVal = blog.formData?.[field] || "";
                                    if (prevVal === currVal) return null;

                                    return (
                                      <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-amber-200/50 pt-2 mt-2">
                                        <div>
                                          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Original {field}:</span>
                                          <div className="text-gray-500 text-xs mt-0.5 prose prose-sm max-w-none line-through" dangerouslySetInnerHTML={{ __html: prevVal }} />
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Corrected {field}:</span>
                                          <div className="text-gray-900 text-xs mt-0.5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: currVal }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                blog.postType === "research" ? (
                                  <>
                                    <div><span className="font-semibold text-gray-700">Executive Summary:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.summary || "" }} /></div>
                                    <div><span className="font-semibold text-gray-700">Key Findings:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.findings || "" }} /></div>
                                    <div><span className="font-semibold text-gray-700">Policy Implications:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.implications || "" }} /></div>
                                    <div><span className="font-semibold text-gray-700">References:</span><div className="text-gray-500 text-xs italic mt-0.5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.sources || "" }} /></div>
                                  </>
                                ) : (
                                  <>
                                    <div><span className="font-semibold text-amber-900">Story Premise:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.summary || "" }} /></div>
                                    <div><span className="font-semibold text-amber-900">Lived Narrative:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.narrative || "" }} /></div>
                                    <div><span className="font-semibold text-amber-900">Impact Indicators:</span><div className="text-gray-600 mt-0.5 text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.formData.impact || "" }} /></div>
                                  </>
                                )
                              )}
                            </div>
                          );
                        })()}
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

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 block">Document Description</label>
                        <textarea
                          value={docDescription}
                          onChange={(e) => setDocDescription(e.target.value)}
                          placeholder="Enter a brief 1-2 sentence description explaining this document..."
                          rows={3}
                          className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!uploadingFile || !docDescription.trim() || isUploading}
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

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Stored</span>
                            </span>
                            <button
                              onClick={() => handleDeleteDocument(log.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
                              title="Delete document and search index"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 block">Description / Tags</label>
                        <textarea
                          value={mediaDescription}
                          onChange={(e) => setMediaDescription(e.target.value)}
                          placeholder="Enter brief description or tags for easy searching and categorization of this media..."
                          rows={3}
                          className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUploading || !mediaDescription.trim() || !uploadingFile}
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
                      <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${
                        uploadMessage.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}>
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
                              <p className="font-semibold text-gray-900 pr-12 break-all">{log.originalName}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
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
                            <button
                              onClick={() => handleDeleteDocument(log.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
                              title="Delete media and transcript index"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
            
            {rejectionError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs mb-3 border border-red-200 font-medium">
                ⚠️ {rejectionError}
              </div>
            )}

            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide action targets..." className="w-full h-28 border p-2 text-sm rounded bg-gray-50 outline-none focus:ring-1 focus:ring-red-500 resize-none mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); setRejectionReason(""); setRejectionError(null); }} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
              <button 
                onClick={handleRejectSubmit} 
                disabled={!rejectionReason.trim() || isProcessingBlog} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingBlog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isProcessingBlog ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && blogToEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border animate-in fade-in zoom-in-95 duration-100">
            <div className="p-6 border-b flex-shrink-0 bg-gray-50/50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {blogToEdit.status === "approved" ? "Edit Published Blog" : "Edit Submission"}
                  </h2>
                  {blogToEdit.status === "approved" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live on Platform
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Pending Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {blogToEdit.status === "approved"
                    ? "Modify this published document. Edits will immediately update the live public post and synchronize the AI knowledge base."
                    : "Make necessary editorial improvements before approving."}
                </p>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); setBlogToEdit(null); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {editError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                ⚠️ {editError}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Article Title</label>
                  <input 
                    value={editFormData.title || ""} 
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} 
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                    placeholder="Enter blog title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Author / Contributor Name</label>
                  <input 
                    value={editFormData.authorName || ""} 
                    onChange={(e) => setEditFormData({ ...editFormData, authorName: e.target.value })} 
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Contributor name"
                  />
                </div>
              </div>

              {/* Cover Image Controls */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Cover Image (Optional — Up to 3MB)</label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {editFormData.imageUrl ? (
                    <div className="relative w-28 h-20 border rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                      <img src={editFormData.imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-28 h-20 border border-dashed rounded-lg flex items-center justify-center text-xs text-gray-400 bg-white flex-shrink-0">
                      No image
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file"
                      accept=".png, .jpg, .jpeg, .webp"
                      onChange={handleEditImageUpload}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-400">Supported: PNG, JPG, WEBP • Max <strong>3MB only</strong></p>
                    {editImageError && (
                      <p className="text-xs text-red-600 font-semibold">{editImageError}</p>
                    )}
                    {editFormData.imageUrl && (
                      <button 
                        type="button" 
                        onClick={() => setEditFormData(prev => ({ ...prev, imageUrl: "" }))}
                        className="text-xs text-red-600 hover:text-red-800 font-medium underline cursor-pointer"
                      >
                        Remove current image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {blogToEdit.postType === "research" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Executive Summary</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.summary || ""} onChange={(v) => handleEditChange("summary", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Background Context</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.background || ""} onChange={(v) => handleEditChange("background", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Key Findings</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.findings || ""} onChange={(v) => handleEditChange("findings", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Policy Implications</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.implications || ""} onChange={(v) => handleEditChange("implications", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">References & Sources</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.sources || ""} onChange={(v) => handleEditChange("sources", v)} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Story Premise</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.summary || ""} onChange={(v) => handleEditChange("summary", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Lived Narrative</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.narrative || ""} onChange={(v) => handleEditChange("narrative", v)} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Community Impact</label>
                    <div className="bg-white rounded-lg border border-gray-300"><ReactQuill theme="snow" value={editFormData.impact || ""} onChange={(v) => handleEditChange("impact", v)} /></div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t flex-shrink-0 flex flex-wrap justify-between items-center gap-3 bg-gray-50">
              <div className="text-xs text-gray-500">
                {blogToEdit.status === "approved" ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saving will immediately update the live website and AI index.
                  </span>
                ) : (
                  <span>Status: Pending Review</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => { setShowEditModal(false); setBlogToEdit(null); }} 
                  className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                >
                  Cancel
                </button>
                {blogToEdit.status === "pending" && (
                  <button 
                    type="button"
                    onClick={() => handleEditSubmit("approved")} 
                    disabled={isProcessingBlog} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isProcessingBlog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Save & Approve Now
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => handleEditSubmit()} 
                  disabled={isProcessingBlog} 
                  className={`px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    blogToEdit.status === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isProcessingBlog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {blogToEdit.status === "approved" ? "Save & Update Live Blog" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}
