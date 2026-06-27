"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

type BlogStatus = "draft" | "pending" | "approved" | "rejected"
type PostType = "research" | "story"

interface Blog {
  id: string
  title: string
  authorName: string
  authorEmail?: string
  imageUrl?: string
  postType: PostType
  status: BlogStatus
  submittedAt: string
  reviewedAt?: string
  feedback?: string
  formData?: Record<string, string>
}

const formTemplates = {
  research: [
    { id: "title", label: "Blog Title", type: "input", placeholder: "Enter a descriptive title for your research findings", required: true },
    { id: "authorName", label: "Author / Investigator Name", type: "input", placeholder: "Enter full name or organization", required: true },
    { id: "imageFile", label: "Blog Cover Image (Optional)", type: "file", placeholder: "Select a PNG or JPEG picture", required: false },
    { id: "summary", label: "Executive Summary", type: "textarea", placeholder: "Provide a brief abstract summary of your post (2-3 sentences)", required: true, rows: 3 },
    { id: "background", label: "Background & Context", type: "textarea", placeholder: "Describe the environmental or climate issue background", required: true, rows: 4 },
    { id: "findings", label: "Key Findings & Data Points", type: "textarea", placeholder: "Present your main observations or raw data analysis notes", required: true, rows: 6 },
    { id: "implications", label: "Policy Implications", type: "textarea", placeholder: "Discuss implications for policymakers and institutional stakeholders", required: false, rows: 4 },
    { id: "sources", label: "Data Sources & References", type: "textarea", placeholder: "List your technical citations and data source nodes", required: true, rows: 3 },
  ],
  story: [
    { id: "title", label: "Story Title", type: "input", placeholder: "Give your climate narrative an engaging headline", required: true },
    { id: "authorName", label: "Storyteller Name", type: "input", placeholder: "Your name, community designation, or project role", required: true },
    { id: "imageFile", label: "Cover Photo (Optional)", type: "file", placeholder: "Select a PNG or JPEG picture", required: false },
    { id: "summary", label: "The Premise (Brief Intro)", type: "textarea", placeholder: "What is this story about? Introduce the location and community", required: true, rows: 3 },
    { id: "narrative", label: "The Journey / Community Narrative", type: "textarea", placeholder: "Share your human interest story, lived experience, or community changes over time", required: true, rows: 6 },
    { id: "impact", label: "Lessons Learned & Local Impacts", type: "textarea", placeholder: "What did this experience teach you? What can others learn from this?", required: true, rows: 4 },
  ]
}

export default function BlogSubmitPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"submit" | "status">("submit")
  const [postType, setPostType] = useState<PostType>("research")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [allBlogs, setAllBlogs] = useState<Blog[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("arin_climate_blogs")
    if (saved) {
      setAllBlogs(JSON.parse(saved))
    }
    
    // Auto-fill author name from profile
    if (user && !formData.authorName) {
      setFormData(prev => ({ ...prev, authorName: user.name }))
    }
  }, [user])

  useEffect(() => {
    setFormData(prev => ({ authorName: prev.authorName || user?.name || "" }))
    setUploadedImageBase64(null)
    setImageError(null)
  }, [postType, user])

  const userBlogs = allBlogs.filter(b => b.authorEmail === user?.email)

  const handleInputChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setUploadedImageBase64(null)
      setImageError(null)
      return
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      setImageError("Please upload a valid image file (.png, .jpg, or .jpeg).")
      setUploadedImageBase64(null)
      return
    }

    setImageError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImageBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageError) return
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const fallbackImage = postType === "research"
      ? "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
      : "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"

    const newBlog: Blog = {
      id: `blog-${Date.now()}`,
      title: formData.title || "Untitled Document",
      authorName: formData.authorName || user?.name || "Anonymous Contributor",
      authorEmail: user?.email,
      imageUrl: uploadedImageBase64 || fallbackImage,
      postType: postType,
      status: "pending",
      submittedAt: new Date().toISOString(),
      formData: formData,
    }

    const updated = [newBlog, ...allBlogs]
    setAllBlogs(updated)
    localStorage.setItem("arin_climate_blogs", JSON.stringify(updated))

    setIsSubmitting(false)
    setSubmitSuccess(true)
    setFormData({ authorName: user?.name || "" })
    setUploadedImageBase64(null)

    setTimeout(() => setSubmitSuccess(false), 4000)
  }

  const getRequiredFieldsFilled = () => {
    const currentSections = formTemplates[postType]
    const requiredFields = currentSections.filter((s) => s.required).map((s) => s.id)
    return requiredFields.every((field) => formData[field]?.trim()) && !imageError
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 bg-white border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <div className="h-6 w-px bg-border mx-4" />
            <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={80} height={28} className="object-contain" />
          </div>
        </header>

        <main className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">My Climate Content</h1>
            <p className="text-muted-foreground mt-1">Submit new research or stories, and track the status of your submissions.</p>
          </div>

          <div className="flex gap-2 mb-8 border-b pb-4">
            <Button onClick={() => setActiveTab("submit")} variant={activeTab === "submit" ? "default" : "secondary"}>
              <FileText className="w-4 h-4 mr-2" /> Submit Content
            </Button>
            <Button onClick={() => setActiveTab("status")} variant={activeTab === "status" ? "default" : "secondary"}>
              <Eye className="w-4 h-4 mr-2" /> My Submissions ({userBlogs.length})
            </Button>
            <Link href="/blogs" className="ml-auto">
              <Button variant="outline">
                Read Published Blogs
              </Button>
            </Link>
          </div>

          {activeTab === "submit" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {submitSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-green-800">Submission Forwarded Successfully!</h2>
                  <p className="text-sm text-green-700 mt-1 mb-4">Your content is processing through the review pipeline.</p>
                  <Button onClick={() => { setSubmitSuccess(false); setActiveTab("status"); }} className="bg-green-700 text-white hover:bg-green-800">Track Progress Status</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Select Content Framework Structure</h3>
                      <p className="text-xs text-gray-500">Choose structured data components or fluid organic narration metrics.</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPostType("research")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${postType === 'research' ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-100 text-gray-700'}`}>
                        🔬 Empirical Findings
                      </button>
                      <button type="button" onClick={() => setPostType("story")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${postType === 'story' ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-100 text-gray-700'}`}>
                        🌱 Lived Story Telling
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {formTemplates[postType].map((section) => (
                      <div key={section.id} className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-800">
                          {section.label} {section.required && <span className="text-red-500">*</span>}
                        </label>
                        
                        {section.type === "file" ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept=".png, .jpg, .jpeg"
                              onChange={handleFileChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                            />
                            {uploadedImageBase64 && (
                              <div className="relative w-24 h-24 border rounded-lg overflow-hidden mt-1 bg-gray-50">
                                <img src={uploadedImageBase64} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ) : section.type === "input" ? (
                          <Input
                            value={formData[section.id] || ""}
                            onChange={(e) => handleInputChange(section.id, e.target.value)}
                            placeholder={section.placeholder}
                            disabled={section.id === "authorName" && !!user?.name}
                          />
                        ) : (
                          <textarea
                            value={formData[section.id] || ""}
                            onChange={(e) => handleInputChange(section.id, e.target.value)}
                            placeholder={section.placeholder}
                            rows={section.rows}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        )}

                        {section.type === "file" && imageError && (
                          <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {imageError}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t pt-4">
                      <p className="text-xs text-muted-foreground">{getRequiredFieldsFilled() ? "✓ All required structures ready" : "⚠ Missing mandatory fields"}</p>
                      <Button type="submit" disabled={!getRequiredFieldsFilled() || isSubmitting}>
                        {isSubmitting ? "Uploading Node..." : "Submit for Review"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "status" && (
            <div className="space-y-4">
              {userBlogs.length === 0 ? (
                <div className="text-center py-16 bg-secondary/10 border border-dashed rounded-xl">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-base font-semibold">Your submission history is blank</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-4">You have not submitted any blogs yet.</p>
                  <Button onClick={() => setActiveTab("submit")} size="sm">Submit Your First Draft</Button>
                </div>
              ) : (
                userBlogs.map((blog) => {
                  const status = {
                    draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
                    pending: { label: "Awaiting Moderation", color: "bg-yellow-100 text-yellow-800" },
                    approved: { label: "Live / Approved", color: "bg-green-100 text-green-800" },
                    rejected: { label: "Revision Requested", color: "bg-red-100 text-red-800" },
                  }[blog.status]

                  return (
                    <div key={blog.id} className="p-5 border bg-white rounded-xl flex flex-col gap-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between border-b pb-4">
                        <div className="flex gap-4 items-start">
                          <img src={blog.imageUrl} className="w-14 h-14 object-cover border rounded-lg bg-gray-50 flex-shrink-0" alt="" />
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-2 ${blog.postType === 'research' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                              {blog.postType} framework
                            </span>
                            <h4 className="font-bold text-gray-900 text-base mt-1">{blog.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Author: {blog.authorName} • Posted: {new Date(blog.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border shadow-none ${status?.color}`}>
                          {status?.label}
                        </span>
                      </div>

                      {blog.formData && (
                        <div className="grid grid-cols-1 gap-3 text-sm bg-gray-50/70 p-4 rounded-lg border border-gray-100">
                          {blog.postType === "research" ? (
                            <>
                              <div><span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Executive Summary</span><p className="text-gray-600 mt-0.5">{blog.formData.summary}</p></div>
                              <div><span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Background & Context</span><p className="text-gray-600 mt-0.5">{blog.formData.background}</p></div>
                              <div><span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Key Findings & Data Points</span><p className="text-gray-600 mt-0.5">{blog.formData.findings}</p></div>
                              {blog.formData.implications && <div><span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Policy Implications</span><p className="text-gray-600 mt-0.5">{blog.formData.implications}</p></div>}
                              <div><span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Sources & References</span><p className="text-gray-500 text-xs italic mt-0.5">{blog.formData.sources}</p></div>
                            </>
                          ) : (
                            <>
                              <div><span className="font-semibold text-amber-900 block text-xs uppercase tracking-wide">Story Premise</span><p className="text-gray-600 mt-0.5">{blog.formData.summary}</p></div>
                              <div><span className="font-semibold text-amber-900 block text-xs uppercase tracking-wide">The Journey / Narrative</span><p className="text-gray-600 mt-0.5">{blog.formData.narrative}</p></div>
                              <div><span className="font-semibold text-amber-900 block text-xs uppercase tracking-wide">Lessons Learned & Impacts</span><p className="text-gray-600 mt-0.5">{blog.formData.impact}</p></div>
                            </>
                          )}
                          
                          {blog.feedback && (
                            <div className="mt-2 p-2.5 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs">
                              <strong>Revision Requested:</strong> {blog.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}