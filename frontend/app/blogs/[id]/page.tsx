"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, User, Calendar, Loader2 } from "lucide-react"
import { Header } from "@/components/header"

interface Blog {
  id: string
  title: string
  authorName: string
  imageUrl?: string
  postType: "research" | "story"
  status: "draft" | "pending" | "approved" | "rejected"
  submittedAt: string
  formData?: Record<string, string>
}

export default function BlogDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/blogs/${id}`)
        if (res.ok) {
          const data = await res.json()
          setBlog({
            id: data.id.toString(),
            title: data.title,
            authorName: data.author_name,
            postType: data.post_type,
            status: data.status,
            submittedAt: data.submitted_at,
            imageUrl: data.image_url,
            formData: {
              summary: data.summary,
              findings: data.findings,
              narrative: data.narrative,
              impact: data.impact,
              sources: data.sources,
              background: data.background
            }
          })
        } else {
          setError(true)
        }
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10 pt-32 max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
          <p className="text-gray-500 mb-8">The content you are looking for does not exist or has been removed.</p>
          <button onClick={() => router.push("/blogs")} className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition">
            Browse All Content
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-10 pt-28 max-w-4xl">
        <button 
          onClick={() => router.push("/blogs")} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Content Hub
        </button>

        <article className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {blog.imageUrl ? (
            <div className="relative h-64 md:h-96 w-full bg-gray-100">
              <img 
                src={blog.imageUrl} 
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 md:p-10">
                <span className={`w-fit mb-4 text-xs uppercase font-bold tracking-wide px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md ${blog.postType === 'research' ? 'bg-blue-100/90 text-blue-800' : 'bg-amber-100/90 text-amber-800'}`}>
                  {blog.postType === 'research' ? '🔬 Research Paper' : '🌱 Community Story'}
                </span>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                  {blog.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{blog.authorName}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(blog.submittedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 border-b">
              <span className={`w-fit mb-4 text-xs uppercase font-bold tracking-wide px-3 py-1.5 rounded-full shadow-sm ${blog.postType === 'research' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                {blog.postType === 'research' ? '🔬 Research Paper' : '🌱 Community Story'}
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight mt-4">
                {blog.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-foreground">{blog.authorName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(blog.submittedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 md:p-10 space-y-10">
            {blog.postType === "research" ? (
              <>
                {blog.formData?.background && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Background Context
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{blog.formData.background}</p>
                  </section>
                )}
                
                {blog.formData?.summary && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Executive Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{blog.formData.summary}</p>
                  </section>
                )}

                {blog.formData?.findings && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Key Findings & Insights
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{blog.formData.findings}</p>
                  </section>
                )}

                {blog.formData?.sources && (
                  <section className="pt-6 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">References & Sources</h2>
                    <p className="text-gray-500 text-sm italic leading-relaxed whitespace-pre-wrap">{blog.formData.sources}</p>
                  </section>
                )}
              </>
            ) : (
              <>
                {blog.formData?.summary && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-amber-600 rounded-full"></span>
                      Story Premise
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg italic">{blog.formData.summary}</p>
                  </section>
                )}

                {blog.formData?.narrative && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-amber-600 rounded-full"></span>
                      Lived Narrative
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{blog.formData.narrative}</p>
                  </section>
                )}

                {blog.formData?.impact && (
                  <section className="bg-amber-50 p-6 md:p-8 rounded-xl border border-amber-100">
                    <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                      Community Impact & Action
                    </h2>
                    <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">{blog.formData.impact}</p>
                  </section>
                )}
              </>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
