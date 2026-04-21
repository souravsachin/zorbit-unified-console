# AWNIC Demo — Handover Document
## Date: 2026-04-08 | Prepared by: Claude (overnight session)

---

## Executive Summary

The AWNIC health insurance demo flow is **operational end-to-end**. All critical paths verified via both API tests (13/13 pass) and Playwright browser automation (7/7 journeys, 361 steps, 0 failures).

---

## Overnight Work — Waves Completed

### Wave 1: Core Backend (4 soldiers) — ALL COMPLETE

| Soldier | Deliverable | Repo | Status |
|---------|-------------|------|--------|
| 1 | **DocGenerator PFS** | zorbit-pfs-doc_generator | DEPLOYED (port 3136). Puppeteer + Handlebars. 3 templates seeded: policy-certificate, quotation-summary, premium-breakdown |
| 2 | **UW Workflow Improvements** | zorbit-app-uw_workflow | DEPLOYED. Queue routing by premium/members/region. 7 action types (approve, approve_with_loading, add_exclusion, add_waiting_period, refer, decline, request_info). Status flow enforced |
| 3 | **Channel + Broker + Analytics** | zorbit-app-hi_quotation | DEPLOYED. channel/source/brokerHashId fields. Aggregator lead API (POST /leads). Analytics endpoints (channels, sources, brokers) |
| 4 | **Policy PDF Template** | zorbit-app-uw_workflow | DEPLOYED. Replaced PDFKit with Puppeteer HTML-to-PDF. Professional 2-page certificate with navy header, tables, member schedule, regulatory footer |

### Wave 2: Frontend + E2E (2 soldiers) — ALL COMPLETE

| Soldier | Deliverable | Repo | Status |
|---------|-------------|------|--------|
| 5 | **E2E Config Update** | testing/e2e-standalone-bundle | DONE. New journeys: UW Workflow, Payment, Policy. Login timeout fix (retry logic). awnic-complete bouquet with all 7 journeys |
| 6 | **UW Frontend Improvements** | zorbit-unified-console | DEPLOYED. Queue tabs with counts, channel badges, quotation detail panel with members/premium, action buttons (Approve/Decline/Load/Refer), data-testid attributes |

### Security Fixes (Critical)

| Fix | Details |
|-----|---------|
| Policy PDF endpoint | Was public (/G/), now requires JWT auth (/O/:orgId/). Scoped to organization |
| Payment public endpoint | Stripped PII. Only returns: paymentId, amount, currency, status, productName, expiresAt |
| PII tokenization | Hardened: FAILS on vault error (no more silent raw PII storage). Bearer token required |

---

## Quality Rating vs AWNIC Target Flow

| # | Capability | Target | Current | Rating |
|---|-----------|--------|---------|--------|
| 1 | Organization creation | Create insurer org with details | Working via UI + E2E | 9/10 |
| 2 | Role/User management | Create roles, assign privileges, create users | Working, tested in E2E | 9/10 |
| 3 | Product Configuration (PCG4) | 8-step wizard: insurer → product → plans → config → encounters → benefits → overrides → publish | Full E2E pass, all 8 steps | 9/10 |
| 4 | Rate Table / Pricing | Import AWNIC rate tables, lookup by age/gender/network/copay | Working. Real rates from RT-1C09 (Dubai) and RT-D4A3 (Abu Dhabi). Premium verified: AED 8,840.86 for 35M CN | 9/10 |
| 5 | Application / Quotation (UAE) | Form submission with proposer + members, PII tokenization | Working. Form → quotation bridge. All PII fields tokenized (7 proposer, 7 member). Zero raw PII in MongoDB | 8/10 |
| 6 | Premium Calculation | Real rate lookup from product_pricing service | Working. pricingSource=product_pricing in response. Falls back to hardcoded if service unavailable | 9/10 |
| 7 | UW Workflow Queues | Route to queue by premium/members/region. Underwriter sees entitled queues | Backend routing works. Frontend shows queue tabs + detail panel. FQP privilege filtering not yet wired | 7/10 |
| 8 | UW Actions | Approve, approve with loading, decline, refer, add exclusion, add waiting period | Backend validated + enforced. Frontend has Approve/Decline/Load/Refer buttons. Approve with loading has amount input | 8/10 |
| 9 | AI Decisioning | AI as queue participant, evaluates rules, STP/NSTP routing | Exists (hi_decisioning service). Not yet integrated as automatic queue participant — currently manual trigger | 5/10 |
| 10 | Payment Gateway | Generate link, customer pays, status updates | Working. Payment link generated, completion works. UI page is basic/functional | 6/10 |
| 11 | Policy PDF Generation | Professional certificate with branding, members, terms | Working via Puppeteer. Two versions: uw_workflow internal template + DocGenerator PFS template. Both look professional | 8/10 |
| 12 | Multi-Persona (Broker) | Broker org, broker creates apps, reassignment on resignation | Backend has channel/brokerHashId fields. No broker-specific UI or E2E journey yet | 3/10 |
| 13 | Telesales | Call center agent creates application | Same backend as broker (channel=telesales). No dedicated UI | 2/10 |
| 14 | Aggregator API | REST API for insurancemarket.ae / policybazaar.ae leads | Working: POST /leads creates quotation with channel=aggregator. Tested in API suite | 7/10 |
| 15 | Channel Analytics | Volume/premium by channel, broker performance | Backend endpoints working (channels, sources, brokers). No frontend dashboard | 5/10 |
| 16 | Document Verification | KYC/AML checks before policy | Service exists (pfs-verification). Not wired into UW flow | 2/10 |
| 17 | White Labeling | CSS theme per org, applies to console + exports | Not started | 0/10 |
| 18 | DMS (Document Management) | S3/disk storage, search index, retention | Not started | 0/10 |

**Overall: 65% of target AWNIC flow is demo-ready. Core insurance lifecycle is solid (items 1-8, 10-11).**

---

## Service Inventory (Server 85.25.93.171)

| Service | Port | DB | Status |
|---------|------|-----|--------|
| zorbit-identity | 3099 | PostgreSQL | Running |
| zorbit-authorization | 3102 | PostgreSQL | Running |
| zorbit-navigation | 3103 | PostgreSQL | Running |
| zorbit-pii-vault | 3105 | PostgreSQL | Running |
| zorbit-audit | 3106 | PostgreSQL | Running |
| zorbit-pfs-product_pricing | 3125 | MongoDB 27018 | Running |
| zorbit-pfs-form_builder | 3114 | MongoDB 27018 | Running |
| zorbit-pfs-doc_generator | 3136 | MongoDB 27018 | Running (NEW) |
| zorbit-app-pcg4 | 3111 | MongoDB 27018 | Running |
| zorbit-app-hi_quotation | 3117 | MongoDB 27018 | Running |
| zorbit-app-uw_workflow | 3115 | MongoDB 27018 | Running |
| zorbit-app-hi_decisioning | 3116 | MongoDB 27018 | Running |
| zorbit-unified-console | static | N/A | Running (Nginx) |

---

## Pending / Backlog

### High Priority (for demo improvement)
1. Wire DocGenerator PFS into uw_workflow (use PFS template instead of internal)
2. Full PII detokenization in policy PDF (currently shows "As per application")
3. Payment gateway page visual polish
4. Broker persona E2E journey
5. Channel analytics frontend dashboard

### Medium Priority
6. AI decisioning as automatic queue participant (Kafka-triggered)
7. Telesales UI
8. Document verification integration into UW flow
9. Aggregator webhook callbacks
10. UW queue privilege filtering (underwriter sees only entitled queues)

### Lower Priority (future)
11. White Labeling PFS
12. DMS (Document Management System)
13. Number Sequence PFS (centralized)
14. Rules Engine PFS (extract from hi_decisioning)
15. SLA/Escalation PFS (extract from uw_workflow)

---

## How to Run

### Full E2E (Playwright)
```bash
cd testing/e2e-standalone-bundle
./runme.sh --config awnic-demo.json --bouquet awnic-full
```

### API Integration Test
```bash
ssh ilri-arm-uat 'bash /tmp/api-integration-test.sh localhost'
```

### Individual Service Restart
```bash
ssh ilri-arm-uat 'source ~/.nvm/nvm.sh && nvm use 20 && pm2 restart <service-name>'
```

### DocGenerator Template Reseed
```bash
ssh ilri-arm-uat 'cd /home/sourav/apps/zorbit-platform/zorbit-pfs-doc_generator && \
  source ~/.nvm/nvm.sh && nvm use 20 && \
  MONGO_URI="mongodb://localhost:27018/zorbit_doc_generator?directConnection=true" \
  node dist/seeds/seed-templates.js'
```

---

## Architecture Philosophy (from Sourav)

- **Decisioning is contextual**: Always prefix with full context (hi_uw_decisioning, not just "decisioning")
- **UW Workflow**: Queue-based system where AI sits as a participant, not a standalone service
- **PFS over embedded**: Extract reusable capabilities into Platform Services (DocGenerator, PaymentGateway, DMS)
- **PII everywhere**: All data through PII vault, fail hard on vault error, never store raw
- **Soldiers for development**: Max 4-5 at a time, worktree isolation, laptop free for Chrome testing
