import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ImpactSection } from "@/components/impact-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ImpactSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
