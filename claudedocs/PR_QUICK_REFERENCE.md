# PR Consolidation Quick Reference Card

**Status**: 13 open PRs → 8 actions today (3 close + 5 merge)

---

## Phase 1: CLOSE Superseded Backend PRs (5 min)

```bash
gh pr close 180 --comment "Superseded by FASE 2 merge (commit 453a86b3). pytest-cov 7.0.0 already in hml."

gh pr close 179 --comment "Superseded by FASE 2 merge (commit 453a86b3). pytest 8.4.2 already in hml."

gh pr close 156 --comment "Superseded by FASE 2 merge (commit 453a86b3). celery 5.5.3 already in hml."
```

---

## Phase 2: MERGE Safe Frontend PRs (2-3 hours)

### Order: #199 → #196 → #198 → #194 → #215

```bash
# Setup
cd "c:\Users\Ana\Meu Drive\Site roteiro de dispensação\apps\frontend-nextjs"

# 1. dompurify (security)
gh pr merge 199 --squash --body "Security: dompurify patch"
npm run type-check && npm run lint && npm run build:staging

# 2. jspdf (PDF lib)
gh pr merge 196 --squash --body "Patch: jspdf 3.0.3"
npm run type-check && npm run lint && npm run build:staging

# 3. build-tools (dev)
gh pr merge 198 --squash --body "Dev: build-tools update"
npm run type-check && npm run lint && npm run build:staging

# 4. sharp (dev)
gh pr merge 194 --squash --body "Dev: sharp 0.34.4"
npm run type-check && npm run lint && npm run build:staging

# 5. react-ecosystem (8 packages)
gh pr merge 215 --squash --body "React ecosystem: 8 packages"
npm run type-check && npm run lint && npm run build:staging
```

---

## Validation After All Merges

```bash
# Full test suite
cd "c:\Users\Ana\Meu Drive\Site roteiro de dispensação\apps\frontend-nextjs"

npm run type-check
npm run lint
npm run build:staging
npm run test:unit
npm run test:integration
```

---

## Deploy to Staging

```bash
git push origin dependabot-updates

# Monitor: https://hml-frontend-4f2gjf6cua-uc.a.run.app/
# Test: Chat médico (Dr. Gasnelio + Gá)
```

---

## Emergency Rollback

```bash
cd "c:\Users\Ana\Meu Drive\Site roteiro de dispensação"
git checkout dependabot-updates
git log --oneline -5
git revert <bad-commit> -m 1
git push origin dependabot-updates
```

---

## Defer for Later

| PR | Action | When |
|----|--------|------|
| #186 | ESLint 9.x | Review tomorrow |
| #206 | lint-staged 16.x | After ESLint |
| #195 | testing-tools | After safe merges |
| #164 | google-cloud-logging | After frontend validated |
| #209 | hml → main | After all updates |

---

## Success Checklist

- [ ] Phase 1: 3 PRs closed (5 min)
- [ ] Phase 2: 5 PRs merged (2-3 hours)
- [ ] All tests passing
- [ ] Staging deployed
- [ ] Chat médico validated
- [ ] No errors in logs

---

**Full Details**: See `claudedocs/REMAINING_PRS_ACTION_PLAN.md`
