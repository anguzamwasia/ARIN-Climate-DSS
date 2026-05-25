import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ImpactSection } from "@/components/impact-section"
import { AboutSection } from "@/components/about-section"
import { FeaturesSection } from "@/components/features-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ImpactSection />
      <AboutSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
