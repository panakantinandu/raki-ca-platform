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

export default function Terms() {
  return (
    <div className="min-h-screen bg-ink font-sans text-parchment">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className="label-eyebrow">Legal</span>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-parchment">Terms of Service</h1>
        <p className="mt-3 font-mono text-xs text-parchment-faint">Last updated: 9 July 2026</p>

        <Section title="1. What Raki is">
          <p>Raki is a practice-management tool for Chartered Accountant firms: it helps you
            track clients, filing deadlines, and documents, and can use AI to speed up reading
            invoices and documents. Raki is a preparation and tracking tool for your firm's own
            use - it is not a filing agent.</p>
        </Section>

        <Section title="2. No filing without your review">
          <p><strong className="text-parchment">No filing is ever submitted to any government
            portal by Raki.</strong> Any AI-extracted data must be reviewed and confirmed by you
            or another authorized user on your account before it's used anywhere else in the
            app. Marking a filing as "filed" in Raki is a record-keeping action you take
            yourself - it does not submit anything on your behalf.</p>
        </Section>

        <Section title="3. Accounts and trials">
          <p>New accounts start on a 14-day trial. After the trial, continued use requires an
            active paid subscription on one of our published plans. We may change plan pricing
            or features with reasonable notice; changes won't retroactively alter a billing
            period you've already paid for.</p>
        </Section>

        <Section title="4. Acceptable use">
          <p>Don't use Raki to store or process data you're not authorized to handle, attempt to
            access another firm's account or data, interfere with the service's operation, or
            use the AI extraction feature for anything other than your own clients' documents in
            the ordinary course of accounting practice.</p>
        </Section>

        <Section title="5. Data and cancellation">
          <p>You can export your data at any time. If you cancel, your data remains available
            for 30 days before deletion, as described in our{' '}
            <a href="/privacy" className="text-brass hover:underline">Privacy Policy</a>.</p>
        </Section>

        <Section title="6. Limitation of liability">
          <p>Raki is provided "as is." We work hard to keep filing dates, calculations, and
            AI-extracted data accurate, but you remain responsible for verifying anything before
            it's relied on for an actual filing or financial decision. To the maximum extent
            permitted by law, Raki and its operators are not liable for indirect, incidental, or
            consequential damages arising from use of the service, including any late fees,
            penalties, or losses resulting from a missed or incorrect filing.</p>
        </Section>

        <Section title="7. Termination">
          <p>You may cancel your account at any time from Settings. We may suspend or terminate
            an account that violates these terms, with notice where reasonably possible.</p>
        </Section>

        <Section title="8. Changes to these terms">
          <p>We may update these terms as the product evolves. Material changes will be
            communicated via email or an in-app notice.</p>
        </Section>

        <Section title="9. Contact">
          <p>Questions about these terms? Reach us via the{' '}
            <a href="/contact" className="text-brass hover:underline">contact form</a>.</p>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
