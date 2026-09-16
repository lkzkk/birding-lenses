# Project update rules

## Atomic data and deployment changes

Birding Kit Explorer data changes frequently span several mutually dependent files: kit records, component prices, compatibility metadata, source notes, coverage audit, tests, and sometimes UI/runtime code. These files must be treated as one logical transaction.

### Required sequence for multi-file changes

1. Create or use a non-deploy working branch from the current `main` commit.
2. Apply all related file changes on that branch. Do **not** publish partially updated data files to `main` one at a time.
3. Run the structural validation against the complete branch state.
4. Promote the finished branch commit to `main` only after the dataset, audit metadata, tests, and UI agree.
5. GitHub Pages validates and deploys only the latest `main` commit. Rapidly superseded `main` commits are skipped rather than reported as failed deployments.

### Test design rule

Tests must verify relationships and invariants rather than hard-code the current total number of kits or lenses. Dataset growth is expected. For example, a supported ordinary 1.4× lens must have exactly native + 1.4× records; a built-in-TC lens must have four states; and an explicitly unsupported lens must have one native state. The overall kit count should be derived from these rules rather than stored as a magic number.

### GitHub API/tooling rule

If an editing tool normally creates one commit per file, use a temporary branch for those commits and move `main` only once after the complete change set is ready. Low-level Git tree/blob commits are also acceptable when they create the whole change atomically.
