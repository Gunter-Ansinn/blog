SITE := site

# ── Local development (admin editor) ─────────────────────────

dev:            ## Start local dev server (admin editor at /admin)
	cd $(SITE) && npm run dev

# ── Publishing ────────────────────────────────────────────────
# GitHub Actions deploys automatically on every push to main.
# Just commit and push — the workflow handles the rest.

push:           ## Commit all changes and push (triggers deploy)
	git add site/ .github/
	@read -p "Commit message: " msg; git commit -m "$$msg"
	git push

# ── Local static build (optional — mirrors what CI does) ─────

build:          ## Build static export locally (outputs to site/out)
	cd $(SITE) && GITHUB_ACTIONS=true npm run build

.PHONY: dev push build

help:
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
