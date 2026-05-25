"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Check, X, AlertTriangle, User, FileText } from "lucide-react"

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

export default function AdminBlogReviewPage() {
  const [allBlogs, setAllBlogs] = useState<Blog[]>([])
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("arin_climate_blogs")
    if (saved) {
      setAllBlogs(JSON.parse(saved))
    }
  }, [])

  const pendingBlogs = allBlogs.filter((b) => b.status === "pending")

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="sticky top-0 z-50 bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={90} height={30} className="object-contain" />
          <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Gate Keeper Gate</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
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
                    <img src={blog.imageUrl} className="w-16 h-16 object-cover bg-gray-100 rounded-lg border flex-shrink-0" alt="" />
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

                {/* Conditional Field Layout Map Rendering */}
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
      </main>

      {/* Modal Prompt Window */}
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