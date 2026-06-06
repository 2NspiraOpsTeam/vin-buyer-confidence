# Coordination Rules for Parallel Work

## Purpose
Prevent merge conflicts and product drift while Adam, Cleo, Maya, and Brian work in parallel on `2NspiraOpsTeam/vin-buyer-confidence`.

## Current Team Lanes

### Brian owns organization and triage
**Brian should work on:**
- GitHub issue creation, cleanup, labels, and sequencing
- Dependency mapping across Adam, Cleo, and Maya
- Acceptance checklist coordination
- Duplicate/overlap prevention
- Status updates for Jeffrey

**Brian should avoid:**
- Production code changes unless Jeffrey explicitly assigns a coding task
- Pushing directly to main

### Adam owns review and architecture
**Adam should work on:**
- Architecture and system design decisions
- API/dashboard contract review
- Provider/source status model design
- Evidence-gap mapping design
- PR review for production-impacting code
- Release-readiness decisions

**Adam should avoid:**
- Owning routine implementation tickets that Cleo can execute
- Final marketing/copy rewrites unless pulling approved Maya copy
- Broad UI polish work unless reviewing Cleo's implementation against the architecture

### Cleo owns implementation and QA
**Cleo should work on:**
- Implementation tickets
- UI fixes and small code changes
- Browser QA and regression checks
- Mobile layout and sticky action implementation
- Applying approved design/copy into the app
- Opening PRs from feature branches

**Cleo should avoid:**
- Changing API/data contracts without Adam review
- Changing product positioning or trust language without Maya input
- Pushing directly to main

### Maya owns copy and messaging
**Maya should work on:**
- Product positioning
- Buyer-facing messaging
- FAQ and objection handling
- Trust and source-confidence language
- Seller-question templates
- Conversion/action microcopy

**Maya should avoid:**
- Editing core app logic
- Changing layouts or CSS directly unless the change is copy-only and scoped
- Replacing Cleo's UI structure or Adam's architecture decisions

## Recommended Coordination Rule

When a task needs another person's layer, leave a comment with:
- What changed
- What decision is needed
- Exact issue, file, or product surface affected

## Safety Rules

- No one pushes directly to main
- Coding work should happen in feature branches
- Completed implementation work should become a pull request
- Adam reviews production-impacting architecture and release risk
- Brian keeps the issue board organized and prevents overlap

## Current Open Issues by Lane

### Adam (Architecture/Review)
- Issue #24: Design source-confidence legend and evidence-card hierarchy (P0 - blocked pending implementation)

### Cleo (Implementation/QA)
- Issue #10: Replace emoji UI with consistent icon language
- Issue #12: Premium visual QA pass for buyer-confidence feel
- Issue #5: Extract shared CSS and component primitives
- Issue #6: Implement mobile nav and sticky buyer actions
- Issue #7: Make /customer decision-first with seeded sample or empty state

### Maya (Copy/Messaging)
- Issue #39: Create a separate app logo for VIN Buyer Confidence
- Issue #37: Make the 2Nspira logo larger, more prominent, and clickable
- Issue #34: Remove paid / checkout language while product is free
- Issue #27: Add buyer scenario examples to support conversion
- Issue #25: Redesign landing page social proof and trust section
- Issue #26: Create conversion microcopy for report actions
- Issue #16: Build trust, FAQ, and objection-handling copy
- Issue #15: Draft seller-question and next-step communication templates
- Issue #11: Rewrite placeholder copy into buyer-facing confidence language

### Brian (Organization/Triage)
- No open issues assigned to Brian

## Next Steps

1. Review and approve this coordination document
2. Update team members on their lane responsibilities
3. Brian to organize upcoming issues by lane
4. Adam to review architecture decisions for pending implementation tickets
