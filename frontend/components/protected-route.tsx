"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait a brief moment to allow localStorage to load in AuthContext
    const timer = setTimeout(() => {
      if (!user) {
        // Redirect to signin, optionally pass the return URL
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`)
      } else {
        setIsChecking(false)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [user, router, pathname])

  if (isChecking) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
