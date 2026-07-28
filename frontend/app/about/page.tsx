"use client"

import { Header } from "@/components/header"
import { AboutSection } from "@/components/about-section"
import { ImpactSection } from "@/components/impact-section"
import { FeaturesSection } from "@/components/features-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div id="about">
          <AboutSection />
        </div>
        <div id="impact">
          <ImpactSection />
        </div>
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="contact">
          <ContactSection />
        </div>
      </div>
      <Footer />
    </main>
  )
}
