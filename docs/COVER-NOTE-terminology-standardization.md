# Cover Note: Terminology Standardization

**Date:** 2026-03-13
**From:** Platform Team
**To:** All Teams

---

## What changed

We have standardized the naming convention for our application hierarchy. Aligning with global enterprise software best practices (Salesforce, ServiceNow, SAP, TOGAF), we are renaming the following terms effective immediately:

| Old Term | New Term | Why |
|----------|----------|-----|
| **Suite** | **Edition** | "Edition" is the industry-standard term for buyer-specific packaging in enterprise SaaS. It communicates tiered, configurable offerings without implying a rigid bundle. Used by Salesforce (Enterprise Edition, Unlimited Edition), ServiceNow, and others. |
| **Product Category** | **Business Line** | "Business Line" is standard in insurance and financial services. It directly maps to P&L ownership (Distribution = revenue center, Servicing = cost center) and is immediately understood by C-suite buyers. |
| **Product Line** | **Capability Area** | The old term collided with insurance industry terminology where "product line" means health, motor, life, etc. "Capability Area" is the TOGAF-standard term and avoids ambiguity in sales conversations. |
| **Sub-module** | **Feature** | "Feature" is the natural buyer-facing term. "Does this module include feature X?" is how customers actually talk. |
| **Module** | **Module** | No change — universally understood across enterprise software. |

## The new hierarchy

```
Edition > Business Line > Capability Area > Module > Feature
```

Example: **Insurer Edition > Servicing > Claim Management > Medical Adjudication > AI-assisted coding**

## What to do

1. **Use the new terms** in all new documents, presentations, and conversations
2. **Reference the catalog** — the full Business Module Catalog v1.0 has been published with these terms applied throughout
3. **No code changes needed now** — code-level identifiers (module codes like PM.01, CM.IPD.12) remain unchanged
4. **Gradually update** existing documents when you next touch them — no need for a bulk rename

## Where to find the catalog

`docs/02-business-module-catalog.md` — this is the single source of truth for the business module inventory, hierarchy, and their relationship to the platform.

---

*Questions? Reach out to the Platform Team.*
