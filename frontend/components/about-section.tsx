"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Target, Layers, Brain, BarChart2, Activity } from "lucide-react"

const objectives = [
  {
    icon: Layers,
    title: "Multi-Source Data Integration",
    description: "Automatically capturing international and local policies, community insights from interviews, and real-time field data collection.",
    color: "bg-accent",
  },
  {
    icon: Brain,
    title: "AI-Driven Knowledge Packaging",
    description: "A flexible AI assistant that fetches and synthesizes climate data in real-time through natural language queries.",
    color: "bg-primary",
  },
  {
    icon: Target,
    title: "Knowledge Synthesis",
    description: "Converting research narratives and qualitative transcripts into actionable insights through advanced language processing.",
    color: "bg-accent",
  },
  {
    icon: BarChart2,
    title: "Interactive Visualizations",
    description: "Dynamic maps and charts that display climate data with source citations for immediate decision support.",
    color: "bg-primary",
  },
  {
    icon: Activity,
    title: "Data Analysis",
    description: "Providing robust statistical and thematic analysis on environmental data to reveal hidden trends and inform strategic decisions.",
    color: "bg-accent",
  },
]

export function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} id="about" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              What We Do
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary mb-6 leading-tight">
              Transforming Research into{" "}
              <span className="text-accent">Lasting Impact</span>{" "}
              Across Africa
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              ARIN is Africa&apos;s premier research network — connecting scholars, institutions, and policymakers to drive evidence-based solutions that shape millions of lives across the continent through eight thematic disciplines.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Our Climate Decision Support System (DSS) integrates climate data from multiple sources into a unified, dialogue-driven platform. It enables researchers and policymakers to query data through natural language, generate insights from field submissions, and visualize climate trends — all in one place.
            </p>
          </motion.div>

          {/* Right Content - Objectives Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {objectives.map((objective, index) => (
              <motion.div
                key={objective.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group p-6 rounded-xl bg-white border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300 ${
                  index === 4 ? "sm:col-span-2" : ""
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${objective.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <objective.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{objective.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{objective.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
