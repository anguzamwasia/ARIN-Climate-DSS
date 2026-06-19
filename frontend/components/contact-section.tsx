"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Send, Mail, User, MessageSquare, MapPin, Phone, Loader2, CheckCircle2 } from "lucide-react"
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
  // 💡 Relaxed margin to "-10px" so animation renders reliably even on shorter screen viewports
  const isInView = useInView(ref, { once: true, margin: "-10px" })
  
  // UI interaction tracking state variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  // 🔒 Live Submission Handler Linked to your Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({ type: "error", text: "Please populate all system input fields before submitting." })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Target delivery server rejected engagement payload matrix.")
      }

      setSubmitStatus({ 
        type: "success", 
        text: "🎉 Message sent! Thank you for reaching out, the ARIN team will respond shortly." 
      })
      
      // Clear form inputs after successful submission
      setFormData({ name: "", email: "", message: "" })
    } catch (err: any) {
      setSubmitStatus({ 
        type: "error", 
        text: err.message || "Failed to establish a network connection. Please try again later." 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" ref={ref} className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} // Fallback transparency anchor
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
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
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
                    required
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
                    required
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
                    required
                    placeholder="Tell us about your inquiry..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              {/* Interactive Form Processing Feedback Alerts */}
              {submitStatus && (
                <div className={`p-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${submitStatus.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  {submitStatus.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  <span>{submitStatus.text}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Message...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info Card Panel Layout Map Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="p-5 bg-secondary/50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {info.label}
                      </div>
                      <div className="font-medium text-foreground text-sm">{info.value}</div>
                      {info.subValue && (
                        <div className="text-xs text-muted-foreground mt-0.5">{info.subValue}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Interactive Map Area */}
            <div className="relative h-64 bg-secondary/50 rounded-xl overflow-hidden border border-gray-100">
              <iframe
                src="https://maps.google.com/maps?q=ACK%20Gardens%20House,%20Nairobi,%20Kenya&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}