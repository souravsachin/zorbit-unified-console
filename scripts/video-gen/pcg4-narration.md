# PCG4 Video Narration Scripts

## Video 1: PCG4 Overview (~2 min)

### Narration Text

Welcome to PCG4 -- the Product Configurator Generation 4. This is Zorbit's module for designing, reviewing, and deploying insurance product configurations.

PCG4 provides a visual, step-by-step wizard that guides product analysts through the complete product configuration process. Let me walk you through its key features.

The PCG4 dashboard shows all product configurations in your organization. You can see drafts, configurations under review, and those that have been published to production.

The eight-step configuration wizard covers everything from insurer details and product specifications, through plan creation, base configuration, encounter definitions, benefit structures, per-plan overrides, and finally review and publish.

PCG4 supports 43 encounter types organized across 10 clinical categories, including preventive care, primary care, specialist care, emergency services, hospital and inpatient care, outpatient and surgical procedures, mental health, maternity, rehabilitation, and diagnostics.

The Reference Library contains curated templates for common plan types like HMO, PPO, and HDHP, allowing you to clone and customize existing configurations.

Every configuration goes through a Maker-Checker-Publisher approval workflow. The maker creates the configuration, the checker reviews and approves it, and the publisher deploys it to the target environment.

That concludes our PCG4 overview. Next, we'll dive deeper into the configuration process.

---

## Video 2: PCG4 Configuration Deep-Dive (~3 min)

### Narration Text

In this video, we'll walk through creating a product configuration step by step using the PCG4 wizard.

Step one is Insurer Details. Here you enter the insurance company information -- company name, NAIC code, state of domicile, and license details.

Step two is Product Details. You define the product name, product type (group or individual), effective dates, and regulatory classifications.

Step three is Create Plans. This is where you define plan tiers -- typically Bronze, Silver, Gold, and Platinum. Each plan can target different regions and currencies.

Step four is Base Configuration. You set the global limits, deductibles, out-of-pocket maximums, and family tier structures that apply across all plans.

Step five is Encounters. Here you select which encounter types the product covers and configure copay and coinsurance rules for each one. The encounter taxonomy has 43 types organized in 10 categories.

Step six is Benefits. You define the benefit structure including copayments, coinsurance percentages, prior authorization requirements, and annual visit limits.

Step seven is Overrides. This powerful feature lets you customize any setting on a per-plan basis. For example, the Gold plan might have lower copays than the Bronze plan for specialist visits.

Step eight is Review and Publish. The system validates the complete configuration, shows a summary of all settings, and allows you to submit for review.

Once submitted, the configuration enters the approval workflow. A checker reviews the clinical and actuarial accuracy, and upon approval, a publisher deploys it to the target environment.

---

## Video 3: PCG4 Encounters Taxonomy (~2 min)

### Narration Text

The PCG4 encounter taxonomy is one of the most important components of the product configurator. Let's explore how it works.

PCG4 defines 43 encounter types organized across 10 clinical categories. This taxonomy provides a standardized framework for defining what healthcare services an insurance product covers.

The Coverage Mapper interface shows all encounter types in a tree structure. Each category expands to show its individual encounter types.

Preventive Care includes annual wellness exams, immunizations, and screenings. Primary Care covers office visits, telemedicine, and urgent care. Specialist Care includes dermatology, cardiology, orthopedics, and other specialist consultations.

Emergency includes emergency room visits and ambulance services. Hospital and Inpatient covers room and board, ICU, and surgical procedures. Outpatient and Surgical includes day surgery and outpatient procedures.

Mental Health covers therapy sessions, psychiatric consultations, and substance abuse treatment. Maternity includes prenatal care, delivery, and postnatal care. Rehabilitation covers physical therapy, occupational therapy, and speech therapy. Diagnostics and Lab includes laboratory tests, imaging, and pathology.

For each encounter type, you can configure copay amounts, coinsurance percentages, prior authorization requirements, and annual visit limits. These settings cascade from the base configuration but can be overridden at the plan level.

The coverage mapping process links encounter types to specific billing codes, ensuring accurate claims adjudication downstream.
