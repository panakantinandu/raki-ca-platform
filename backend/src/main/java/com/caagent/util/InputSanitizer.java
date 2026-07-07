package com.caagent.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.owasp.encoder.Encode;

/**
 * Sanitizes free-text user input before it's persisted or rendered.
 *
 * Note on SQL injection: this class is NOT what protects against SQL injection.
 * That protection comes from never building SQL via string concatenation -
 * every query in this codebase goes through Spring Data JPA / Hibernate, which
 * always uses parameterized (prepared statement) queries. This class instead
 * guards against stored/reflected XSS in fields like "notes" that get rendered
 * back into the frontend.
 */
public final class InputSanitizer {

    // Strict policy: plain text only, no HTML tags allowed at all in fields like
    // client notes. We don't need rich text anywhere in this domain.
    private static final PolicyFactory PLAIN_TEXT_POLICY = new HtmlPolicyBuilder()
            .toFactory();

    private InputSanitizer() {}

    /** Strips any HTML/script content, leaving plain text only. */
    public static String sanitizePlainText(String input) {
        if (input == null) return null;
        String sanitized = PLAIN_TEXT_POLICY.sanitize(input.trim());
        // The sanitizer strips tags/scripts (that's the actual XSS defense) but HTML-entity-
        // encodes what's left, since it's built to emit HTML-safe markup. We're storing plain
        // text that React will already escape on render, so decode the fixed set of entities
        // it can produce - otherwise ordinary names/notes containing "&" or "'" come back
        // permanently corrupted with literal "&amp;"/"&#39;" text.
        return sanitized
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&");
    }

    /** HTML-encodes a value for safe inclusion in an HTML context (defense in depth alongside a React frontend that already escapes by default). */
    public static String encodeForHtml(String input) {
        if (input == null) return null;
        return Encode.forHtml(input);
    }

    /** Basic allow-list check for identifiers like GSTIN/PAN to reject anything unexpected early. */
    public static boolean isAlphanumeric(String input) {
        return input != null && input.matches("^[A-Za-z0-9]*$");
    }
}
