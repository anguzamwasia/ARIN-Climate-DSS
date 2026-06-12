"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import {
  Database,
  Bot,
  FileText,
  CheckCircle2,
  ArrowRight,
  Globe,
  Mic,
  Shield,
  Send,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    id: "data-sources",
    icon: Database,
    title: "Multi-Source Data Collection",
    subtitle: "Comprehensive Coverage",
    description: "We gather and process climate data from multiple trusted sources across 25+ African countries to provide you with comprehensive insights.",
    capabilities: [
      "UNFCCC Policy Reports & Documents",
      "National Climate Submissions",
      "Field Data from KoboCollect",
      "Audio & Video Transcriptions",
    ],
    highlight: "Data from 25+ African countries",
    link: "/data-sources",
    linkText: "Browse Data Sources",
    visual: (
      <div className="relative h-64 lg:h-80">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {[
              { label: "UNFCCC", icon: Globe, top: "0%", left: "10%", source: "UNFCCC" },
              { label: "KoboCollect", icon: Database, top: "0%", right: "10%", source: "KMD" },
              { label: "Audio/Video", icon: Mic, bottom: "0%", left: "10%", source: "WHISPER" },
              { label: "National Data", icon: FileText, bottom: "0%", right: "10%", source: "KNBS" },
            ].map((source, idx) => (
              <motion.div
                key={source.label}
                style={{ ...source, position: "absolute" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
              >
                <Link
                  href={`/data-sources?source=${source.source}`}
                  className="w-24 h-20 bg-white rounded-lg shadow-md border border-border flex flex-col items-center justify-center hover:shadow-lg hover:border-accent transition-all cursor-pointer"
                >
                  <source.icon className="w-5 h-5 text-accent mb-1" />
                  <span className="text-xs text-muted-foreground text-center">{source.label}</span>
                </Link>
              </motion.div>
            ))}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Link
                href="/data-sources"
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <Database className="w-8 h-8 text-white" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "chatbot",
    icon: Bot,
    title: "AI Climate Assistant",
    subtitle: "Ask Questions Naturally",
    description: "Get instant answers to your climate questions. Our AI assistant understands natural language and provides sourced responses from our comprehensive database.",
    capabilities: [
      "Ask questions in plain language",
      "Get answers with source citations",
      "Access data from all our sources",
      "Available 24/7 for your research",
    ],
    highlight: "Every answer includes source references",
    link: "/chatbot",
    linkText: "Try the AI Assistant",
    visual: (
      <div className="relative h-64 lg:h-80 bg-secondary/30 rounded-xl p-4 overflow-hidden">
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-[80%] bg-accent/10 rounded-xl rounded-bl-none p-3"
          >
            <p className="text-sm text-foreground">What are the key climate challenges in East Africa?</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-[80%] ml-auto bg-primary text-white rounded-xl rounded-br-none p-3"
          >
            <p className="text-sm">Based on our data from UNFCCC reports and field research, key challenges include water scarcity, agricultural impacts...</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-white/70">
              <FileText className="w-3 h-3" />
              <span>Source: UNFCCC Report 2024</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-border"
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 text-sm text-muted-foreground">Ask about climate data...</div>
            <Bot className="w-5 h-5 text-accent" />
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "blog",
    icon: FileText,
    title: "Share Your Research",
    subtitle: "Contribute to the Community",
    description: "Submit your climate research findings using our structured template. Our editorial team reviews all submissions to ensure quality and accuracy before publication.",
    capabilities: [
      "Easy-to-use submission template",
      "Track your submission status",
      "Editorial review for quality assurance",
      "Get feedback on your submissions",
    ],
    highlight: "Quality-assured content publication",
    link: "/blog/submit",
    linkText: "Submit a Blog Post",
    visual: (
      <div className="relative h-64 lg:h-80 bg-secondary/30 rounded-xl p-4">
        <div className="flex flex-col h-full justify-center">
          {[
            { icon: Send, label: "Submit", desc: "Write & submit your research", status: "complete" },
            { icon: Shield, label: "Review", desc: "Editorial team reviews", status: "active" },
            { icon: CheckCircle2, label: "Publish", desc: "Content goes live", status: "pending" },
          ].map((step, idx) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                step.status === "complete" ? "bg-accent text-white" :
                step.status === "active" ? "bg-primary text-white" :
                "bg-border text-muted-foreground"
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{step.label}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>
              {idx < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} id="features" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            What We Offer
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary mb-4">
            Our <span className="text-accent">Key Features</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access comprehensive climate data, get AI-powered insights, and contribute your research to Africa&apos;s climate knowledge base.
          </p>
        </motion.div>

        {/* Features */}
        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              id={feature.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-accent uppercase tracking-wider">{feature.subtitle}</div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-primary">{feature.title}</h3>
                  </div>
                </div>

                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{feature.description}</p>

                {/* Capabilities */}
                <ul className="space-y-3 mb-6">
                  {feature.capabilities.map((capability) => (
                    <li key={capability} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="text-foreground">{capability}</span>
                    </li>
                  ))}
                </ul>

                {/* Highlight */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium mb-4">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {feature.highlight}
                </div>

                {/* CTA Link */}
                {feature.link && (
                  <div className="mt-4">
                    <Link href={feature.link}>
                      <Button className="bg-accent hover:bg-accent/90 text-white">
                        {feature.linkText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Visual */}
              <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
                  {feature.visual}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
