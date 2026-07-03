"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { Send, Plus, MessageSquare, Sparkles, Globe, FileText, Database, ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; url: string }[]
  timestamp: string | Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
}

const suggestedPrompts = [
  { icon: Globe, title: "Climate Vulnerabilities", prompt: "What are the key climate vulnerabilities in East Africa?" },
  { icon: FileText, title: "Policy Analysis", prompt: "Summarize the latest UNFCCC policy recommendations for Africa" },
  { icon: Database, title: "Field Data Insights", prompt: "What insights can you provide from recent field submissions?" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ChatbotPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [isInitialized, setIsInitialized] = useState(false)

  // Load chats from local storage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`arin_chats_${user.email}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setChats(parsed)
          setActiveChatId((prev) => {
            if (!prev && parsed.length > 0) return parsed[0].id
            return prev
          })
        } catch(e) {}
      }
      setIsInitialized(true)
    }
  }, [user])

  // Save chats to local storage
  useEffect(() => {
    if (user && isInitialized) {
      localStorage.setItem(`arin_chats_${user.email}`, JSON.stringify(chats))
    }
  }, [chats, user, isInitialized])

  const activeMessages = chats.find(c => c.id === activeChatId)?.messages || []

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }
  useEffect(() => { scrollToBottom() }, [activeMessages])

  const handleNewChat = () => { 
    setActiveChatId(null)
    setInput("") 
  }

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setChats(prev => prev.filter(c => c.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
    }
  }

  const handleClearCurrentChat = () => {
    if (activeChatId) {
      setChats(prev => prev.filter(c => c.id !== activeChatId))
      setActiveChatId(null)
    }
  }

  const handleSendMessage = async (content: string = input) => {
    if (!content.trim()) return
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: content.trim(), timestamp: new Date().toISOString() }
    
    let currentSessionId = activeChatId
    
    // Create new session if none active
    if (!currentSessionId) {
      currentSessionId = Date.now().toString()
      const newSession: ChatSession = {
        id: currentSessionId,
        title: content.trim().substring(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [userMessage]
      }
      setChats(prev => [newSession, ...prev])
      setActiveChatId(currentSessionId)
    } else {
      setChats(prev => prev.map(chat => 
        chat.id === currentSessionId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
      ))
    }
    
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
        sources: data.sources?.map((s: any) => {
          const title = typeof s === 'string' ? s : s.title;
          let url = typeof s === 'string' ? "#" : (s.url || "#");
          if (url !== "#" && !url.startsWith("http")) {
            url = `${API_URL}/uploads/${url}`;
          }
          return { title, url };
        }) || [],
        timestamp: new Date().toISOString(),
      }
      
      setChats(prev => prev.map(chat => 
        chat.id === currentSessionId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat
      ))
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I could not reach the backend. Please ensure the API server is running.",
        timestamp: new Date().toISOString(),
      }
      setChats(prev => prev.map(chat => 
        chat.id === currentSessionId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="hidden md:flex flex-col bg-primary text-white overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                  <Plus className="w-4 h-4" />New Chat
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-medium text-white/50 px-3 py-2 uppercase tracking-wider">Chat History</div>
                    {chats.map(chat => (
                      <div 
                        key={chat.id} 
                        onClick={() => setActiveChatId(chat.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group ${activeChatId === chat.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                          <span className="text-sm truncate opacity-90">{chat.title}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="mb-4 px-3 py-2 text-sm text-white/80 break-words flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="truncate">
                    <div className="font-medium">{user?.name}</div>
                  </div>
                </div>
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
              {activeMessages.length > 0 && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClearCurrentChat}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete Chat</span>
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Welcome, {user?.name}</h1>
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
                {activeMessages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 ${message.role === "user" ? "flex justify-end" : ""}`}>
                    {message.role === "user" ? (
                      <div className="max-w-[85%] md:max-w-[80%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                      </div>
                    ) : (
                      <div className="flex gap-3 md:gap-4">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm md:text-base text-foreground leading-relaxed">
                            <ReactMarkdown components={{
                              p: ({node, ...props}) => <p className="whitespace-pre-wrap mb-3" {...props} />,
                              strong: ({node, ...props}) => <span className="font-bold text-primary" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li {...props} />
                            }}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.sources.map((source, idx) => (
                                <a key={idx} href={source.url} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                                  <FileText className="w-3 h-3 text-accent" />
                                  <span className="truncate max-w-[200px]">{source.title}</span>
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
              <div className="relative flex items-end gap-2 bg-secondary rounded-2xl p-2 border border-border focus-within:ring-1 focus-within:ring-accent transition-all">
                <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about climate data, policies, or field research..." rows={1} className="flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 text-sm md:text-base" style={{ minHeight: "44px" }} />
                <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10 w-10 p-0 flex-shrink-0 transition-transform active:scale-95">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">ARIN Climate AI uses data from UNFCCC reports, national policies, and field submissions.</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
