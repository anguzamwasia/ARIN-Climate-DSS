import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const res = await fetch(`${apiUrl}/documents?limit=100`)
    const docs = await res.json()
    const countries = new Set(docs.map((d: any) => d.country).filter(Boolean))
    const kmd = docs.filter((d: any) => d.source === "KMD").length
    const stats = [
      { icon: "globe", value: countries.size, suffix: "+", label: "African Countries", description: "Research coverage" },
      { icon: "fileText", value: docs.length, suffix: "+", label: "Policy Reports", description: "UNFCCC & National" },
      { icon: "users", value: kmd || 4, suffix: "+", label: "Field Submissions", description: "KoboCollect data" },
    ]
    return NextResponse.json({ stats })
  } catch (e) {
    return NextResponse.json({ stats: [
      { icon: "globe", value: 30, suffix: "+", label: "African Countries", description: "Research coverage" },
      { icon: "fileText", value: 106, suffix: "+", label: "Policy Reports", description: "UNFCCC & National" },
      { icon: "users", value: 4, suffix: "+", label: "Field Submissions", description: "KoboCollect data" },
    ]})
  }
}
