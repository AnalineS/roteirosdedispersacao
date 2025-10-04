# Sync Strategy Decision - dependabot-updates → hml

## Current Situation (2025-10-04)

### Branch States

**hml branch**:
- ✅ FASE 2 merged (commit 453a86b3):
  - pytest 8.4.2
  - celery 5.5.3 (with asyncio fix)
  - pytest-cov 7.0.0
  - coverage 7.10.6
  - 3 test files converted to pytest fixtures
- ✅ Branch protection enabled
- ✅ All workflows passing

**dependabot-updates branch**:
- ✅ 4 frontend PRs merged:
  - #199: dompurify 3.2.6 + @types/dompurify 3.2.1
  - #196: jspdf 3.0.3
  - #198: build-tools (typescript, postcss, autoprefixer)
  - #194: sharp 0.34.4
- ✅ 4 workflow PRs merged (#169, #167, #166, #165)
- 🔄 PR #215 (react-ecosystem) has auto-merge pending

### Attempted Direct Merge

**Command**: `git merge origin/dependabot-updates`

**Result**: FAILED with 6 conflicts:

1. **apps/backend/requirements.txt**:
   - AI/ML section: torch 2.8.0 (hml) vs newer versions (dependabot)
   - Testing section: pytest 8.4.2 (hml) vs pytest 7.4.3 (dependabot)
   - Monitoring: psutil 7.0.0 (hml) vs 7.1.0 (dependabot)

2. **Workflow files** (3 conflicts):
   - `.github/workflows/hml-pipeline.yml` - deleted in hml, modified in dependabot
   - `.github/workflows/main-pipeline.yml` - deleted in hml, modified in dependabot
   - `.github/workflows/qa-automation.yml` - deleted in hml, modified in dependabot

3. **Frontend files** (2 conflicts):
   - `apps/frontend-nextjs/package.json`
   - `apps/frontend-nextjs/package-lock.json`

### Root Cause

FASE 2 (hml) made structural changes that conflict with incremental dependabot updates:

- Backend requirements were upgraded and reorganized
- Old workflows were deleted and replaced with unified pipeline
- Frontend package.json had breaking changes

## Decision: Create Consolidation PR Instead

### Strategy

Instead of direct merge, create a **Consolidation PR** (#217) that:

1. **Base**: `hml` branch (keeps FASE 2 changes intact)
2. **Head**: `feature/dependabot-consolidation` (cherry-pick frontend changes only)
3. **Scope**: ONLY frontend package updates from dependabot-updates
4. **Validation**: Full CI/CD validation before merge

### Advantages

✅ **Safety**: All changes reviewed in PR before merging
✅ **Clarity**: Clear diff showing exactly what's changing
✅ **Validation**: CI runs on combined state before merge
✅ **Rollback**: Easy to close PR if issues found
✅ **Audit**: Complete history of what was included/excluded

### Implementation Steps

**Step 1**: Create feature branch from hml
```bash
git checkout hml
git checkout -b feature/dependabot-consolidation
```

**Step 2**: Cherry-pick frontend changes
```bash
# Get commits from dependabot-updates that touch frontend only
git log origin/dependabot-updates --not origin/hml --oneline -- apps/frontend-nextjs

# Cherry-pick each frontend commit
git cherry-pick <commit-hash> ...
```

**Step 3**: Create PR
```bash
gh pr create \
  --base hml \
  --head feature/dependabot-consolidation \
  --title "chore: sync frontend dependencies from dependabot-updates" \
  --body "..."
```

**Step 4**: Validate and merge
- ✅ Wait for CI to pass
- ✅ Review changes
- ✅ Merge to hml
- ✅ Deploy to staging

## Alternative Approach (If Cherry-pick Fails)

If cherry-picking has conflicts, manually apply changes:

**Step 1**: Extract frontend package.json from dependabot-updates
```bash
git show origin/dependabot-updates:apps/frontend-nextjs/package.json > /tmp/package.json
```

**Step 2**: Review and merge manually
```bash
# Compare with hml version
diff apps/frontend-nextjs/package.json /tmp/package.json

# Apply only safe changes (exclude breaking changes)
```

**Step 3**: Regenerate lock file
```bash
cd apps/frontend-nextjs
npm install
git add package-lock.json
```

## What Gets Excluded (For Now)

These changes from dependabot-updates will NOT be included:

❌ **Backend requirements updates** - Already superseded by FASE 2
❌ **Workflow modifications** - Old workflows deleted in hml
❌ **Breaking changes** - Deferred for review

These will be handled separately:
- Backend PR #164 (google-cloud-logging) - validate in staging
- Major frontend PRs (#186, #206) - review tomorrow

## Success Criteria

✅ hml has all 4 frontend dependency updates
✅ FASE 2 backend changes remain intact
✅ All workflows pass
✅ Staging deployment successful
✅ Medical chat functionality validated

## Next Steps

1. Create feature/dependabot-consolidation branch
2. Apply frontend changes (cherry-pick or manual)
3. Create consolidation PR #217
4. Validate in CI
5. Merge to hml
6. Deploy and test staging

## Monitoring

After merge to hml, validate:
- ✅ Frontend builds successfully
- ✅ All tests pass
- ✅ Medical chat works (Dr. Gasnelio + Gá)
- ✅ No new errors in logs
- ✅ Performance metrics stable

---

**Created**: 2025-10-04 16:05:00 BRT
**Branch**: hml
**Status**: Strategy defined, ready to implement
