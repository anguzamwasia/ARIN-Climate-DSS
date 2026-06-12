"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Plus, MessageSquare, Sparkles, Globe, FileText, Database, ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; url: string }[]
  timestamp: Date
}

const suggestedPrompts = [
  { icon: Globe, title: "Climate Vulnerabilities", prompt: "What are the key climate vulnerabilities in East Africa?" },
  { icon: FileText, title: "Policy Analysis", prompt: "Summarize the latest UNFCCC policy recommendations for Africa" },
  { icon: Database, title: "Field Data Insights", prompt: "What insights can you provide from recent field submissions?" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }
  useEffect(() => { scrollToBottom() }, [messages])
  const handleNewChat = () => { setMessages([]); setInput("") }

  const handleSendMessage = async (content: string = input) => {
    if (!content.trim()) return
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: content.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content.trim() }),
      })
      const data = await res.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources?.map((s: string) => ({ title: s, url: "#" })) || [],
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I could not reach the backend. Please ensure the API server is running.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  return (
    <div className="flex h-screen bg-background">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="hidden md:flex flex-col bg-primary text-white overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                <Plus className="w-4 h-4" />New Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="text-xs font-medium text-white/50 px-3 py-2">Current Conversation</div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <Link href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-4 h-4" />Back to Home
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-2 hover:bg-secondary rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link href="/" className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg" alt="ARIN" width={120} height={40} className="object-contain" style={{ width: "auto", height: "36px" }} />
              <span className="text-lg font-semibold text-primary hidden sm:inline">Climate AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleNewChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">ARIN Climate AI Assistant</h1>
                <p className="text-muted-foreground text-sm md:text-base mb-8">Ask questions about climate data, policy reports, and field research across 30+ African countries.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button key={prompt.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleSendMessage(prompt.prompt)} className="p-4 bg-secondary/50 hover:bg-secondary rounded-xl text-left transition-colors group">
                      <prompt.icon className="w-5 h-5 text-accent mb-2" />
                      <div className="font-medium text-foreground text-sm mb-1">{prompt.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{prompt.prompt}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 md:py-8 px-4">
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  {message.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[80%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 md:gap-4">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <a key={idx} href={source.url} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground hover:text-primary transition-colors">
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{source.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 md:gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-accent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing data...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border bg-white p-3 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-secondary rounded-2xl p-2">
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about climate data, policies, or field research..." rows={1} className="flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 text-sm md:text-base" style={{ minHeight: "44px" }} />
              <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10 w-10 p-0 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">ARIN Climate AI uses data from UNFCCC reports, national policies, and field submissions.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
