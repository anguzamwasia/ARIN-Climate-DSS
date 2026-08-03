"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || "/"

  // Reset error and fields when toggling mode
  useEffect(() => {
    setError(null)
    setSuccessMessage(null)
    setConfirmPassword("")
  }, [isSignUp, isForgotPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    
    if (!email || !password) return
    if (isSignUp && !name) return

    if ((isSignUp || isForgotPassword) && password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      if (isForgotPassword) {
        // Reset Password API Call
        const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, new_password: password }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.detail || "Failed to reset password.")
        }

        setSuccessMessage("Password reset successfully! You can now sign in.")
        setIsForgotPassword(false)
        setPassword("")
        setConfirmPassword("")
      } else if (isSignUp) {
        // Sign Up API Call
        const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.detail || "Failed to sign up.")
        }

        // Successfully registered and logged in
        login(data.user, data.access_token)
        router.push(redirectUrl)

      } else {
        // Sign In API Call (OAuth2 requires form-urlencoded format)
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        const res = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.detail || "Invalid email or password.")
        }

        // Successfully logged in
        login(data.user, data.access_token)
        router.push(redirectUrl)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isForgotPassword 
                ? "Reset your account credentials."
                : isSignUp 
                  ? "Join the ARIN Climate DSS community." 
                  : "Welcome back to ARIN Climate DSS"}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isForgotPassword ? "New Password" : "Password"}</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isSignUp && !isForgotPassword && (
              <div className="text-right">
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMessage(null); }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {(isSignUp || isForgotPassword) && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{isForgotPassword ? "Confirm New Password" : "Confirm Password"}</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={(isSignUp || isForgotPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            
            <Button disabled={isLoading} type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isForgotPassword ? "Reset Password" : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          {isForgotPassword ? (
            <div className="mt-6 text-center text-sm">
              <button 
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMessage(null); }}
                className="text-primary hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
              </span>
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Suspense } from "react"

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
