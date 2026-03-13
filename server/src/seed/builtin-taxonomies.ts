/**
 * Builtin Healthcare Encounter Types taxonomy seed data.
 * Sourced from PCG4 encounter_categories.json — 10 categories, 44 encounter types.
 *
 * Uses deterministic IDs so the seed is idempotent.
 */

export interface SeedTaxonomyItem {
  id: string;
  hashId: string;
  categoryId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface SeedTaxonomyCategory {
  id: string;
  hashId: string;
  taxonomyId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  icon: string | null;
  metadata: Record<string, unknown>;
  items: SeedTaxonomyItem[];
}

export interface SeedTaxonomy {
  id: string;
  hashId: string;
  name: string;
  description: string | null;
  version: string;
  status: 'draft' | 'active' | 'archived';
  organizationHashId: string;
  createdBy: string | null;
  categories: SeedTaxonomyCategory[];
}

export const builtinTaxonomies: SeedTaxonomy[] = [
  {
    id: 'TXN-0001',
    hashId: 'TXN-0001',
    name: 'Healthcare Encounter Types',
    description: 'Comprehensive taxonomy of healthcare encounter types used across clinical and administrative workflows',
    version: '1.0.0',
    status: 'active',
    organizationHashId: 'G',
    createdBy: null,
    categories: [
      {
        id: 'TXC-0001',
        hashId: 'TXC-0001',
        taxonomyId: 'TXN-0001',
        name: 'Ambulatory / Outpatient Encounters',
        description: 'Non-emergency outpatient care including consultations, preventive care, and routine visits',
        sortOrder: 0,
        icon: null,
        metadata: { category_id: 'ambulatory_outpatient' },
        items: [
          { id: 'TXI-0001', hashId: 'TXI-0001', categoryId: 'TXC-0001', name: 'Primary Care Visits', description: 'General practitioner consultations and routine checkups', sortOrder: 0, isActive: true, metadata: { type_id: 'primary_care_visits' } },
          { id: 'TXI-0002', hashId: 'TXI-0002', categoryId: 'TXC-0001', name: 'Specialist Visits', description: 'Consultations with medical specialists', sortOrder: 1, isActive: true, metadata: { type_id: 'specialist_visits' } },
          { id: 'TXI-0003', hashId: 'TXI-0003', categoryId: 'TXC-0001', name: 'Urgent Care / Walk-in Clinics', description: 'Non-emergency urgent medical care', sortOrder: 2, isActive: true, metadata: { type_id: 'urgent_care_walkin' } },
          { id: 'TXI-0004', hashId: 'TXI-0004', categoryId: 'TXC-0001', name: 'Telemedicine / Virtual Consultations', description: 'Remote medical consultations via digital platforms', sortOrder: 3, isActive: true, metadata: { type_id: 'telemedicine_virtual' } },
          { id: 'TXI-0005', hashId: 'TXI-0005', categoryId: 'TXC-0001', name: 'Preventive Care', description: 'Routine screenings, checkups, and preventive treatments', sortOrder: 4, isActive: true, metadata: { type_id: 'preventive_care' } },
        ],
      },
      {
        id: 'TXC-0002',
        hashId: 'TXC-0002',
        taxonomyId: 'TXN-0001',
        name: 'Emergency Encounters',
        description: 'Emergency and trauma care requiring immediate medical attention',
        sortOrder: 1,
        icon: null,
        metadata: { category_id: 'emergency_encounters' },
        items: [
          { id: 'TXI-0006', hashId: 'TXI-0006', categoryId: 'TXC-0002', name: 'Emergency Room (ER / A&E) Visits', description: 'Emergency department visits for acute medical conditions', sortOrder: 0, isActive: true, metadata: { type_id: 'emergency_room_visits' } },
          { id: 'TXI-0007', hashId: 'TXI-0007', categoryId: 'TXC-0002', name: 'Ambulance / Emergency Transport', description: 'Emergency medical transportation services', sortOrder: 1, isActive: true, metadata: { type_id: 'ambulance_transport' } },
          { id: 'TXI-0008', hashId: 'TXI-0008', categoryId: 'TXC-0002', name: 'Trauma Care', description: 'Specialized care for severe injuries and trauma', sortOrder: 2, isActive: true, metadata: { type_id: 'trauma_care' } },
        ],
      },
      {
        id: 'TXC-0003',
        hashId: 'TXC-0003',
        taxonomyId: 'TXN-0001',
        name: 'Inpatient / Hospital Encounters',
        description: 'Hospital admissions requiring overnight or extended stays',
        sortOrder: 2,
        icon: null,
        metadata: { category_id: 'inpatient_hospital' },
        items: [
          { id: 'TXI-0009', hashId: 'TXI-0009', categoryId: 'TXC-0003', name: 'Medical Admissions', description: 'Hospital stays for medical treatment and monitoring', sortOrder: 0, isActive: true, metadata: { type_id: 'medical_admissions' } },
          { id: 'TXI-0010', hashId: 'TXI-0010', categoryId: 'TXC-0003', name: 'Surgical Admissions', description: 'Hospital stays for surgical procedures', sortOrder: 1, isActive: true, metadata: { type_id: 'surgical_admissions' } },
          { id: 'TXI-0011', hashId: 'TXI-0011', categoryId: 'TXC-0003', name: 'Intensive Care Unit (ICU / CCU / NICU / PICU)', description: 'Critical care in specialized intensive care units', sortOrder: 2, isActive: true, metadata: { type_id: 'intensive_care_unit' } },
          { id: 'TXI-0012', hashId: 'TXI-0012', categoryId: 'TXC-0003', name: 'Maternity Admissions', description: 'Hospital stays for childbirth and maternity care', sortOrder: 3, isActive: true, metadata: { type_id: 'maternity_admissions' } },
          { id: 'TXI-0013', hashId: 'TXI-0013', categoryId: 'TXC-0003', name: 'Rehabilitation Admissions', description: 'Inpatient rehabilitation and recovery programs', sortOrder: 4, isActive: true, metadata: { type_id: 'rehabilitation_admissions' } },
          { id: 'TXI-0014', hashId: 'TXI-0014', categoryId: 'TXC-0003', name: 'Psychiatric / Behavioral Health Admissions', description: 'Inpatient mental health and behavioral treatment', sortOrder: 5, isActive: true, metadata: { type_id: 'psychiatric_behavioral_admissions' } },
        ],
      },
      {
        id: 'TXC-0004',
        hashId: 'TXC-0004',
        taxonomyId: 'TXN-0001',
        name: 'Day Care / Observation Encounters',
        description: 'Same-day procedures and short-stay observation care',
        sortOrder: 3,
        icon: null,
        metadata: { category_id: 'daycare_observation' },
        items: [
          { id: 'TXI-0015', hashId: 'TXI-0015', categoryId: 'TXC-0004', name: 'Same-Day Surgeries', description: 'Surgical procedures not requiring overnight stay', sortOrder: 0, isActive: true, metadata: { type_id: 'same_day_surgeries' } },
          { id: 'TXI-0016', hashId: 'TXI-0016', categoryId: 'TXC-0004', name: 'Short-Stay Observation', description: 'Brief hospital observation for monitoring', sortOrder: 1, isActive: true, metadata: { type_id: 'short_stay_observation' } },
          { id: 'TXI-0017', hashId: 'TXI-0017', categoryId: 'TXC-0004', name: 'Chemotherapy / Infusion Sessions', description: 'Outpatient chemotherapy and IV therapy sessions', sortOrder: 2, isActive: true, metadata: { type_id: 'chemotherapy_infusion' } },
          { id: 'TXI-0018', hashId: 'TXI-0018', categoryId: 'TXC-0004', name: 'Dialysis Sessions', description: 'Regular dialysis treatments for kidney care', sortOrder: 3, isActive: true, metadata: { type_id: 'dialysis_sessions' } },
        ],
      },
      {
        id: 'TXC-0005',
        hashId: 'TXC-0005',
        taxonomyId: 'TXN-0001',
        name: 'Ancillary / Supportive Services',
        description: 'Diagnostic, therapeutic, and support services',
        sortOrder: 4,
        icon: null,
        metadata: { category_id: 'ancillary_supportive' },
        items: [
          { id: 'TXI-0019', hashId: 'TXI-0019', categoryId: 'TXC-0005', name: 'Diagnostic Imaging', description: 'X-rays, MRI, CT scans, and other imaging services', sortOrder: 0, isActive: true, metadata: { type_id: 'diagnostic_imaging' } },
          { id: 'TXI-0020', hashId: 'TXI-0020', categoryId: 'TXC-0005', name: 'Pathology / Lab Tests', description: 'Laboratory testing and pathological examinations', sortOrder: 1, isActive: true, metadata: { type_id: 'pathology_lab_tests' } },
          { id: 'TXI-0021', hashId: 'TXI-0021', categoryId: 'TXC-0005', name: 'Rehabilitation & Therapies', description: 'Physical, occupational, and speech therapy', sortOrder: 2, isActive: true, metadata: { type_id: 'rehabilitation_therapies' } },
          { id: 'TXI-0022', hashId: 'TXI-0022', categoryId: 'TXC-0005', name: 'Prosthetics, Orthotics & Durable Medical Equipment (DME)', description: 'Medical devices and equipment for patient care', sortOrder: 3, isActive: true, metadata: { type_id: 'prosthetics_dme' } },
          { id: 'TXI-0023', hashId: 'TXI-0023', categoryId: 'TXC-0005', name: 'Pharmacy Encounters', description: 'Prescription medications and pharmaceutical services', sortOrder: 4, isActive: true, metadata: { type_id: 'pharmacy_encounters' } },
        ],
      },
      {
        id: 'TXC-0006',
        hashId: 'TXC-0006',
        taxonomyId: 'TXN-0001',
        name: 'Mental & Behavioral Health Encounters',
        description: 'Mental health and behavioral treatment services',
        sortOrder: 5,
        icon: null,
        metadata: { category_id: 'mental_behavioral_health' },
        items: [
          { id: 'TXI-0024', hashId: 'TXI-0024', categoryId: 'TXC-0006', name: 'Outpatient Counseling / Psychotherapy', description: 'Individual counseling and psychotherapy sessions', sortOrder: 0, isActive: true, metadata: { type_id: 'outpatient_counseling' } },
          { id: 'TXI-0025', hashId: 'TXI-0025', categoryId: 'TXC-0006', name: 'Group Therapy', description: 'Group-based therapeutic interventions', sortOrder: 1, isActive: true, metadata: { type_id: 'group_therapy' } },
          { id: 'TXI-0026', hashId: 'TXI-0026', categoryId: 'TXC-0006', name: 'Substance Abuse Treatment', description: 'Treatment for drug and alcohol dependency', sortOrder: 2, isActive: true, metadata: { type_id: 'substance_abuse_treatment' } },
          { id: 'TXI-0027', hashId: 'TXI-0027', categoryId: 'TXC-0006', name: 'Psychiatric Crisis Intervention', description: 'Emergency mental health crisis response', sortOrder: 3, isActive: true, metadata: { type_id: 'psychiatric_crisis_intervention' } },
        ],
      },
      {
        id: 'TXC-0007',
        hashId: 'TXC-0007',
        taxonomyId: 'TXN-0001',
        name: 'Preventive & Public Health Encounters',
        description: 'Community health and prevention programs',
        sortOrder: 6,
        icon: null,
        metadata: { category_id: 'preventive_public_health' },
        items: [
          { id: 'TXI-0028', hashId: 'TXI-0028', categoryId: 'TXC-0007', name: 'Immunizations & Vaccination Programs', description: 'Preventive vaccinations and immunization services', sortOrder: 0, isActive: true, metadata: { type_id: 'immunizations_vaccinations' } },
          { id: 'TXI-0029', hashId: 'TXI-0029', categoryId: 'TXC-0007', name: 'Wellness / Screening Programs', description: 'Health screenings and wellness initiatives', sortOrder: 1, isActive: true, metadata: { type_id: 'wellness_screening_programs' } },
          { id: 'TXI-0030', hashId: 'TXI-0030', categoryId: 'TXC-0007', name: 'Health Coaching / Lifestyle Management', description: 'Lifestyle and health behavior modification programs', sortOrder: 2, isActive: true, metadata: { type_id: 'health_coaching_lifestyle' } },
          { id: 'TXI-0031', hashId: 'TXI-0031', categoryId: 'TXC-0007', name: 'Occupational Health Encounters', description: 'Work-related health services and evaluations', sortOrder: 3, isActive: true, metadata: { type_id: 'occupational_health' } },
        ],
      },
      {
        id: 'TXC-0008',
        hashId: 'TXC-0008',
        taxonomyId: 'TXN-0001',
        name: 'Long-Term & Chronic Care Encounters',
        description: 'Extended care for chronic conditions and long-term needs',
        sortOrder: 7,
        icon: null,
        metadata: { category_id: 'longterm_chronic_care' },
        items: [
          { id: 'TXI-0032', hashId: 'TXI-0032', categoryId: 'TXC-0008', name: 'Home Health Visits', description: 'Medical care provided in the patient\'s home', sortOrder: 0, isActive: true, metadata: { type_id: 'home_health_visits' } },
          { id: 'TXI-0033', hashId: 'TXI-0033', categoryId: 'TXC-0008', name: 'Chronic Disease Management Encounters', description: 'Ongoing management of chronic health conditions', sortOrder: 1, isActive: true, metadata: { type_id: 'chronic_disease_management' } },
          { id: 'TXI-0034', hashId: 'TXI-0034', categoryId: 'TXC-0008', name: 'Palliative Care Encounters', description: 'Comfort and quality of life focused care', sortOrder: 2, isActive: true, metadata: { type_id: 'palliative_care' } },
          { id: 'TXI-0035', hashId: 'TXI-0035', categoryId: 'TXC-0008', name: 'Hospice Care', description: 'End-of-life care and comfort services', sortOrder: 3, isActive: true, metadata: { type_id: 'hospice_care' } },
        ],
      },
      {
        id: 'TXC-0009',
        hashId: 'TXC-0009',
        taxonomyId: 'TXN-0001',
        name: 'Non-Traditional / Emerging Encounters',
        description: 'Alternative medicine and emerging healthcare technologies',
        sortOrder: 8,
        icon: null,
        metadata: { category_id: 'nontraditional_emerging' },
        items: [
          { id: 'TXI-0036', hashId: 'TXI-0036', categoryId: 'TXC-0009', name: 'Alternative / Complementary Medicine', description: 'Non-conventional medical treatments and therapies', sortOrder: 0, isActive: true, metadata: { type_id: 'alternative_complementary_medicine' } },
          { id: 'TXI-0037', hashId: 'TXI-0037', categoryId: 'TXC-0009', name: 'Genomics / Precision Medicine Encounters', description: 'Genetic testing and personalized medicine', sortOrder: 1, isActive: true, metadata: { type_id: 'genomics_precision_medicine' } },
          { id: 'TXI-0038', hashId: 'TXI-0038', categoryId: 'TXC-0009', name: 'Digital Health & Remote Monitoring', description: 'Remote patient monitoring and digital health tools', sortOrder: 2, isActive: true, metadata: { type_id: 'digital_health_remote_monitoring' } },
          { id: 'TXI-0039', hashId: 'TXI-0039', categoryId: 'TXC-0009', name: 'Community / Public Encounters', description: 'Community-based health services and programs', sortOrder: 3, isActive: true, metadata: { type_id: 'community_public_encounters' } },
        ],
      },
      {
        id: 'TXC-0010',
        hashId: 'TXC-0010',
        taxonomyId: 'TXN-0001',
        name: 'Administrative / Non-Care Encounters',
        description: 'Administrative processes and care coordination activities',
        sortOrder: 9,
        icon: null,
        metadata: { category_id: 'administrative_noncare' },
        items: [
          { id: 'TXI-0040', hashId: 'TXI-0040', categoryId: 'TXC-0010', name: 'Prior Authorization / Pre-Certification Encounters', description: 'Pre-approval processes for treatments and procedures', sortOrder: 0, isActive: true, metadata: { type_id: 'prior_authorization_precertification' } },
          { id: 'TXI-0041', hashId: 'TXI-0041', categoryId: 'TXC-0010', name: 'Case Management / Care Coordination Encounters', description: 'Care planning and coordination services', sortOrder: 1, isActive: true, metadata: { type_id: 'case_management_coordination' } },
          { id: 'TXI-0042', hashId: 'TXI-0042', categoryId: 'TXC-0010', name: 'Second Opinion Encounters', description: 'Additional medical opinions for treatment decisions', sortOrder: 2, isActive: true, metadata: { type_id: 'second_opinion' } },
          { id: 'TXI-0043', hashId: 'TXI-0043', categoryId: 'TXC-0010', name: 'Skilled Nursing Facility Encounters', description: 'Specialized nursing care in facility settings', sortOrder: 3, isActive: true, metadata: { type_id: 'skilled_nursing_facility' } },
          { id: 'TXI-0044', hashId: 'TXI-0044', categoryId: 'TXC-0010', name: 'Wellness Incentive / Preventive Coaching', description: 'Incentive-based wellness and prevention programs', sortOrder: 4, isActive: true, metadata: { type_id: 'wellness_incentive_coaching' } },
        ],
      },
    ],
  },
];
