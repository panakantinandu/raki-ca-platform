import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-medium text-parchment">{title}</h2>
      <div className="mt-3 space-y-3 font-sans text-sm leading-relaxed text-parchment-muted">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-ink font-sans text-parchment">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className="label-eyebrow">Legal</span>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-parchment">Privacy Policy</h1>
        <p className="mt-3 font-mono text-xs text-parchment-faint">Last updated: 9 July 2026</p>

        <div className="mt-6 rounded-md border border-brass/30 bg-brass/5 px-4 py-3 font-sans text-sm text-parchment-muted">
          Raki is a startup in active development. This page describes, honestly and as
          precisely as we can, what data we actually collect and what we do with it today - it
          is not a substitute for a lawyer-reviewed policy. If you're a firm considering putting
          real client data through Raki at scale, we recommend having your own counsel review
          this before you do, and we intend to get this formally reviewed ourselves as the
          product and its data footprint grow.
        </div>

        <Section title="1. What we collect">
          <p>When you create an account, we collect your full name, email address, phone
            number (optional), and firm name. When you add clients, we store the client
            information you enter: name, entity type, GSTIN, PAN, email, phone, and any notes
            you add. When you upload documents (invoices, receipts, and similar files) for a
            client, we store those files and any data extracted from them.</p>
        </Section>

        <Section title="2. AI-powered document extraction (Anthropic)">
          <p>Raki can use AI to read an uploaded document and pull out fields like GSTIN,
            amount, date, vendor name, and document number. This only happens when you
            explicitly click "Extract" on a document - we never send a document to any AI
            service automatically on upload.</p>
          <p>When you do trigger extraction, the document's contents are sent to{' '}
            <strong className="text-parchment">Anthropic</strong> (the maker of the Claude
            models) as a subprocessor, solely to perform that extraction. Anthropic processes
            this data to generate a response and, per their standard API terms, does not use
            API inputs to train their models. The extracted result is stored in our database
            and always requires your review and confirmation before it's relied on anywhere
            else in the app - nothing is auto-filed or auto-submitted from an AI extraction.</p>
        </Section>

        <Section title="3. Where your data is stored">
          <p>Application data (accounts, clients, filings, documents, extracted data, support
            tickets) is stored in a PostgreSQL database. The application itself is deployed on
            Railway. Uploaded document files are currently stored on the application server's
            disk; we plan to move this to dedicated object storage (e.g. S3-compatible) as we
            scale.</p>
          <p>We retain your data for as long as your account is active. If you cancel, your
            data remains available for 30 days (so you can export it or reactivate) before
            deletion. Contact us if you'd like your data deleted sooner.</p>
        </Section>

        <Section title="4. Authentication">
          <p>We use JWT-based access tokens (short-lived) and refresh tokens (longer-lived) to
            keep you signed in. These are stored in your browser and used only to authenticate
            your requests to our API - we don't use third-party analytics or advertising
            cookies.</p>
        </Section>

        <Section title="5. Who else sees your data">
          <p>Nobody outside your firm account, except: Anthropic (for documents you explicitly
            submit for extraction, as described above), and our hosting/database providers, who
            process data on our behalf under standard infrastructure agreements and don't access
            it for their own purposes.</p>
        </Section>

        <Section title="6. Your rights">
          <p>You can export your client, filing, and document data at any time from within the
            app. To request a copy of your data or ask us to delete it, contact us using the
            details below.</p>
        </Section>

        <Section title="7. Contact">
          <p>For privacy questions or data deletion requests, use the{' '}
            <a href="/contact" className="text-brass hover:underline">contact form</a>, or email
            us directly. We're a small team and will get back to you personally.</p>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
