# Contributing to Raki

Thanks for taking the time to contribute. This document covers how to get a
change from idea to merged PR.

## Before you start

- For a small fix (typo, obvious bug), just open a PR directly.
- For anything larger (new feature, schema change, refactor), open an issue
  first describing the problem and your proposed approach, so we can align
  before you invest the time.
- Security issues are **not** reported here — see [SECURITY.md](SECURITY.md).

## Development setup

```bash
# Backend
cd backend
cp .env.example .env      # fill in DB/Redis/Google/Razorpay/Anthropic values
docker compose up postgres redis -d
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

See the main [README](README.md#-quick-start-local-development) for full
setup details.

## Making changes

1. **Fork** the repo and create a branch off `main`:
   ```bash
   git checkout -b feature/short-description
   ```
2. **Keep changes focused.** One logical change per PR — a bug fix doesn't
   need an unrelated refactor riding along with it.
3. **Follow existing conventions:**
   - **Backend** — standard Spring Boot layering
     (`controller` → `service` → `repository`), DTOs validated with Jakarta
     Bean Validation, no raw SQL string concatenation, no business logic in
     controllers.
   - **Frontend** — functional components, Tailwind utility classes for
     styling, Axios calls go through the shared `api` client
     (`src/api/`) — don't call `fetch` directly so the JWT/refresh
     interceptor stays consistent.
   - Match the naming and formatting already used in the file you're editing
     over introducing a new style.
4. **Don't add speculative abstractions.** Solve the problem in front of you;
   don't generalize for hypothetical future use cases.
5. **No secrets in commits.** `.env` is git-ignored — if you add a new
   config value, document it in `backend/.env.example` instead.

## Before opening a PR

```bash
cd backend && ./mvnw test
cd frontend && npm run lint && npm run build
```

Make sure both pass locally. If you added backend logic with non-trivial
behavior (auth, rate limiting, validation, the extraction pipeline), add or
update a test alongside it.

## Opening the PR

- Use a clear title describing the change.
- In the description, explain **why** the change is needed, not just what
  changed — the diff already shows the "what."
- Link any related issue.
- Keep the PR scoped — reviewers can move faster on a 100-line focused PR
  than a 1000-line mixed one.

## Code review

- Be responsive to review comments; if you disagree with a suggestion,
  explain your reasoning rather than silently ignoring it.
- Maintainers may ask for changes before merging — this is normal and not a
  rejection of the contribution.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/` — they prompt for
the information needed to reproduce or evaluate the request (repro steps,
expected vs. actual behavior, environment).
