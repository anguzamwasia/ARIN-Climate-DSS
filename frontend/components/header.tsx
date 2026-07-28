"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, Database, Bot, FileText, UserCircle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Features",
    href: "/about#features",
    submenu: [
      { label: "Data Sources", href: "/#data-sources", icon: Database },
      { label: "ARIN AI Chatbot", href: "/#chatbot", icon: Bot },
      { label: "Submit Blog", href: "/#blog", icon: FileText },
    ],
  },
  { label: "Read Blogs", href: "/blogs" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const { user, logout } = useAuth()

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user?.email) return
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications?email=${user.email}`)
        if (res.ok) {
          setNotifications(await res.json())
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 10000)
    return () => clearInterval(interval)
  }, [user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markRead = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/notifications/${id}/read`, { method: "POST" })
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const mappedNavItems = navItems

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg"
              alt="ARIN - Africa Research & Impact Network"
              width={180}
              height={60}
              className="object-contain"
              style={{ width: "auto", height: "56px" }}
              priority
            />
          </Link>
 
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mappedNavItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md hover:bg-secondary"
                >
                  {item.label}
                  {item.submenu && <ChevronDown className="w-4 h-4" />}
                </Link>

                {/* Desktop Submenu */}
                <AnimatePresence>
                  {item.submenu && activeSubmenu === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-border overflow-hidden"
                    >
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-foreground/80 hover:text-primary hover:bg-secondary transition-colors"
                        >
                          <subItem.icon className="w-4 h-4 text-accent" />
                          {subItem.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            {user?.email === 'admin@arin-africa.org' && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                  Admin Portal
                </Button>
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 text-foreground/80 hover:text-primary hover:bg-secondary rounded-full transition-colors focus:outline-none"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-600 text-white font-bold text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-96 flex flex-col"
                      >
                        <div className="p-3 bg-secondary/50 border-b border-border font-bold text-xs flex justify-between items-center text-foreground">
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">{unreadCount} new</span>
                          )}
                        </div>
                        <div className="overflow-y-auto divide-y divide-border flex-1">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => { markRead(n.id); if (n.title.includes("Revision") || n.title.includes("Requested")) window.location.href = "/blog/submit"; }}
                              className={`p-3 text-xs cursor-pointer hover:bg-secondary/40 transition-colors ${!n.is_read ? 'bg-primary/5 font-medium' : ''}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold ${!n.is_read ? 'text-primary' : 'text-foreground'}`}>{n.title}</span>
                                <span className="text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-muted-foreground leading-normal">{n.message}</p>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground italic">
                              No notifications yet.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserCircle className="w-5 h-5 text-primary" />
                  {user.name}
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/signin">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                {mappedNavItems.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className="block px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                      onClick={() => !item.submenu && setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.submenu && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <subItem.icon className="w-4 h-4 text-accent" />
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="px-4 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground p-2 bg-secondary rounded-md">
                        <UserCircle className="w-5 h-5 text-primary" />
                        {user.name}
                      </div>
                      {user.email === 'admin@arin-africa.org' && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                            Admin Portal
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
