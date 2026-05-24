"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Globe, FileText, Users } from "lucide-react"
import useSWR from "swr"

interface Stat {
  icon: typeof Globe
  value: number
  suffix: string
  label: string
  description: string
}

const defaultStats: Stat[] = [
  { icon: Globe, value: 25, suffix: "+", label: "African Countries", description: "Research coverage" },
  { icon: FileText, value: 15, suffix: "+", label: "Policy Reports", description: "UNFCCC & National" },
  { icon: Users, value: 50, suffix: "+", label: "Field Submissions", description: "KoboCollect data" },
]

const iconMap: Record<string, typeof Globe> = {
  globe: Globe,
  fileText: FileText,
  users: Users,
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

export function ImpactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Fetch stats from backend - falls back to default if API unavailable
  const { data: apiStats } = useSWR<{ stats: Array<{ icon: string; value: number; suffix: string; label: string; description: string }> }>(
    "/api/stats",
    fetcher,
    { 
      fallbackData: { stats: [] },
      revalidateOnFocus: false,
    }
  )

  // Use API stats if available, otherwise use defaults
  const stats: Stat[] = apiStats?.stats && apiStats.stats.length > 0 
    ? apiStats.stats.map(s => ({
        ...s,
        icon: iconMap[s.icon] || Globe,
      }))
    : defaultStats

  return (
    <section ref={ref} className="py-20 lg:py-28 bg-secondary/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Our Reach
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary mb-4">
            Our <span className="text-accent">Impact</span> Across Africa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bridging the gap between climate research and actionable policy decisions through AI-driven insights.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <stat.icon className="w-7 h-7 text-accent group-hover:text-white transition-colors" />
                </div>

                {/* Value */}
                <div className="text-5xl lg:text-6xl font-bold text-primary mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-foreground mb-1">{stat.label}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>

                {/* Decorative element */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent/20 rounded-full group-hover:w-24 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
