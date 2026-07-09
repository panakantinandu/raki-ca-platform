package com.caagent.service;

/**
 * FAQ + product context fed to the Layer B AI support assistant as its system prompt (see
 * SupportChatService). Hand-kept in sync with the FAQ content shown on the frontend
 * (landing page FAQ.jsx + the Support page's extra logged-in-user questions) - there's no
 * shared source between a Java backend and a JS frontend, so this is duplicated by design,
 * not an oversight.
 */
final class SupportFaqContent {

    private SupportFaqContent() {}

    static final String TEXT = """
            PRODUCT CONTEXT:
            Raki is a SaaS practice-management tool for Chartered Accountant (CA) firms in India.
            It tracks clients, filing deadlines (GSTR1, GSTR3B, ITR, TDS, AUDIT), and documents.
            It can use AI to extract fields (GSTIN, amount, date, vendor name, document number)
            from an uploaded invoice/document image or PDF, but a CA always reviews and confirms
            the extracted data before it's relied on anywhere - nothing is auto-filed.

            FREQUENTLY ASKED QUESTIONS:

            Q: Does Raki file returns on its own?
            A: No. Raki prepares and pre-fills the return using your client's documents, but a CA
            always reviews and files. Nothing goes to a government portal without your approval.

            Q: What happens to my data if I cancel?
            A: You can export every client record, filing, and document at any time. If you
            cancel, your data stays available for 30 days before deletion.

            Q: Can my team log in too?
            A: Yes - Growth and Large Firm plans include multiple seats, so associates can manage
            their own client sets under one firm account.

            Q: Does it integrate with Tally or Zoho?
            A: A direct sync is on the roadmap. For now, you can export filings and client data as
            CSV to bring into your existing tools.

            Q: How do I add a recurring filing?
            A: Open a client's page, go to Filing Templates, and set a filing type plus the day of
            the month it's due. Raki automatically creates that period's filing every month on a
            nightly job - no need to create it by hand each time.

            Q: How do I share a client's status with them?
            A: On a client's detail page, toggle "Share status link" - this generates a public,
            read-only link (no login needed) showing that client's filing statuses, which you can
            send them directly.

            Q: What happens if a document extraction fails?
            A: If the AI extraction service is unavailable or times out, the document is marked
            "failed" and it does not count against your monthly extraction quota - you can just
            retry. If the document was actually processed but nothing invoice-like was found in
            it, it still counts (a real AI call was made), and you'll see empty/partial fields
            you can fill in by hand.

            Q: How many document extractions do I get per month?
            A: This depends on your plan - check the Billing page for your plan's monthly
            extraction limit. It resets at the start of each calendar month.
            """;
}
