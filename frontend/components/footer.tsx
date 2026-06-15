"use client"

import Link from "next/link"
import Image from "next/image"
import { Twitter, Linkedin, Youtube, Mail, ExternalLink } from "lucide-react"

const footerLinks = {
  quickLinks: [
    { label: "Home", href: "#" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Contact", href: "#contact" },
  ],
  resources: [
    { label: "AI Assistant", href: "/chatbot" },
    { label: "Submit Blog", href: "/blog/submit" },
    { label: "Documentation", href: "#" },
    { label: "Support", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/arin_africa", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/arin-africa", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/@arin-africa", label: "YouTube" },
  { icon: Mail, href: "mailto:info@arin.org", label: "Email" },
]

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center mb-6">
              <div className="bg-white rounded-lg p-2">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-PPdpF8VNtfjX7cklPViGsEk4BGiGHl.jpg"
                  alt="ARIN - Africa Research & Impact Network"
                  width={160}
                  height={50}
                  className="object-contain"
                  style={{ width: "auto", height: "50px" }}
                />
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Africa Research and Impact Network - Empowering research and driving sustainable development across Africa through AI-driven climate intelligence.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-accent transition-colors text-sm flex items-center gap-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-accent transition-colors text-sm flex items-center gap-2"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Our Location</h3>
            <address className="not-italic text-white/70 text-sm leading-relaxed">
              ACK Gardens House
              <br />
              1st Ngong Ave, Upperhill
              <br />
              Nairobi, Kenya
              <br />
              P.O Box 53358 - 00200
              <br />
              <br />
              <a href="tel:+254746130873" className="hover:text-accent transition-colors">
                +254 746 130 873
              </a>
              <br />
              <a href="mailto:info@arin-africa.org" className="hover:text-accent transition-colors">
                info@arin-africa.org
              </a>
            </address>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} ARIN. All rights reserved.
            </p>
            <p className="text-white/50 text-sm">
              Proudly created by{" "}
              <a
                href="https://arin-africa.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Africa Research and Impact Network
              </a>
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-white/50 hover:text-accent transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
