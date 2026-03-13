// =============================================================================
// PCG4 — Hardcoded Encounter Taxonomy Fallback
// =============================================================================
// 10 categories, 44 encounter types.
// Used when the taxonomy API is unavailable.
// =============================================================================

import type { EncounterCategory } from '../../../types/pcg4';

export const ENCOUNTER_TAXONOMY: EncounterCategory[] = [
  {
    category_id: 'cat_preventive',
    category_name: 'Preventive Care',
    description: 'Routine screenings, wellness visits, and preventive services',
    types: [
      { type_id: 'annual_physical', label: 'Annual Physical Exam', description: 'Yearly comprehensive health check-up' },
      { type_id: 'immunizations', label: 'Immunizations', description: 'Vaccines and booster shots' },
      { type_id: 'cancer_screening', label: 'Cancer Screening', description: 'Mammograms, colonoscopies, and other cancer screenings' },
      { type_id: 'wellness_visit', label: 'Wellness Visit', description: 'Routine wellness and health maintenance visits' },
    ],
  },
  {
    category_id: 'cat_primary',
    category_name: 'Primary Care',
    description: 'General physician visits and basic medical consultations',
    types: [
      { type_id: 'office_visit', label: 'Office Visit', description: 'Standard physician office visit' },
      { type_id: 'urgent_care', label: 'Urgent Care', description: 'Walk-in urgent care visit' },
      { type_id: 'telemedicine', label: 'Telemedicine', description: 'Virtual/remote medical consultation' },
      { type_id: 'chronic_care_mgmt', label: 'Chronic Care Management', description: 'Ongoing management of chronic conditions' },
    ],
  },
  {
    category_id: 'cat_specialist',
    category_name: 'Specialist Care',
    description: 'Referral-based specialist consultations',
    types: [
      { type_id: 'cardiology', label: 'Cardiology', description: 'Heart and cardiovascular specialist' },
      { type_id: 'dermatology', label: 'Dermatology', description: 'Skin conditions and treatments' },
      { type_id: 'orthopedics', label: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care' },
      { type_id: 'neurology', label: 'Neurology', description: 'Brain and nervous system specialist' },
      { type_id: 'endocrinology', label: 'Endocrinology', description: 'Hormonal and metabolic conditions' },
    ],
  },
  {
    category_id: 'cat_emergency',
    category_name: 'Emergency Services',
    description: 'Emergency room and ambulance services',
    types: [
      { type_id: 'er_visit', label: 'Emergency Room Visit', description: 'Hospital emergency department visit' },
      { type_id: 'ambulance', label: 'Ambulance Transport', description: 'Emergency medical transportation' },
      { type_id: 'trauma_care', label: 'Trauma Care', description: 'Critical injury treatment' },
    ],
  },
  {
    category_id: 'cat_hospital',
    category_name: 'Hospital / Inpatient',
    description: 'Hospital admissions and inpatient care',
    types: [
      { type_id: 'inpatient_stay', label: 'Inpatient Hospital Stay', description: 'Overnight hospital admission' },
      { type_id: 'icu_care', label: 'ICU / Critical Care', description: 'Intensive care unit admission' },
      { type_id: 'surgery_inpatient', label: 'Inpatient Surgery', description: 'Surgical procedures requiring hospital stay' },
      { type_id: 'newborn_care', label: 'Newborn Care', description: 'Neonatal and newborn hospital services' },
    ],
  },
  {
    category_id: 'cat_outpatient',
    category_name: 'Outpatient / Surgical',
    description: 'Same-day surgeries and outpatient procedures',
    types: [
      { type_id: 'outpatient_surgery', label: 'Outpatient Surgery', description: 'Same-day surgical procedure' },
      { type_id: 'diagnostic_imaging', label: 'Diagnostic Imaging', description: 'X-rays, MRI, CT scans, ultrasound' },
      { type_id: 'lab_tests', label: 'Lab Tests / Pathology', description: 'Blood work, biopsies, lab testing' },
      { type_id: 'physical_therapy', label: 'Physical Therapy', description: 'Rehabilitation and physical therapy sessions' },
      { type_id: 'occupational_therapy', label: 'Occupational Therapy', description: 'Occupational rehabilitation services' },
    ],
  },
  {
    category_id: 'cat_mental',
    category_name: 'Mental Health & Substance Abuse',
    description: 'Behavioral health, counseling, and substance use treatment',
    types: [
      { type_id: 'outpatient_therapy', label: 'Outpatient Therapy', description: 'Individual or group therapy sessions' },
      { type_id: 'psychiatric_visit', label: 'Psychiatric Visit', description: 'Psychiatrist consultation and medication management' },
      { type_id: 'inpatient_mental', label: 'Inpatient Mental Health', description: 'Inpatient psychiatric facility admission' },
      { type_id: 'substance_abuse_treatment', label: 'Substance Abuse Treatment', description: 'Detox, rehab, and substance use programs' },
      { type_id: 'crisis_intervention', label: 'Crisis Intervention', description: 'Emergency mental health services' },
    ],
  },
  {
    category_id: 'cat_maternity',
    category_name: 'Maternity & Reproductive',
    description: 'Pregnancy, childbirth, and reproductive health services',
    types: [
      { type_id: 'prenatal_care', label: 'Prenatal Care', description: 'Routine prenatal visits and monitoring' },
      { type_id: 'delivery', label: 'Delivery / Childbirth', description: 'Labor, delivery, and postpartum care' },
      { type_id: 'fertility_treatment', label: 'Fertility Treatment', description: 'IVF, IUI, and assisted reproduction' },
      { type_id: 'postnatal_care', label: 'Postnatal Care', description: 'Postpartum recovery and follow-up' },
    ],
  },
  {
    category_id: 'cat_pharmacy',
    category_name: 'Pharmacy & Prescription',
    description: 'Prescription drugs and pharmacy services',
    types: [
      { type_id: 'generic_drugs', label: 'Generic Drugs', description: 'Generic prescription medications' },
      { type_id: 'brand_drugs', label: 'Brand-Name Drugs', description: 'Brand-name prescription medications' },
      { type_id: 'specialty_drugs', label: 'Specialty Drugs', description: 'High-cost specialty medications and biologics' },
      { type_id: 'mail_order_pharmacy', label: 'Mail-Order Pharmacy', description: 'Mail-order prescription drug services' },
    ],
  },
  {
    category_id: 'cat_dental_vision',
    category_name: 'Dental & Vision',
    description: 'Dental care, eye exams, and vision correction',
    types: [
      { type_id: 'dental_preventive', label: 'Dental Preventive', description: 'Cleanings, exams, and X-rays' },
      { type_id: 'dental_restorative', label: 'Dental Restorative', description: 'Fillings, crowns, and root canals' },
      { type_id: 'dental_orthodontics', label: 'Orthodontics', description: 'Braces and orthodontic treatment' },
      { type_id: 'vision_exam', label: 'Vision Exam', description: 'Routine eye examination' },
      { type_id: 'vision_correction', label: 'Vision Correction', description: 'Glasses, contacts, and LASIK' },
    ],
  },
];

export default ENCOUNTER_TAXONOMY;
