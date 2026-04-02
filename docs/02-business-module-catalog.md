# Zorbit Business Module Catalog

| Version | Date | Status | Author |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | Released — Internal Distribution | Platform Team |

---

## 1. Overview

This document catalogs the business modules available on the Zorbit platform. Business modules are **domain-specific applications** built on top of the platform's industry-agnostic infrastructure. All business domain knowledge lives here and is strictly separated from platform concerns (identity, authorization, messaging, observability, etc.).

The Zorbit platform is reusable across industries. The modules described in this catalog are specific to the **health insurance and healthcare** domain.

---

## 2. Application Hierarchy

Zorbit organizes business applications in a five-level hierarchy:

```
Edition > Business Line > Capability Area > Module > Feature
```

| Level | Term | Purpose |
|-------|------|---------|
| 1 | **Edition** | Top-level packaging sold to a specific buyer type |
| 2 | **Business Line** | Maps to revenue model (revenue vs. cost center) |
| 3 | **Capability Area** | Functional grouping of modules |
| 4 | **Module** | Deployable unit of business functionality |
| 5 | **Feature** | Granular capability within a module |

---

## 3. Editions

Each edition targets a distinct buyer type and packages modules accordingly.

| Edition | Target Buyer | Sector | Notes |
|---------|-------------|--------|-------|
| **UHC** (Universal Health Care) | Governments | Public sector | Government-run health programs |
| **Regulator** | Government regulators | Public sector | Regulatory oversight and compliance |
| **Reinsurer** | Reinsurance companies | Private sector | RI-specific workflows |
| **Insurer** | Insurance companies | Private sector | Core insurance operations |
| **TPA** | Third-Party Administrators | Private sector | Claims processing and administration |
| **Distributor** | Distribution channels | Private sector | Channel management |
| **Broker** | Insurance brokers | Private sector | Brokerage operations |
| **Provider** | Healthcare providers | Private sector | Hospital and clinic operations |

**Government editions:** UHC and Regulator are sold to government entities.
**Private-sector editions:** Remaining editions are sold to the named buyer types.

---

## 4. Business Lines

Business lines map to the revenue model and determine business ownership.

| Business Line | Purpose | Business Owner | Financial Model |
|---------------|---------|----------------|-----------------|
| **Distribution** | Revenue generation — activities that produce revenue | Sales / Distribution | Revenue center |
| **Servicing** | Service delivery — activities that fulfill the promise | Operations / Service | Cost center |

These two business lines have different business owners with their own expertise, competence, and authorities. This separation drives organizational structure, pricing, and packaging.

---

## 5. Capability Areas

### 5.1 Distribution (for Insurer / Reinsurer editions)

| Capability Area | Description |
|----------------|-------------|
| **Product Management** | Design, pricing, testing, and lifecycle of insurance products |
| **Policy Administration** | Underwriting, issuance, endorsements, renewals |
| **Reporting & Analytics** | Distribution performance, sales analytics |

### 5.2 Servicing (for Insurer / Reinsurer editions)

| Capability Area | Description |
|----------------|-------------|
| **Network Management** | Provider network enrollment, empanelment, tariffs |
| **Claim Management** | Pre-auth, adjudication, settlement (OPD and IPD) |
| **Customer Portal** | Self-service for HR, employees, individuals, family members |
| **FWA** | Fraud, Waste, and Abuse detection and prevention |
| **Reporting & Analytics** | Servicing performance, claims analytics |

### 5.3 Cross-Edition Module Reuse

A key architectural insight: the same underlying modules are reused across editions but reorganized under different capability areas depending on the buyer's perspective.

| Example Module | Under Insurer Edition | Under Provider Edition |
|----------------|----------------------|----------------------|
| Claim Initiation | Claim Management | Claim Management |
| Tariff Management | Network Management | Rate Negotiation |
| Provider Enrollment | Network Management | Empanelment |
| Payment Reconciliation | Network Management | AR/AP |

This is why the module hierarchy is **edition-dependent** while the modules themselves are **reusable building blocks**.

---

## 6. Module Catalog

### 6.1 Product Management Modules

| Code | Module | Description |
|------|--------|-------------|
| PM.01 | Product Design | Design insurance product structures, benefits, and rules |
| PM.02 | Medical Terms to Medical Code | ICD / SNOMED code resolution from medical terminology |
| PM.03 | Product Pricing | Actuarial pricing, rate tables, premium calculation |
| PM.04 | Product Testing | Simulation and validation of product configurations |
| PM.05 | Reinsurer Management | Reinsurance treaty management and cession workflows |

### 6.2 Policy Administration Modules

| Code | Module | Description |
|------|--------|-------------|
| PAS.01 | Distribution Channel Management | Agent, Broker, Aggregator channel interfaces (App/API) |
| PAS.02 | Document Digitization | MER, PMR, PMCC document processing and digitization |
| PAS.03 | Underwriting | RPB, underwriting rule engine, underwriting document management |
| PAS.04 | Endorsements | Policy change management (additions, deletions, modifications) |
| PAS.05 | Premium Shortfall / Refunds | Premium adjustment, shortfall recovery, refund processing |
| PAS.06 | Renewals | Renewal reminders, payment collection, certificate generation |
| PAS.07 | Distribution Channel Partner Management | Partner enrollment, negotiation workflows |
| PAS.08 | Health Advisory | Infographics, recorded and live health engagement content |

### 6.3 Network Management (Provider Management) Modules

| Code | Module | Description |
|------|--------|-------------|
| NM.01 | HCP Sign-up | Healthcare provider registration and onboarding |
| NM.02 | PMT Empanelment | Provider empanelment workflow and approval |
| NM.03 | Tariff Submission | Provider tariff submission and review |
| NM.04 | Tariff Finalization / UCR | Usual, Customary, and Reasonable pricing guidance |
| NM.05 | Payment Reconciliation | Provider payment reconciliation |
| NM.06 | Notification & Communication | Provider communication and notification management |
| NM.07 | Ultra-fast OPD Empanelment | Accelerated OPD provider empanelment |
| NM.08 | Outstanding / Payables Analysis | Payables tracking, analysis, and auto-reminders |
| NM.09 | Appointment Booking | Patient appointment scheduling with network providers |
| NM.10 | Policy Decoder | Policy benefits interpretation for providers |
| NM.11 | Initiate New Claim (UCI) | Unified Claim Interface — claim initiation from provider side |
| NM.12 | Catalog Master | Master catalog of medical services, procedures, and items |
| NM.13 | Catalog Analyser | Catalog analytics and comparison tools |
| NM.14 | Medical Coding Repository | Centralized medical coding reference (ICD, CPT, SNOMED) |
| NM.15 | RCMS AI | Revenue Cycle Management Scoring — AI-driven scoring |
| NM.16 | MAI | Medical Admissibility Intelligence — admissibility analysis |
| NM.17 | RCM Bill Assessment | Revenue Cycle Management — bill assessment and validation |
| NM.18 | DMS (Patient Records) | Document management system for patient records |
| NM.19 | Consulting Doctor Payout Calculator | Payout settlement calculation for consulting physicians |
| NM.20 | Revenue Leakage Comparison | Revenue leakage detection and comparison analysis |
| NM.21 | Network Management (List & Profile) | Provider directory — listing and profile management |
| NM.22 | Medical Roster | Physician and specialist roster management |
| NM.23 | Medical Transcription | Medical transcription and documentation services |

### 6.4 Claim Management Modules

#### 6.4.1 OPD Claims

| Code | Module | Description |
|------|--------|-------------|
| CM.OPD.01 | OPD NEC | Network & Eligibility Checker / Appointment Booking |
| CM.OPD.02 | OPD eRx / PIXEL | eRx module / Rx Upload with PIXEL processing |
| CM.OPD.03 | OPD Pharmacy Pre-Auth & Adjudication | Pharmacy claim pre-authorization and adjudication |
| CM.OPD.04 | OPD Investigation Pre-Auth & Adjudication | Investigation pre-auth with STG adherence |
| CM.OPD.05 | OPD Procedure Pre-Auth & Adjudication | Procedure pre-auth with STG adherence |

#### 6.4.2 IPD / General Claims

| Code | Module | Description |
|------|--------|-------------|
| CM.IPD.01 | Claim Initiation (Pre-Auth / Auth) | Pre-authorization and authorization via UCI |
| CM.IPD.02 | SynEng | Contextual medical term to code conversion engine |
| CM.IPD.03 | Claim Authorization Response | Pre-auth / auth response processing |
| CM.IPD.04 | Document Submission / Query Management | Claim document submission and query handling |
| CM.IPD.05 | Document Digitization | Prescription, bills, discharge summary digitization |
| CM.IPD.06 | Document Approval / Queries | Document review, approval, and query resolution |
| CM.IPD.07 | Interim Enhancement Auth Request | Mid-claim authorization enhancement request |
| CM.IPD.08 | Interim Enhancement Auth Response | Mid-claim authorization enhancement response |
| CM.IPD.09 | Claim Initiation (Discharge / Claim) | Discharge-stage claim initiation |
| CM.IPD.10 | Discharge Summary | Discharge summary processing and validation |
| CM.IPD.11 | NPL / NPPA / Negotiated Tariff Application | Non-payable list, non-payable package amount, negotiated tariff rules |
| CM.IPD.12 | Medical Adjudication | Clinical review and medical adjudication |
| CM.IPD.13 | Claim Adjudication (Discharge) | Final claim adjudication at discharge |
| CM.IPD.14 | Claim Audit | Post-adjudication claim audit and review |
| CM.IPD.15 | Claim Router | Intelligent claim routing to appropriate handlers |
| CM.IPD.16 | TPA Payout | TPA payment settlement and processing |

---

## 7. Module Code Convention

Module codes follow the pattern:

```
<<CapabilityArea>>.<<Sequence>>
```

| Prefix | Capability Area |
|--------|----------------|
| PM | Product Management |
| PAS | Policy Administration |
| NM | Network Management |
| CM.OPD | Claim Management — OPD |
| CM.IPD | Claim Management — IPD / General |

Examples:
- `PAS.01` = Policy Administration, module 01 (Distribution Channel Management)
- `CM.IPD.12` = Claim Management IPD, module 12 (Medical Adjudication)

---

## 8. Pricing Model Reference

The module catalog is linked to a pricing model with the following characteristics:

- **Pricing basis:** Per Life Per Year (PLPY)
- **Business line differentiation:** Distribution and Servicing have different unbundling weights
- **Packaging:** Modules are bundled and priced differently per edition
- **Unbundling:** Individual modules can be sold separately with adjusted pricing

Detailed pricing data is maintained separately from this catalog.

---

## 9. Relationship to Platform

This catalog describes **business domain modules only**. The Zorbit platform provides the shared infrastructure these modules run on.

Business modules consume platform services via the Zorbit SDK. They never implement their own identity, authorization, messaging, or audit logic.

| Platform Service | Repo | What It Does |
|-----------------|------|--------------|
| **Identity** | zorbit-identity | Central authentication authority. Handles user registration, login (email/password, OAuth, SAML, RADIUS, Diameter), JWT issuance, user profile management, and organization management. All services and modules delegate authentication here. |
| **Authorization** | zorbit-authorization | Role-based access control (RBAC) and privilege management. Defines roles, assigns privileges, and provides the privilege resolution API that determines what each user can see and do across all modules. |
| **Navigation** | zorbit-navigation | Dynamic navigation menu assembly. Stores menu items contributed by each module, resolves per-user menus based on privileges, and serves the assembled menu to the frontend. Modules register their menu items here via manifests. |
| **Messaging** | zorbit-messaging | Asynchronous event bus backed by Kafka. Provides topic management, event publishing/consuming, and dead letter queue handling. All inter-service communication flows through here using the canonical event envelope. |
| **PII Vault** | zorbit-pii-vault | Sensitive data protection. Stores personally identifiable information (emails, phone numbers, addresses) and returns opaque tokens. Operational databases never contain raw PII — only vault tokens. |
| **Audit** | zorbit-audit | Immutable audit trail. Captures and stores all significant actions across the platform (API calls, data changes, login events) with full context including who, what, when, and from where. |
| **Observability** | zorbit-observability | Centralized telemetry collection using OpenTelemetry. Provides distributed tracing, metrics aggregation, and log correlation across all services and modules. |
| **AI Gateway** | zorbit-ai-gateway | Unified interface for AI/ML capabilities. Routes AI requests to appropriate models, manages prompt templates, enforces usage policies, and provides a consistent API for modules that need AI features. |
| **Secrets** | zorbit-secrets | Secure credential and configuration management. Stores API keys, database passwords, and other sensitive configuration values. Services retrieve secrets at runtime rather than storing them in environment files. |
| **Data Platform** | zorbit-data-platform | Centralized data lake and analytics infrastructure. Provides data ingestion pipelines, transformation workflows, and query interfaces for cross-module business intelligence and reporting. |
| **Licensing** | zorbit-licensing | Module and edition license enforcement. Tracks which modules each organization has licensed, enforces entitlements at runtime, and provides the licensing API used during module injection to determine availability. |
| **Interaction Recorder** | zorbit-interaction-recorder | Captures and replays user interactions across the platform. Records screen sessions, API call sequences, and user journeys for support, training, and compliance purposes. |
| **Seeding** | zorbit-seeding | Demo data provisioning and environment setup. Provides idempotent seed scripts that populate consistent test data across all services for development, QA, and sales demos. |

---

*Zorbit Business Module Catalog v1.0 — 2026-03-13*
