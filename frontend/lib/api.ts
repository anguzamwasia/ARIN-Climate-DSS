// Small fetch wrapper that attaches the JWT saved by AuthContext (localStorage
// "arin_token") as an Authorization header. Needed because the backend now
// requires auth on admin/write routes -- previously it accepted every request
// from any origin, so nothing in the frontend ever had to send the token.
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("arin_token") : null
  const headers = new Headers(init.headers || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
