import { NextResponse } from "next/server"

// This endpoint would typically fetch from a database
// For now, it returns default values that can be updated from the backend
export async function GET() {
  // In production, this would fetch from your database
  // Example: const stats = await db.stats.findMany()
  
  const stats = [
    { 
      icon: "globe", 
      value: 25, 
      suffix: "+", 
      label: "African Countries", 
      description: "Research coverage" 
    },
    { 
      icon: "fileText", 
      value: 15, 
      suffix: "+", 
      label: "Policy Reports", 
      description: "UNFCCC & National" 
    },
    { 
      icon: "users", 
      value: 50, 
      suffix: "+", 
      label: "Field Submissions", 
      description: "KoboCollect data" 
    },
  ]

  return NextResponse.json({ stats })
}
