"use client"

import { motion } from "framer-motion"
import { ArrowRight, Database, Bot, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const features = [
  { icon: Database, label: "Multi-Source Data" },
  { icon: Bot, label: "AI Chatbot" },
  { icon: BarChart3, label: "Real-Time Viz" },
  { icon: FileText, label: "Blog System" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-primary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-24 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-white/90 font-medium">AI-Powered Climate Intelligence</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              Transforming{" "}
              <span className="text-accent">Climate Data</span>
              <br />
              Into Action
            </h1>

            <p className="text-lg lg:text-xl text-white/70 mb-8 max-w-xl mx-auto lg:mx-0">
              An extensible AI-driven end-to-end climate data processing pipeline delivering real-time insights for sustainable development across Africa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-8"
                asChild
              >
                <Link href="#features">
                  Explore Features
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-base px-8"
                asChild
              >
                <Link href="#contact">
                  Contact Us
                </Link>
              </Button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <feature.icon className="w-4 h-4 text-accent" />
                  <span className="text-sm text-white/80">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central Hub */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-accent flex items-center justify-center shadow-2xl shadow-accent/30"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="text-center text-white">
                  <div className="text-2xl font-bold">DSS</div>
                  <div className="text-xs opacity-80">Climate AI</div>
                </div>
              </motion.div>

              {/* Orbiting Elements */}
              {[
                { angle: 0, icon: Database, label: "Data", delay: 0, href: "/data-sources" },
                { angle: 90, icon: Bot, label: "AI", delay: 0.5, href: null },
                { angle: 180, icon: BarChart3, label: "Viz", delay: 1, href: null },
                { angle: 270, icon: FileText, label: "Blog", delay: 1.5, href: null },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="absolute w-20 h-20"
                  style={{
                    top: `${50 + 40 * Math.sin((item.angle * Math.PI) / 180)}%`,
                    left: `${50 + 40 * Math.cos((item.angle * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: item.delay,
                    ease: "easeInOut",
                  }}
                >
                  {item.href ? (
                    <Link href={item.href} className="w-full h-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center gap-1 hover:bg-white/20 hover:border-accent/50 transition-colors cursor-pointer">
                      <item.icon className="w-6 h-6 text-accent" />
                      <span className="text-xs text-white/80">{item.label}</span>
                    </Link>
                  ) : (
                    <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center gap-1">
                      <item.icon className="w-6 h-6 text-accent" />
                      <span className="text-xs text-white/80">{item.label}</span>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-45deg)" }}>
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="rgba(0, 196, 179, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="10 5"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
          <motion.div
            className="w-1.5 h-3 rounded-full bg-accent"
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}
