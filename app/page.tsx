'use client'

import BootSequence from '@/components/BootSequence'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ProofBar from '@/components/landing/ProofBar'
import PoweredBy from '@/components/landing/PoweredBy'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import USP from '@/components/landing/USP'
import Agents from '@/components/landing/Agents'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import AuthModal from '@/components/modals/AuthModal'
import PayModal from '@/components/modals/PayModal'
import DeepAuditModal from '@/components/modals/DeepAuditModal'
import AppOverlay from '@/components/app/AppOverlay'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { openAuth, openApp } = useAuth()

  return (
    <>
      {/* Boot loader */}
      <BootSequence />

      {/* Scroll progress bar */}
      <div id="sp" />

      {/* Cursor glow */}
      <div id="cg" />

      {/* Navigation */}
      <Nav />

      {/* Landing page sections */}
      <main>
        <Hero />
        <ProofBar />
        <PoweredBy />
        <Features />
        <HowItWorks />
        <USP />
        <Agents />
        <Pricing />
        <FAQ />

        {/* CTA section */}
        <section className="cta">
          <h2 className="cta-t rv">Ready to Secure Your Contracts?</h2>
          <p className="cta-d rv">3 free audits. No credit card. Under 60 seconds.</p>
          <div className="rv" style={{ position: 'relative', zIndex: 1 }}>
            <button
              className="btn-p"
              onClick={openAuth}
              style={{ fontSize: '10px', padding: '14px 32px' }}
            >
              START FREE AUDIT NOW
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals */}
      <AuthModal />
      <PayModal />
      <DeepAuditModal />

      {/* Authenticated app overlay */}
      <AppOverlay />

      {/* Toast notifications */}
      <div id="toast-container" />
    </>
  )
}
