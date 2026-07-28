"use client"

import { Header } from "@/components/header"
import { AboutSection } from "@/components/about-section"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div id="about">
          <AboutSection />
        </div>
      </div>
      <Footer />
    </main>
  )
}
