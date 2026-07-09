// Shared between the landing page FAQ and the logged-in Support tab, so there's one place
// that knows the public-facing answers to these questions.
export const LANDING_FAQS = [
  {
    q: 'Does Raki file returns on its own?',
    a: 'No. Raki prepares and pre-fills the return using your client\'s documents, but a CA always reviews and files. Nothing goes to a portal without your approval.'
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You can export every client record, filing, and document at any time. If you cancel, your data stays available for 30 days before deletion.'
  },
  {
    q: 'Can my team log in too?',
    a: 'Yes - Growth and Large Firm plans include multiple seats, so associates can manage their own client sets under one firm account.'
  },
  {
    q: 'Does it integrate with Tally or Zoho?',
    a: 'A direct sync is on the roadmap. For now, you can export filings and client data as CSV to bring into your existing tools.'
  }
]

// Extra questions only relevant once you're actually using the product - shown on the
// Support tab in addition to the landing-page FAQ above.
export const DASHBOARD_FAQS = [
  {
    q: 'How do I add a recurring filing?',
    a: 'Open a client\'s page, go to Filing Templates, and set a filing type plus the day of the month it\'s due. Raki automatically creates that period\'s filing every month via a nightly job.'
  },
  {
    q: 'How do I share a client\'s status?',
    a: 'On a client\'s detail page, toggle "Share status link" to generate a public, read-only link (no login needed) showing that client\'s filing statuses, which you can send them directly.'
  },
  {
    q: 'What happens if a document extraction fails?',
    a: 'If our extraction service is unavailable or times out, the document is marked "failed" and it does not count against your monthly extraction quota - just retry. If the document was processed but nothing invoice-like was found, it still counts (a real AI call was made) and you\'ll see empty fields you can fill in by hand.'
  },
  {
    q: 'How many document extractions do I get per month?',
    a: 'This depends on your plan - check the Billing page for your plan\'s monthly extraction limit. It resets at the start of each calendar month.'
  },
  {
    q: 'How do I contact support?',
    a: 'Ask a question above for an instant AI-assisted answer, or submit a ticket below - our team will reply and you\'ll see the reply here and get a notification.'
  }
]
