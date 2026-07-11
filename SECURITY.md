# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, **please do not
open a public GitHub issue or pull request.** Public disclosure before a fix
is available puts every deployment of this codebase at risk.

Instead, report it privately by emailing:

**nandupanakanti@gmail.com**

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it (a minimal repro is ideal).
- Any suggested remediation, if you have one.

You should expect an acknowledgement within **5 business days**. We'll keep
you updated as the issue is triaged and fixed, and we're happy to credit
reporters in the fix notes unless you'd prefer to remain anonymous.

Please give a reasonable window to address the issue before any public
disclosure.

## Supported versions

This project is under active development on `main`. Only the latest commit
on `main` is supported with security fixes — there are no maintained release
branches at this time.

| Version         | Supported |
|------------------|:-----------:|
| `main` (latest)  | ✅          |
| Older commits    | ❌          |

## Security features already in place

This project implements a number of protections by default — parameterized
queries throughout, strict input validation and sanitization, short-lived
JWTs with rotating hashed refresh tokens, BCrypt password hashing with
account lockout, Redis-backed rate limiting, CORS allow-lists, standard
security headers (CSP/HSTS/X-Frame-Options), and per-owner data scoping.

See [README.md § Security features implemented](README.md#-security-features-implemented)
for the full list, and the **What to add before real production use**
subsection there for known gaps (HTTPS termination, WAF, secrets manager,
transactional email, Razorpay webhook verification, object storage) that
should be closed before a real production deployment.

## Scope

This policy covers the code in this repository. It does not cover
third-party services it integrates with (Google OAuth, Anthropic API,
Razorpay) — report issues in those services to their respective vendors.
