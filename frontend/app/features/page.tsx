"use client"

import { Header } from "@/components/header"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <FeaturesSection />
      </div>
      <Footer />
    </main>
  )
}
