"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, User, BookMarked, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"

type BlogStatus = "draft" | "pending" | "approved" | "rejected"
type PostType = "research" | "story"

interface Blog {
  id: string
  title: string
  authorName: string
  imageUrl?: string
  postType: PostType
  status: BlogStatus
  submittedAt: string
  formData?: Record<string, string>
}

export default function PublicBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/blogs?status=approved`)
        if (res.ok) {
          const data = await res.json()
          const mapped = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            authorName: b.author_name,
            postType: b.post_type,
            status: b.status,
            submittedAt: b.submitted_at,
            imageUrl: b.image_url,
            formData: {
              summary: b.summary,
              findings: b.findings,
              narrative: b.narrative,
              impact: b.impact,
              sources: b.sources,
              background: b.background
            }
          }))
          setBlogs(mapped)
        }
      } catch (err) {}
    }
    fetchBlogs()
  }, [])

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.authorName.toLowerCase().includes(search.toLowerCase()) ||
    b.formData?.summary?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-10 pt-24 max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-primary mb-3">Climate Content Hub</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore empirical climate research and inspiring local community stories shared by the ARIN community.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search blogs, authors, or topics..." 
              className="pl-10 rounded-full bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-secondary/20 rounded-xl border border-dashed mt-4">
              <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No published blogs yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later for new community stories and research.</p>
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <Link href={`/blogs/${blog.id}`} key={blog.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group cursor-pointer block">
                <div>
                  {blog.imageUrl && (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-50 border-b">
                      <img 
                        src={blog.imageUrl} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-1 rounded shadow-sm ${blog.postType === 'research' ? 'bg-blue-100/90 text-blue-800' : 'bg-amber-100/90 text-amber-800'}`}>
                        {blog.postType === 'research' ? '🔬 Research Paper' : '🌱 Story'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <User className="w-3.5 h-3.5 text-primary" /> 
                      <span className="font-medium text-foreground">{blog.authorName}</span>
                      <span>•</span> 
                      <span>{new Date(blog.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{blog.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{blog.formData?.summary}</p>
                  </div>
                </div>
                
                {blog.postType === "research" && blog.formData?.sources && (
                  <div className="mx-5 mb-5 pt-4 border-t border-border/50 text-xs text-muted-foreground italic truncate">
                    <span className="font-medium text-foreground/70 not-italic">Sources:</span> {blog.formData.sources}
                  </div>
                )}
                {blog.postType === "story" && (
                  <div className="mx-5 mb-5 pt-4 border-t border-border/50 text-xs text-amber-700/80 font-medium flex items-center gap-1.5">
                    ✨ Read Community Narrative
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
