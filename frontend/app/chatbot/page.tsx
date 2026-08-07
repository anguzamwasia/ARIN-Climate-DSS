"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { Send, Plus, MessageSquare, Sparkles, Globe, FileText, Database, ArrowLeft, Trash2, ThumbsUp, ThumbsDown, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; url: string }[]
  rating?: number
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

  // Fetch threads on mount
  useEffect(() => {
    if (user) {
      const fetchThreads = async () => {
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(`${API_URL}/chat/threads`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setChats(data.map((t: any) => ({
              id: t.id,
              title: t.title,
              messages: []
            })))
            if (data.length > 0) {
              setActiveChatId(data[0].id)
            }
          }
        } catch (err) {
          console.error("Failed to fetch threads", err)
        } finally {
          setIsInitialized(true)
        }
      }
      fetchThreads()
    }
  }, [user])

  // Fetch messages when activeChatId changes (and load them if not already in state)
  useEffect(() => {
    if (activeChatId && user) {
      const loadMessages = async () => {
        const session = chats.find(c => c.id === activeChatId)
        if (session && session.messages.length > 0) return // already loaded
        
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(`${API_URL}/chat/threads/${activeChatId}/messages`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setChats(prev => prev.map(c => 
              c.id === activeChatId ? {
                ...c,
                messages: data.map((m: any) => ({
                  id: m.id.toString(),
                  role: m.role,
                  content: m.content,
                  rating: m.rating,
                  sources: m.sources || [],
                  timestamp: m.created_at
                }))
              } : c
            ))
          }
        } catch (err) {
          console.error("Failed to load messages", err)
        }
      }
      loadMessages()
    }
  }, [activeChatId, user, chats])

  const activeMessages = chats.find(c => c.id === activeChatId)?.messages || []

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }
  useEffect(() => { scrollToBottom() }, [activeMessages])

  const handleNewChat = () => { 
    setActiveChatId(null)
    setInput("") 
  }

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_URL}/chat/threads/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== id))
        if (activeChatId === id) {
          setActiveChatId(null)
        }
      }
    } catch (err) {
      console.error("Failed to delete chat thread", err)
    }
  }

  const handleClearCurrentChat = async () => {
    if (activeChatId) {
      const token = localStorage.getItem("token")
      try {
        const res = await fetch(`${API_URL}/chat/threads/${activeChatId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          setChats(prev => prev.filter(c => c.id !== activeChatId))
          setActiveChatId(null)
        }
      } catch (err) {
        console.error("Failed to delete chat thread", err)
      }
    }
  }

  const handleSendMessage = async (content: string = input) => {
    if (!content.trim() || isLoading) return
    
    const userPrompt = content.trim()
    setInput("")
    setIsLoading(true)

    const tempUserMsgId = Date.now().toString()
    const userMessage: Message = {
      id: tempUserMsgId,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toISOString()
    }

    let currentThreadId = activeChatId
    const token = localStorage.getItem("token")

    try {
      // 1. Create a thread on the backend if none active
      if (!currentThreadId) {
        const titleText = userPrompt.substring(0, 30) + (userPrompt.length > 30 ? "..." : "")
        const createRes = await fetch(`${API_URL}/chat/threads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title: titleText }),
        })
        if (!createRes.ok) throw new Error("Failed to create chat thread")
        const newThread = await createRes.json()
        currentThreadId = newThread.id
        
        const newSession: ChatSession = {
          id: currentThreadId,
          title: newThread.title,
          messages: [userMessage]
        }
        setChats(prev => [newSession, ...prev])
        setActiveChatId(currentThreadId)
      } else {
        setChats(prev => prev.map(chat => 
          chat.id === currentThreadId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
        ))
      }

      // 2. Post question to get AI answer
      const messageRes = await fetch(`${API_URL}/chat/threads/${currentThreadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question: userPrompt }),
      })
      if (!messageRes.ok) throw new Error("Failed to send message to backend")
      
      const assistantMsgData = await messageRes.json()
      
      const assistantMessage: Message = {
        id: assistantMsgData.id.toString(),
        role: "assistant",
        content: assistantMsgData.content,
        sources: assistantMsgData.sources?.map((s: any) => {
          const title = typeof s === 'string' ? s : s.title;
          let url = typeof s === 'string' ? "#" : (s.url || "#");
          if (url !== "#" && !url.startsWith("http")) {
            url = `${API_URL}/uploads/${url}`;
          }
          return { title, url };
        }) || [],
        timestamp: assistantMsgData.created_at,
      }

      setChats(prev => prev.map(chat => 
        chat.id === currentThreadId ? {
          ...chat,
          title: chat.title === "New Chat" ? userPrompt.substring(0, 30) + (userPrompt.length > 30 ? "..." : "") : chat.title,
          messages: [...chat.messages.filter(m => m.id !== tempUserMsgId), userMessage, assistantMessage]
        } : chat
      ))
    } catch (e) {
      console.error(e)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I could not process your request. Please ensure the API server is running and you are logged in.",
        timestamp: new Date().toISOString(),
      }
      setChats(prev => prev.map(chat => 
        chat.id === currentThreadId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    if (!activeChatId) return

    const activeMessages = chats.find(c => c.id === activeChatId)?.messages || []
    const messageIndex = activeMessages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const assistantMsg = activeMessages[messageIndex]
    const userMsg = messageIndex > 0 ? activeMessages[messageIndex - 1] : null
    const question = userMsg ? userMsg.content : ""

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === messageId) {
              return { ...m, rating }
            }
            return m
          })
        }
      }
      return chat
    }))

    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/chat/messages/${messageId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: question,
          response: assistantMsg.content,
          rating: rating
        })
      })
    } catch (e) {
      console.error("Failed to submit feedback", e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <Button 
          onClick={() => {
            handleNewChat()
            if (window.innerWidth < 768) {
              setSidebarOpen(false)
            }
          }} 
          variant="outline" 
          className="flex-1 justify-start gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
        >
          <Plus className="w-4 h-4" />New Chat
        </Button>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="md:hidden p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chats.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No conversations yet</p>
          </div>
        ) : (
          <>
            <div className="text-xs font-semibold text-white/40 px-3 py-2 uppercase tracking-wider">Recent Chats</div>
            {chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => {
                  setActiveChatId(chat.id)
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false)
                  }
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${activeChatId === chat.id ? 'bg-white/15 border-l-4 border-accent text-white font-medium' : 'hover:bg-white/5 text-white/80'}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span className="text-sm truncate">{chat.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 hover:bg-white/10 rounded transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="p-4 border-t border-white/10">
        <div className="px-3 py-2.5 text-sm text-white/80 break-words flex items-center gap-3 bg-white/5 rounded-xl border border-white/10">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="truncate min-w-0">
            <div className="font-semibold text-white truncate text-xs">{user?.name}</div>
            <div className="text-white/55 text-[10px] truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="pt-16 flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
          
          {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
          <div className="hidden md:block">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside 
                  initial={{ width: 0, opacity: 0 }} 
                  animate={{ width: 280, opacity: 1 }} 
                  exit={{ width: 0, opacity: 0 }} 
                  transition={{ duration: 0.2 }} 
                  className="flex flex-col h-full bg-primary text-white overflow-hidden border-r border-white/10"
                >
                  {renderSidebarContent()}
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Drawer (visible on mobile, hidden on md+) */}
          <div className="md:hidden">
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40 pt-16"
                  />
                  {/* Sliding Panel */}
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-16 left-0 bottom-0 w-[280px] bg-primary text-white z-50 flex flex-col shadow-2xl"
                  >
                    {renderSidebarContent()}
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </div>

          <main className="flex-1 flex flex-col min-w-0 bg-secondary/15">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"
                  title="Toggle Chat History"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  Climate AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeMessages.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={handleClearCurrentChat}>
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
                    <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-2">Welcome, {user?.name}</h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">Ask questions about climate data, policy reports, and field research across 30+ African countries.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {suggestedPrompts.map((prompt, index) => (
                        <motion.button key={prompt.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleSendMessage(prompt.prompt)} className="p-4 bg-white border border-border hover:border-accent/40 rounded-xl text-left transition-all shadow-sm hover:shadow group hover:translate-y-[-2px]">
                          <prompt.icon className="w-5 h-5 text-accent mb-2" />
                          <div className="font-bold text-foreground text-sm mb-1">{prompt.title}</div>
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
                        <div className="max-w-[85%] md:max-w-[80%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
                          <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                        </div>
                      ) : (
                        <div className="flex gap-3 md:gap-4">
                          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-1 shadow">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm md:text-base text-foreground leading-relaxed">
                              <ReactMarkdown components={{
                                p: ({node, ...props}) => <p className="whitespace-pre-wrap mb-3" {...props} />,
                                strong: ({node, ...props}) => <span className="font-bold text-primary" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-muted-foreground" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-muted-foreground" {...props} />,
                                li: ({node, ...props}) => <li {...props} />
                              }}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            {/* Sources & Feedback Row */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-secondary/40 pt-2.5">
                              {message.sources && message.sources.filter(s => s.url !== "#").length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {message.sources.filter(s => s.url !== "#").map((source, idx) => (
                                    <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                      <FileText className="w-3 h-3 text-accent" />
                                      <span className="truncate max-w-[200px]">{source.title}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : <div />}

                              <div className="flex items-center gap-2 ml-auto">
                                {message.rating ? (
                                  <span className="text-[10px] text-accent font-medium bg-accent/5 px-2.5 py-1 rounded-full border border-accent/20">Feedback received!</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">Was this helpful?</span>
                                )}
                                <button
                                  onClick={() => handleFeedback(message.id, 1)}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    message.rating === 1 ? 'text-accent bg-accent/10 scale-105 font-bold' : 'text-muted-foreground hover:text-accent hover:bg-secondary'
                                  }`}
                                  title="Thumbs Up"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(message.id, -1)}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    message.rating === -1 ? 'text-red-500 bg-red-50 scale-105 font-bold' : 'text-muted-foreground hover:text-red-500 hover:bg-secondary'
                                  }`}
                                  title="Thumbs Down"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
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

            <div className="border-t border-border bg-white p-3 md:p-4 shadow-md">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-secondary rounded-2xl p-2 border border-border focus-within:ring-1 focus-within:ring-accent focus-within:bg-white transition-all shadow-inner">
                  <textarea 
                    ref={textareaRef} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Ask about climate data, policies, or field research..." 
                    rows={1} 
                    className="flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 text-sm md:text-base" 
                    style={{ minHeight: "44px" }} 
                  />
                  <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10 w-10 p-0 flex-shrink-0 transition-transform active:scale-95 shadow">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">ARIN Climate AI uses data from UNFCCC reports, national policies, and field submissions.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
