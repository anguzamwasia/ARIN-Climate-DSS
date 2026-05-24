"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Send, Mail, User, MessageSquare, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const contactInfo = [
  {
    icon: MapPin,
    label: "Location",
    value: "ACK Gardens House, 1st Ngong Ave",
    subValue: "Upperhill, Nairobi, Kenya",
  },
  {
    icon: Mail,
    label: "P.O Box",
    value: "53358 - 00200",
    subValue: "Nairobi, Kenya",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+254 746 130 873",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@arin-africa.org",
  },
]

export function ContactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic would go here
    console.log("Form submitted:", formData)
  }

  return (
    <section ref={ref} className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Get In Touch
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary mb-4">
            Have a question or want to{" "}
            <span className="text-accent">collaborate</span> with ARIN?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reach out to us for partnership opportunities, technical inquiries, or to learn more about the Climate DSS project.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us about your inquiry..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Send Message
                <Send className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Info Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="p-5 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {info.label}
                      </div>
                      <div className="font-medium text-foreground">{info.value}</div>
                      {info.subValue && (
                        <div className="text-sm text-muted-foreground">{info.subValue}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Map Placeholder */}
            <div className="relative h-64 bg-secondary/50 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-accent mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                  <p className="text-xs text-muted-foreground mt-1">Interactive map coming soon</p>
                </div>
              </div>
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(to right, #021d49 1px, transparent 1px), linear-gradient(to bottom, #021d49 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
