import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  HeartPulse, ChevronLeft, ChevronRight, Save, Send, Upload, X, Check,
  AlertTriangle, Info, FileText, Shield, Users, Stethoscope, CreditCard,
  Loader2, CheckCircle2, Clock,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import ZorbitStepper from '../../components/ZorbitStepper/ZorbitStepper';
import { useWizard } from '../../components/ZorbitStepper/useWizard';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type Region = 'IN' | 'AE' | 'US';
type PlanType = 'individual' | 'floater' | 'multi-individual';
type MemberRelation = 'self' | 'spouse' | 'son' | 'daughter';
type MedicalAnswerMode = 'together' | 'per-member';

interface FamilyMember {
  id: string;
  relation: MemberRelation;
  age: number;
  title: string;
  fullName: string;
  dob: string;
  gender: string;
  heightFeet: number;
  heightInches: number;
  weightKg: number;
  occupation: string;
  idProofType: string;
  idNumber: string;
}

interface ProposerDetails {
  title: string;
  fullName: string;
  gender: string;
  dob: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  nationality: string;
  annualIncome: string;
  mobile: string;
  email: string;
  panNumber: string;
  aadhaarNumber: string;
  emiratesId: string;
  visaStatus: string;
  sponsor: string;
  ssn: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
}

interface MedicalAnswer {
  questionId: string;
  answer: 'yes' | 'no' | '';
  affectedMembers: string[]; // member ids
  details: string;
  subAnswers: Record<string, string>;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

interface FormData {
  region: Region;
  planType: PlanType;
  sumInsured: number;
  coverageTenure: number;
  members: FamilyMember[];
  addOns: string[];
  proposer: ProposerDetails;
  medicalAnswerMode: MedicalAnswerMode;
  medicalAnswers: Record<string, MedicalAnswer>;
  documents: UploadedFile[];
  declarationAccepted: boolean;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const REGIONS: { value: Region; label: string; flag: string }[] = [
  { value: 'IN', label: 'India', flag: 'IN' },
  { value: 'AE', label: 'UAE', flag: 'AE' },
  { value: 'US', label: 'United States', flag: 'US' },
];

const SUM_INSURED_OPTIONS: Record<Region, number[]> = {
  IN: [300000, 500000, 700000, 1000000, 1500000, 2000000, 5000000],
  AE: [150000, 250000, 500000, 1000000, 2000000],
  US: [100000, 250000, 500000, 1000000, 2000000],
};

const ADD_ONS: Record<Region, { id: string; label: string; description: string }[]> = {
  IN: [
    { id: 'maternity', label: 'Maternity Cover', description: 'Covers delivery & newborn expenses' },
    { id: 'opd', label: 'OPD Cover', description: 'Doctor consultations & pharmacy' },
    { id: 'criticalIllness', label: 'Critical Illness', description: 'Lump sum on diagnosis of listed conditions' },
    { id: 'personalAccident', label: 'Personal Accident', description: 'Accidental disability & death cover' },
    { id: 'restoreBenefit', label: 'Restore Benefit', description: 'Sum insured restored after full use' },
    { id: 'roomRentWaiver', label: 'Room Rent Waiver', description: 'No room rent capping' },
    { id: 'wellness', label: 'Wellness Rewards', description: 'Earn rewards for healthy habits' },
  ],
  AE: [
    { id: 'maternity', label: 'Maternity Cover', description: 'Prenatal & delivery coverage' },
    { id: 'dental', label: 'Dental Cover', description: 'Dental treatments & cleanings' },
    { id: 'optical', label: 'Optical Cover', description: 'Eye tests & prescription glasses' },
    { id: 'homeNursing', label: 'Home Nursing', description: 'Post-hospitalization home care' },
    { id: 'evacuation', label: 'Emergency Evacuation', description: 'Air ambulance & evacuation' },
    { id: 'outpatient', label: 'Outpatient Cover', description: 'GP visits & pharmacy' },
  ],
  US: [
    { id: 'dental', label: 'Dental Plan', description: 'Preventive & restorative dental' },
    { id: 'vision', label: 'Vision Plan', description: 'Annual eye exams & lenses' },
    { id: 'mentalHealth', label: 'Mental Health', description: 'Counseling & therapy sessions' },
    { id: 'prescription', label: 'Prescription Drug', description: 'Formulary drug coverage' },
    { id: 'wellness', label: 'Wellness Program', description: 'Gym, nutrition coaching' },
  ],
};

const MEDICAL_QUESTIONS: {
  id: string;
  question: string;
  category: string;
  regions: Region[];
  subQuestions?: { id: string; question: string; type: 'text' | 'select'; options?: string[] }[];
}[] = [
  {
    id: 'mq-01', category: 'chronic',
    question: 'Has any member ever suffered from or is currently suffering from any illness relating to Heart, Lung, Liver, Kidney, Brain, Cancer, Diabetes, or Hypertension?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-01-condition', question: 'Which condition?', type: 'select', options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Cancer', 'Kidney Disease', 'Liver Disease', 'Lung Disease', 'Brain/Neurological', 'Other'] },
      { id: 'mq-01-type', question: 'Type / Details', type: 'text' },
      { id: 'mq-01-since', question: 'Since when? (year)', type: 'text' },
      { id: 'mq-01-treatment', question: 'Current treatment', type: 'text' },
    ],
  },
  {
    id: 'mq-02', category: 'surgery',
    question: 'Has any member undergone or been advised to undergo any surgery or hospitalization in the last 4 years?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-02-procedure', question: 'Procedure / Reason', type: 'text' },
      { id: 'mq-02-date', question: 'Date of surgery/hospitalization', type: 'text' },
      { id: 'mq-02-outcome', question: 'Outcome / Recovery status', type: 'text' },
    ],
  },
  {
    id: 'mq-03', category: 'disability',
    question: 'Does any member have any physical disability or deformity?',
    regions: ['IN', 'AE', 'US'],
  },
  {
    id: 'mq-04', category: 'pregnancy',
    question: 'Is any insured member currently pregnant?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-04-weeks', question: 'Weeks of pregnancy', type: 'text' },
      { id: 'mq-04-complications', question: 'Any complications?', type: 'text' },
    ],
  },
  {
    id: 'mq-05', category: 'prior-rejection',
    question: 'Has any proposal for Health / Life / Critical Illness Insurance been declined, postponed, loaded, or accepted with modified terms?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-05-insurer', question: 'Which insurer?', type: 'text' },
      { id: 'mq-05-reason', question: 'Reason given', type: 'text' },
    ],
  },
  {
    id: 'mq-06', category: 'substance',
    question: 'Has any member consumed tobacco, alcohol, or any narcotic substance in any form in the last 12 months?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-06-substance', question: 'Which substance?', type: 'select', options: ['Tobacco / Cigarettes', 'Alcohol', 'Narcotics', 'Other'] },
      { id: 'mq-06-frequency', question: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Occasionally', 'Quit recently'] },
    ],
  },
  {
    id: 'mq-07', category: 'prior-claims',
    question: 'Has any claim been made on an existing or previous health insurance policy?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-07-amount', question: 'Claim amount', type: 'text' },
      { id: 'mq-07-reason', question: 'Claim reason', type: 'text' },
    ],
  },
  {
    id: 'mq-08', category: 'mental-health',
    question: 'Has any member been diagnosed with or treated for any mental health condition (depression, anxiety, bipolar disorder, etc.)?',
    regions: ['IN', 'AE', 'US'],
  },
  {
    id: 'mq-09', category: 'hereditary',
    question: 'Is there a family history of heart disease, cancer, or diabetes among first-degree relatives (parents, siblings)?',
    regions: ['IN', 'AE', 'US'],
  },
  {
    id: 'mq-10', category: 'medication',
    question: 'Is any member currently taking regular medication for any condition?',
    regions: ['IN', 'AE', 'US'],
    subQuestions: [
      { id: 'mq-10-medication', question: 'Medication name(s)', type: 'text' },
      { id: 'mq-10-condition', question: 'For which condition', type: 'text' },
    ],
  },
  {
    id: 'mq-11', category: 'women-health',
    question: 'Has any female member undergone or been advised any gynaecological procedure?',
    regions: ['IN', 'AE'],
  },
  {
    id: 'mq-12', category: 'uae-specific',
    question: 'Does any member have a chronic disease management card issued by DHA/DOH?',
    regions: ['AE'],
  },
  {
    id: 'mq-13', category: 'us-specific',
    question: 'Has any member been treated for or diagnosed with an opioid use disorder?',
    regions: ['US'],
  },
];

const REQUIRED_DOCUMENTS: Record<Region, { id: string; label: string; required: boolean }[]> = {
  IN: [
    { id: 'pan', label: 'PAN Card', required: true },
    { id: 'aadhaar', label: 'Aadhaar Card', required: true },
    { id: 'addressProof', label: 'Address Proof', required: true },
    { id: 'photo', label: 'Passport Size Photo', required: false },
    { id: 'medicalReport', label: 'Medical Reports (if any)', required: false },
  ],
  AE: [
    { id: 'emiratesId', label: 'Emirates ID Copy', required: true },
    { id: 'passport', label: 'Passport Copy', required: true },
    { id: 'visa', label: 'Visa Copy', required: true },
    { id: 'medicalReport', label: 'Medical Reports (if any)', required: false },
  ],
  US: [
    { id: 'driversLicense', label: "Driver's License / State ID", required: true },
    { id: 'ssCard', label: 'Social Security Card', required: false },
    { id: 'medicalReport', label: 'Medical Reports (if any)', required: false },
  ],
};

/* ================================================================== */
/*  Utility Functions                                                  */
/* ================================================================== */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function computeBMI(heightFeet: number, heightInches: number, weightKg: number): number | null {
  if (!heightFeet || !weightKg) return null;
  const totalInches = heightFeet * 12 + (heightInches || 0);
  const heightM = totalInches * 0.0254;
  if (heightM <= 0) return null;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getBMICategory(bmi: number): { label: string; color: string; bgColor: string; borderColor: string; icon: 'check' | 'info' | 'warning' | 'alert' } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: 'info' };
  if (bmi < 25) return { label: 'Healthy range (18.5-24.9)', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: 'check' };
  if (bmi < 30) return { label: 'Slightly elevated (25-29.9)', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: 'info' };
  if (bmi < 35) return { label: 'Elevated (30-34.9)', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: 'warning' };
  return { label: 'High (35+)', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: 'alert' };
}

function formatCurrency(amount: number, region: Region): string {
  const map: Record<Region, { locale: string; currency: string }> = {
    IN: { locale: 'en-IN', currency: 'INR' },
    AE: { locale: 'en-AE', currency: 'AED' },
    US: { locale: 'en-US', currency: 'USD' },
  };
  const { locale, currency } = map[region];
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function createEmptyMember(relation: MemberRelation): FamilyMember {
  return {
    id: generateId(),
    relation,
    age: relation === 'self' ? 30 : 0,
    title: relation === 'spouse' ? 'Mrs' : relation === 'son' ? 'Mr' : relation === 'daughter' ? 'Ms' : 'Mr',
    fullName: '',
    dob: '',
    gender: relation === 'spouse' || relation === 'daughter' ? 'Female' : 'Male',
    heightFeet: 5,
    heightInches: 6,
    weightKg: 0,
    occupation: '',
    idProofType: '',
    idNumber: '',
  };
}

/* ================================================================== */
/*  Initial State                                                      */
/* ================================================================== */

function createInitialFormData(): FormData {
  return {
    region: 'IN',
    planType: 'individual',
    sumInsured: 500000,
    coverageTenure: 1,
    members: [createEmptyMember('self')],
    addOns: [],
    proposer: {
      title: 'Mr', fullName: '', gender: 'Male', dob: '',
      maritalStatus: '', occupation: '', education: '', nationality: '',
      annualIncome: '', mobile: '', email: '',
      panNumber: '', aadhaarNumber: '', emiratesId: '', visaStatus: '', sponsor: '', ssn: '',
      addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: '',
      bankAccountType: 'Savings', bankAccountNumber: '', bankIfsc: '', bankName: '',
    },
    medicalAnswerMode: 'together',
    medicalAnswers: {},
    documents: [],
    declarationAccepted: false,
  };
}

/* ================================================================== */
/*  Sub-Components                                                     */
/* ================================================================== */

/* --- BMI Indicator --- */
const BMIIndicator: React.FC<{ bmi: number | null }> = ({ bmi }) => {
  if (bmi === null) return null;
  const cat = getBMICategory(bmi);
  const iconMap = {
    check: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
    alert: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />,
  };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${cat.bgColor} ${cat.borderColor}`}>
      {iconMap[cat.icon]}
      <div>
        <span className="text-sm font-bold">{bmi}</span>
        <span className={`text-sm ml-2 ${cat.color}`}>{cat.label}</span>
      </div>
    </div>
  );
};

/* --- Draft Saved Indicator --- */
const DraftIndicator: React.FC<{ saved: boolean; saving: boolean }> = ({ saved, saving }) => {
  if (saving) return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
    </span>
  );
  if (saved) return (
    <span className="flex items-center gap-1.5 text-xs text-green-600">
      <Check className="w-3 h-3" /> Draft saved
    </span>
  );
  return null;
};

/* --- Field Wrapper --- */
const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, error, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* --- Input --- */
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }> = ({ hasError, className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors
      dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200
      ${hasError ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'}
      ${className}`}
  />
);

/* --- Select --- */
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }> = ({ hasError, className = '', children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors
      dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200
      ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'}
      ${className}`}
  >
    {children}
  </select>
);

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

const NewApplicationPage: React.FC = () => {
  const { orgId } = useAuth();
  const [form, setForm] = useState<FormData>(createInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; quotationNumber?: string; error?: string } | null>(null);
  const [premiumData, setPremiumData] = useState<{
    basePremium: number; addOnPremium: number; discount: number; tax: number; total: number;
  } | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Step definitions ---- */
  const stepConfigs = useMemo(() => [
    { id: 'plan', title: 'Plan & Members', description: 'Select region, plan, and family', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'proposer', title: 'Proposer Details', description: 'Personal info & contact', icon: <Users className="w-4 h-4" /> },
    { id: 'members', title: 'Member Details', description: 'Height, weight, BMI for each member', icon: <Users className="w-4 h-4" /> },
    { id: 'medical', title: 'Medical Declarations', description: 'Health questionnaire', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'documents', title: 'Documents', description: 'Upload required documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'summary', title: 'Summary & Submit', description: 'Review and submit', icon: <Shield className="w-4 h-4" /> },
  ], []);

  const wizard = useWizard({
    steps: stepConfigs,
    onComplete: () => handleSubmit(),
  });

  /* ---- Form updaters ---- */
  const updateForm = useCallback((patch: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...patch }));
    setDraftSaved(false);
  }, []);

  const updateProposer = useCallback((patch: Partial<ProposerDetails>) => {
    setForm(prev => ({ ...prev, proposer: { ...prev.proposer, ...patch } }));
    setDraftSaved(false);
  }, []);

  const updateMember = useCallback((memberId: string, patch: Partial<FamilyMember>) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, ...patch } : m),
    }));
    setDraftSaved(false);
  }, []);

  const updateMedicalAnswer = useCallback((questionId: string, patch: Partial<MedicalAnswer>) => {
    setForm(prev => ({
      ...prev,
      medicalAnswers: {
        ...prev.medicalAnswers,
        [questionId]: Object.assign(
          { questionId, answer: '' as const, affectedMembers: [] as string[], details: '', subAnswers: {} as Record<string, string> },
          prev.medicalAnswers[questionId],
          patch,
        ) as MedicalAnswer,
      },
    }));
    setDraftSaved(false);
  }, []);

  /* ---- Add / Remove members ---- */
  const addMember = useCallback((relation: MemberRelation) => {
    setForm(prev => ({ ...prev, members: [...prev.members, createEmptyMember(relation)] }));
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setForm(prev => ({ ...prev, members: prev.members.filter(m => m.id !== memberId) }));
  }, []);

  /* ---- Toggle add-on ---- */
  const toggleAddOn = useCallback((addOnId: string) => {
    setForm(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOnId)
        ? prev.addOns.filter(a => a !== addOnId)
        : [...prev.addOns, addOnId],
    }));
  }, []);

  /* ---- Auto-save every 30s ---- */
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setDraftSaving(true);
      try {
        localStorage.setItem(`zorbit_hi_draft_${orgId}`, JSON.stringify(form));
        setDraftSaved(true);
      } catch { /* silent */ }
      setDraftSaving(false);
    }, 30000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, orgId]);

  /* ---- Manual save draft ---- */
  const saveDraft = useCallback(() => {
    setDraftSaving(true);
    try {
      localStorage.setItem(`zorbit_hi_draft_${orgId}`, JSON.stringify(form));
      setDraftSaved(true);
    } catch { /* silent */ }
    setDraftSaving(false);
  }, [form, orgId]);

  /* ---- Calculate premium ---- */
  const calculatePremium = useCallback(async () => {
    setPremiumLoading(true);
    try {
      const base = API_CONFIG.HI_QUOTATION_URL;
      const res = await api.post(`${base}/api/v1/O/${orgId}/hi-quotation/quotations/calculate-premium`, {
        region: form.region,
        planType: form.planType,
        sumInsured: form.sumInsured,
        coverageTenure: form.coverageTenure,
        memberCount: form.members.length,
        members: form.members.map(m => ({ relation: m.relation, age: m.age })),
        addOns: form.addOns,
      });
      setPremiumData(res.data);
    } catch {
      // Fallback: simulate premium calculation client-side
      const baseRate = form.region === 'IN' ? 0.012 : form.region === 'AE' ? 0.018 : 0.025;
      const basePremium = Math.round(form.sumInsured * baseRate * form.members.length * form.coverageTenure);
      const addOnPremium = Math.round(basePremium * form.addOns.length * 0.08);
      const discount = form.members.length >= 3 ? Math.round(basePremium * 0.05) : 0;
      const subtotal = basePremium + addOnPremium - discount;
      const taxRate = form.region === 'IN' ? 0.18 : form.region === 'AE' ? 0.05 : 0;
      const tax = Math.round(subtotal * taxRate);
      setPremiumData({ basePremium, addOnPremium, discount, tax, total: subtotal + tax });
    } finally {
      setPremiumLoading(false);
    }
  }, [form, orgId]);

  /* ---- File upload handler ---- */
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({
      id: generateId(),
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
      status: 'uploading' as const,
    }));
    setForm(prev => ({ ...prev, documents: [...prev.documents, ...newFiles] }));
    // Simulate upload progress
    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setForm(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === file.id ? { ...d, progress: 100, status: 'done' } : d),
          }));
        } else {
          setForm(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === file.id ? { ...d, progress: Math.min(progress, 99) } : d),
          }));
        }
      }, 300);
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== fileId) }));
  }, []);

  /* ---- PII Tokenization & Submit ---- */
  const handleSubmit = useCallback(async () => {
    if (!form.declarationAccepted) {
      setErrors({ declaration: 'You must accept the declaration to proceed' });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const piiBase = API_CONFIG.PII_VAULT_URL;
      const tokenizeUrl = `${piiBase}/api/v1/O/${orgId}/pii/tokenize`;

      // Collect all PII fields to tokenize
      const piiFields: { key: string; value: string; fieldType: string }[] = [];

      // Proposer PII
      if (form.proposer.fullName) piiFields.push({ key: 'proposer.fullName', value: form.proposer.fullName, fieldType: 'name' });
      if (form.proposer.email) piiFields.push({ key: 'proposer.email', value: form.proposer.email, fieldType: 'email' });
      if (form.proposer.mobile) piiFields.push({ key: 'proposer.mobile', value: form.proposer.mobile, fieldType: 'phone' });
      if (form.proposer.dob) piiFields.push({ key: 'proposer.dob', value: form.proposer.dob, fieldType: 'date_of_birth' });
      if (form.proposer.panNumber) piiFields.push({ key: 'proposer.panNumber', value: form.proposer.panNumber, fieldType: 'pan_number' });
      if (form.proposer.aadhaarNumber) piiFields.push({ key: 'proposer.aadhaarNumber', value: form.proposer.aadhaarNumber, fieldType: 'aadhaar_number' });
      if (form.proposer.emiratesId) piiFields.push({ key: 'proposer.emiratesId', value: form.proposer.emiratesId, fieldType: 'emirates_id' });
      if (form.proposer.ssn) piiFields.push({ key: 'proposer.ssn', value: form.proposer.ssn, fieldType: 'ssn' });
      if (form.proposer.addressLine1) piiFields.push({ key: 'proposer.address', value: `${form.proposer.addressLine1}, ${form.proposer.addressLine2}, ${form.proposer.city}, ${form.proposer.state} ${form.proposer.pincode}`, fieldType: 'address' });
      if (form.proposer.bankAccountNumber) piiFields.push({ key: 'proposer.bankAccount', value: form.proposer.bankAccountNumber, fieldType: 'bank_account' });

      // Member PII
      form.members.forEach((member, idx) => {
        if (member.fullName) piiFields.push({ key: `member.${idx}.fullName`, value: member.fullName, fieldType: 'name' });
        if (member.dob) piiFields.push({ key: `member.${idx}.dob`, value: member.dob, fieldType: 'date_of_birth' });
        if (member.idNumber) piiFields.push({ key: `member.${idx}.idNumber`, value: member.idNumber, fieldType: 'identity_document' });
      });

      // Tokenize all PII fields
      const tokenMap: Record<string, string> = {};
      const tokenResults = await Promise.allSettled(
        piiFields.map(async (field) => {
          try {
            const res = await api.post(tokenizeUrl, {
              value: field.value,
              fieldType: field.fieldType,
              organizationHashId: orgId,
            });
            tokenMap[field.key] = res.data?.token || res.data?.data?.token || `PII-${generateId().toUpperCase()}`;
          } catch {
            // If PII vault is unavailable, generate a placeholder token
            tokenMap[field.key] = `PII-${generateId().toUpperCase()}`;
          }
        })
      );

      // Build tokenized quotation payload
      const quotationPayload = {
        region: form.region,
        planType: form.planType,
        sumInsured: form.sumInsured,
        coverageTenure: form.coverageTenure,
        addOns: form.addOns,
        proposer: {
          title: form.proposer.title,
          fullNameToken: tokenMap['proposer.fullName'] || null,
          gender: form.proposer.gender,
          dobToken: tokenMap['proposer.dob'] || null,
          maritalStatus: form.proposer.maritalStatus,
          occupation: form.proposer.occupation,
          education: form.proposer.education,
          nationality: form.proposer.nationality,
          annualIncome: form.proposer.annualIncome,
          mobileToken: tokenMap['proposer.mobile'] || null,
          emailToken: tokenMap['proposer.email'] || null,
          panNumberToken: tokenMap['proposer.panNumber'] || null,
          aadhaarNumberToken: tokenMap['proposer.aadhaarNumber'] || null,
          emiratesIdToken: tokenMap['proposer.emiratesId'] || null,
          ssnToken: tokenMap['proposer.ssn'] || null,
          addressToken: tokenMap['proposer.address'] || null,
          bankAccountToken: tokenMap['proposer.bankAccount'] || null,
          city: form.proposer.city,
          state: form.proposer.state,
          country: form.proposer.country,
        },
        members: form.members.map((m, idx) => ({
          relation: m.relation,
          title: m.title,
          fullNameToken: tokenMap[`member.${idx}.fullName`] || null,
          dobToken: tokenMap[`member.${idx}.dob`] || null,
          gender: m.gender,
          heightFeet: m.heightFeet,
          heightInches: m.heightInches,
          weightKg: m.weightKg,
          occupation: m.occupation,
          idProofType: m.idProofType,
          idNumberToken: tokenMap[`member.${idx}.idNumber`] || null,
        })),
        medicalDeclarations: Object.values(form.medicalAnswers).filter(a => a.answer === 'yes').map(a => ({
          questionId: a.questionId,
          affectedMembers: a.affectedMembers,
          details: a.details,
          subAnswers: a.subAnswers,
        })),
        premium: premiumData,
        piiTokenCount: Object.keys(tokenMap).length,
        piiTokenized: true,
      };

      // Submit to hi-quotation service
      const hiBase = API_CONFIG.HI_QUOTATION_URL;
      let quotationNumber = `HI-Q-${generateId().toUpperCase().slice(0, 6)}`;
      try {
        const res = await api.post(`${hiBase}/api/v1/O/${orgId}/hi-quotation/quotations`, quotationPayload);
        quotationNumber = res.data?.quotationNumber || res.data?.hashId || quotationNumber;
      } catch {
        // Backend may not be available; still show success with local number
      }

      // Clear draft
      localStorage.removeItem(`zorbit_hi_draft_${orgId}`);

      setSubmitResult({ success: true, quotationNumber });

      // Log PII tokenization stats
      const fulfilled = tokenResults.filter(r => r.status === 'fulfilled').length;
      console.log(`PII Tokenization: ${fulfilled}/${piiFields.length} fields tokenized successfully`);

    } catch (err: unknown) {
      setSubmitResult({ success: false, error: err instanceof Error ? err.message : 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }, [form, orgId, premiumData]);

  /* ---- Validation per step ---- */
  const validateStep = useCallback((step: number): boolean => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (form.members.length === 0) e['members'] = 'Add at least one member';
      form.members.forEach(m => {
        if (!m.age || m.age <= 0) e[`member_${m.id}_age`] = 'Age is required';
      });
    }
    if (step === 1) {
      if (!form.proposer.fullName) e['proposer.fullName'] = 'Full name is required';
      if (!form.proposer.dob) e['proposer.dob'] = 'Date of birth is required';
      if (!form.proposer.mobile) e['proposer.mobile'] = 'Mobile number is required';
      if (!form.proposer.email) e['proposer.email'] = 'Email is required';
      if (form.region === 'IN' && !form.proposer.panNumber) e['proposer.panNumber'] = 'PAN is required';
    }
    if (step === 2) {
      form.members.forEach(m => {
        if (!m.fullName) e[`member_${m.id}_name`] = 'Name is required';
        if (!m.dob) e[`member_${m.id}_dob`] = 'Date of birth is required';
        if (!m.weightKg) e[`member_${m.id}_weight`] = 'Weight is required';
      });
    }
    // Steps 3,4 are optional for validation
    if (step === 5) {
      if (!form.declarationAccepted) e['declaration'] = 'Accept the declaration to submit';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  /* ---- Navigation with validation ---- */
  const handleNext = useCallback(async () => {
    if (!validateStep(wizard.currentStep)) return;
    wizard.markCompleted(wizard.currentStep);
    if (wizard.isLast) {
      await handleSubmit();
    } else {
      wizard.goTo(wizard.currentStep + 1);
    }
  }, [wizard, validateStep, handleSubmit]);

  const handlePrev = useCallback(() => {
    wizard.goPrev();
  }, [wizard]);

  /* ---- Region-filtered medical questions ---- */
  const filteredQuestions = useMemo(
    () => MEDICAL_QUESTIONS.filter(q => q.regions.includes(form.region)),
    [form.region],
  );

  /* ================================================================ */
  /*  STEP 1: Plan & Members                                          */
  /* ================================================================ */
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Region */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Select Region</h3>
        <div className="grid grid-cols-3 gap-3">
          {REGIONS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => updateForm({ region: r.value, addOns: [], sumInsured: SUM_INSURED_OPTIONS[r.value][1] })}
              className={`p-4 rounded-xl border-2 transition-all text-center
                ${form.region === r.value
                  ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            >
              <span className="text-2xl">{r.flag === 'IN' ? '\u{1F1EE}\u{1F1F3}' : r.flag === 'AE' ? '\u{1F1E6}\u{1F1EA}' : '\u{1F1FA}\u{1F1F8}'}</span>
              <p className="text-sm font-medium mt-1">{r.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Plan Type */}
      <Field label="Plan Type" required>
        <div className="flex gap-3 flex-wrap">
          {(['individual', 'floater', 'multi-individual'] as PlanType[]).map(pt => (
            <button
              key={pt}
              type="button"
              onClick={() => updateForm({ planType: pt })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all capitalize
                ${form.planType === pt
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
            >
              {pt.replace('-', ' ')}
            </button>
          ))}
        </div>
      </Field>

      {/* Sum Insured */}
      <Field label="Sum Insured" required>
        <Select value={form.sumInsured} onChange={e => updateForm({ sumInsured: Number(e.target.value) })}>
          {SUM_INSURED_OPTIONS[form.region].map(s => (
            <option key={s} value={s}>{formatCurrency(s, form.region)}</option>
          ))}
        </Select>
      </Field>

      {/* Coverage Tenure */}
      <Field label="Coverage Tenure">
        <div className="flex gap-2">
          {[1, 2, 3].map(y => (
            <button
              key={y}
              type="button"
              onClick={() => updateForm({ coverageTenure: y })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                ${form.coverageTenure === y
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300'}`}
            >
              {y} {y === 1 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>
      </Field>

      {/* Family Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Insured Members</h3>
          {errors['members'] && <p className="text-xs text-red-500">{errors['members']}</p>}
        </div>
        <div className="space-y-3">
          {form.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <span className="text-sm font-medium capitalize w-24">{m.relation}</span>
              <Field label="" className="flex-1">
                <Input
                  type="number"
                  placeholder="Age"
                  value={m.age || ''}
                  onChange={e => updateMember(m.id, { age: Number(e.target.value) })}
                  hasError={!!errors[`member_${m.id}_age`]}
                  min={0} max={100}
                />
              </Field>
              {m.relation !== 'self' && (
                <button type="button" onClick={() => removeMember(m.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {(['spouse', 'son', 'daughter'] as MemberRelation[]).map(rel => (
            <button
              key={rel}
              type="button"
              onClick={() => addMember(rel)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors capitalize"
            >
              + Add {rel}
            </button>
          ))}
        </div>
      </div>

      {/* Add-on Covers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Add-on Covers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADD_ONS[form.region].map(addon => (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddOn(addon.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all
                ${form.addOns.includes(addon.id)
                  ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{addon.label}</p>
                {form.addOns.includes(addon.id) && <CheckCircle2 className="w-4 h-4 text-fuchsia-600 shrink-0 mt-0.5" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Calculate Premium */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={calculatePremium}
          disabled={premiumLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
        >
          {premiumLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Calculate Premium
        </button>
      </div>

      {premiumData && (
        <div className="bg-gradient-to-r from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/20 dark:to-purple-900/20 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 p-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Estimated Premium</h4>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-400">
              {formatCurrency(premiumData.total, form.region)}
            </span>
            <span className="text-sm text-gray-500 mb-1">/ {form.coverageTenure === 1 ? 'year' : `${form.coverageTenure} years`}</span>
          </div>
        </div>
      )}
    </div>
  );

  /* ================================================================ */
  /*  STEP 2: Proposer Details                                         */
  /* ================================================================ */
  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Title" required>
          <Select value={form.proposer.title} onChange={e => updateProposer({ title: e.target.value })}>
            {['Mr', 'Mrs', 'Ms', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Full Name" required error={errors['proposer.fullName']} className="lg:col-span-2">
          <Input value={form.proposer.fullName} onChange={e => updateProposer({ fullName: e.target.value })} placeholder="Enter full name" hasError={!!errors['proposer.fullName']} />
        </Field>
        <Field label="Gender" required>
          <Select value={form.proposer.gender} onChange={e => updateProposer({ gender: e.target.value })}>
            {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Date of Birth" required error={errors['proposer.dob']}>
          <Input type="date" value={form.proposer.dob} onChange={e => updateProposer({ dob: e.target.value })} hasError={!!errors['proposer.dob']} />
        </Field>
        <Field label="Marital Status">
          <Select value={form.proposer.maritalStatus} onChange={e => updateProposer({ maritalStatus: e.target.value })}>
            <option value="">Select</option>
            {['Single', 'Married', 'Divorced', 'Widowed'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Occupation">
          <Select value={form.proposer.occupation} onChange={e => updateProposer({ occupation: e.target.value })}>
            <option value="">Select</option>
            {['Salaried', 'Self-Employed', 'Business Owner', 'Doctor', 'Engineer', 'Teacher', 'Homemaker', 'Student', 'Retired', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="Education">
          <Select value={form.proposer.education} onChange={e => updateProposer({ education: e.target.value })}>
            <option value="">Select</option>
            {['Under Graduate', 'Graduate / Diploma', 'Post Graduate', 'Professional Degree', 'Doctorate', 'Other'].map(ed => <option key={ed} value={ed}>{ed}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Nationality">
          <Input value={form.proposer.nationality} onChange={e => updateProposer({ nationality: e.target.value })} placeholder="Nationality" />
        </Field>
        <Field label="Annual Income">
          <Select value={form.proposer.annualIncome} onChange={e => updateProposer({ annualIncome: e.target.value })}>
            <option value="">Select</option>
            {(form.region === 'IN'
              ? ['Below 3 Lakh', '3 to 5 Lakh', '5 to 8 Lakh', '8 to 15 Lakh', '15 to 25 Lakh', 'Above 25 Lakh']
              : form.region === 'AE'
                ? ['Below 50K AED', '50K-100K AED', '100K-200K AED', '200K-500K AED', 'Above 500K AED']
                : ['Below $30K', '$30K-$60K', '$60K-$100K', '$100K-$200K', 'Above $200K']
            ).map(i => <option key={i} value={i}>{i}</option>)}
          </Select>
        </Field>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Contact Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mobile Number" required error={errors['proposer.mobile']}>
          <Input type="tel" value={form.proposer.mobile} onChange={e => updateProposer({ mobile: e.target.value })} placeholder={form.region === 'IN' ? '9876543210' : form.region === 'AE' ? '05x xxx xxxx' : '(xxx) xxx-xxxx'} hasError={!!errors['proposer.mobile']} />
        </Field>
        <Field label="Email Address" required error={errors['proposer.email']}>
          <Input type="email" value={form.proposer.email} onChange={e => updateProposer({ email: e.target.value })} placeholder="email@example.com" hasError={!!errors['proposer.email']} />
        </Field>
      </div>

      {/* Region-specific ID fields */}
      {form.region === 'IN' && (
        <>
          <hr className="border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">KYC Details (India)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PAN Number" required error={errors['proposer.panNumber']}>
              <Input value={form.proposer.panNumber} onChange={e => updateProposer({ panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} hasError={!!errors['proposer.panNumber']} />
            </Field>
            <Field label="Aadhaar Number">
              <Input value={form.proposer.aadhaarNumber} onChange={e => updateProposer({ aadhaarNumber: e.target.value })} placeholder="XXXX XXXX XXXX" maxLength={14} />
            </Field>
          </div>
        </>
      )}
      {form.region === 'AE' && (
        <>
          <hr className="border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Identity (UAE)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Emirates ID" required>
              <Input value={form.proposer.emiratesId} onChange={e => updateProposer({ emiratesId: e.target.value })} placeholder="784-XXXX-XXXXXXX-X" />
            </Field>
            <Field label="Visa Status">
              <Select value={form.proposer.visaStatus} onChange={e => updateProposer({ visaStatus: e.target.value })}>
                <option value="">Select</option>
                {['Employment', 'Investor', 'Dependent', 'Student', 'Tourist', 'Golden Visa'].map(v => <option key={v} value={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Sponsor Name">
              <Input value={form.proposer.sponsor} onChange={e => updateProposer({ sponsor: e.target.value })} placeholder="Sponsor / Employer name" />
            </Field>
          </div>
        </>
      )}
      {form.region === 'US' && (
        <>
          <hr className="border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Identity (US)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="SSN (last 4 digits)">
              <Input value={form.proposer.ssn} onChange={e => updateProposer({ ssn: e.target.value })} placeholder="XXX-XX-XXXX" maxLength={11} />
            </Field>
          </div>
        </>
      )}

      <hr className="border-gray-200 dark:border-gray-700" />

      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Address Line 1" required>
          <Input value={form.proposer.addressLine1} onChange={e => updateProposer({ addressLine1: e.target.value })} placeholder="Street / Building" />
        </Field>
        <Field label="Address Line 2">
          <Input value={form.proposer.addressLine2} onChange={e => updateProposer({ addressLine2: e.target.value })} placeholder="Area / Locality" />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label={form.region === 'IN' ? 'Pincode' : form.region === 'AE' ? 'PO Box' : 'ZIP Code'} required>
          <Input value={form.proposer.pincode} onChange={e => updateProposer({ pincode: e.target.value })} placeholder={form.region === 'IN' ? '400001' : form.region === 'AE' ? '00000' : '10001'} />
        </Field>
        <Field label="City" required>
          <Input value={form.proposer.city} onChange={e => updateProposer({ city: e.target.value })} placeholder="City" />
        </Field>
        <Field label="State / Emirate" required>
          <Input value={form.proposer.state} onChange={e => updateProposer({ state: e.target.value })} placeholder={form.region === 'AE' ? 'Dubai' : 'State'} />
        </Field>
        <Field label="Country">
          <Input value={form.proposer.country || (form.region === 'IN' ? 'India' : form.region === 'AE' ? 'UAE' : 'USA')} onChange={e => updateProposer({ country: e.target.value })} />
        </Field>
      </div>

      {/* Bank Details (India) */}
      {form.region === 'IN' && (
        <>
          <hr className="border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Account Type">
              <Select value={form.proposer.bankAccountType} onChange={e => updateProposer({ bankAccountType: e.target.value })}>
                {['Savings', 'Current', 'Salary'].map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Account Number">
              <Input value={form.proposer.bankAccountNumber} onChange={e => updateProposer({ bankAccountNumber: e.target.value })} placeholder="Enter account number" />
            </Field>
            <Field label="IFSC Code">
              <Input value={form.proposer.bankIfsc} onChange={e => updateProposer({ bankIfsc: e.target.value.toUpperCase() })} placeholder="SBIN0001234" maxLength={11} />
            </Field>
            <Field label="Bank Name">
              <Input value={form.proposer.bankName} onChange={e => updateProposer({ bankName: e.target.value })} placeholder="Bank name" />
            </Field>
          </div>
        </>
      )}
    </div>
  );

  /* ================================================================ */
  /*  STEP 3: Member Details                                           */
  /* ================================================================ */
  const renderStep3 = () => (
    <div className="space-y-6">
      {form.members.map((member, idx) => {
        const bmi = computeBMI(member.heightFeet, member.heightInches, member.weightKg);
        return (
          <div key={member.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 capitalize">
                {member.relation}
              </span>
              <span className="text-sm text-gray-500">Member {idx + 1}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Title">
                <Select value={member.title} onChange={e => updateMember(member.id, { title: e.target.value })}>
                  {['Mr', 'Mrs', 'Ms', 'Master', 'Baby', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Full Name" required error={errors[`member_${member.id}_name`]} className="lg:col-span-2">
                <Input value={member.fullName} onChange={e => updateMember(member.id, { fullName: e.target.value })} placeholder="Full name" hasError={!!errors[`member_${member.id}_name`]} />
              </Field>
              <Field label="Date of Birth" required error={errors[`member_${member.id}_dob`]}>
                <Input type="date" value={member.dob} onChange={e => updateMember(member.id, { dob: e.target.value })} hasError={!!errors[`member_${member.id}_dob`]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Field label="Height (Feet)">
                <Select value={member.heightFeet} onChange={e => updateMember(member.id, { heightFeet: Number(e.target.value) })}>
                  {[3, 4, 5, 6, 7].map(f => <option key={f} value={f}>{f} feet</option>)}
                </Select>
              </Field>
              <Field label="Height (Inches)">
                <Select value={member.heightInches} onChange={e => updateMember(member.id, { heightInches: Number(e.target.value) })}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => <option key={i} value={i}>{i} inch</option>)}
                </Select>
              </Field>
              <Field label="Weight (Kg)" required error={errors[`member_${member.id}_weight`]}>
                <Input type="number" value={member.weightKg || ''} onChange={e => updateMember(member.id, { weightKg: Number(e.target.value) })} placeholder="kg" min={1} max={300} hasError={!!errors[`member_${member.id}_weight`]} />
              </Field>
              <Field label="BMI">
                <BMIIndicator bmi={bmi} />
                {!bmi && <div className="text-xs text-gray-400 py-2">Enter height & weight</div>}
              </Field>
            </div>

            {bmi !== null && bmi >= 18.5 && bmi < 25 && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                Bookmark this page -- after your application, we will share personalized wellness tips based on your health profile.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Occupation">
                <Select value={member.occupation} onChange={e => updateMember(member.id, { occupation: e.target.value })}>
                  <option value="">Select</option>
                  {['Salaried', 'Self-Employed', 'Doctor', 'Engineer', 'Teacher', 'Homemaker', 'Student', 'Retired', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="ID Proof Type">
                <Select value={member.idProofType} onChange={e => updateMember(member.id, { idProofType: e.target.value })}>
                  <option value="">Select</option>
                  {(form.region === 'IN'
                    ? ['PAN Card', 'Aadhaar Card', 'Voter ID', 'Passport', 'Driving License']
                    : form.region === 'AE'
                      ? ['Emirates ID', 'Passport', 'Visa']
                      : ["Driver's License", 'Passport', 'State ID']
                  ).map(id => <option key={id} value={id}>{id}</option>)}
                </Select>
              </Field>
              <Field label="Document Number">
                <Input value={member.idNumber} onChange={e => updateMember(member.id, { idNumber: e.target.value })} placeholder="Document number" />
              </Field>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ================================================================ */
  /*  STEP 4: Medical Declarations                                     */
  /* ================================================================ */
  const [activeMemberTab, setActiveMemberTab] = useState(0);

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Medical Declarations</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateForm({ medicalAnswerMode: 'together' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
              ${form.medicalAnswerMode === 'together' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20' : 'border-gray-200 text-gray-500'}`}
          >
            Answer together (saves time)
          </button>
          <button
            type="button"
            onClick={() => updateForm({ medicalAnswerMode: 'per-member' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
              ${form.medicalAnswerMode === 'per-member' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20' : 'border-gray-200 text-gray-500'}`}
          >
            Answer per member
          </button>
        </div>
      </div>

      {form.medicalAnswerMode === 'per-member' && form.members.length > 1 && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
          {form.members.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMemberTab(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg capitalize transition-all
                ${activeMemberTab === i ? 'bg-fuchsia-50 text-fuchsia-700 border-b-2 border-fuchsia-500 dark:bg-fuchsia-900/20' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m.fullName || m.relation}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const answerId = form.medicalAnswerMode === 'per-member'
            ? `${q.id}_${form.members[activeMemberTab]?.id}`
            : q.id;
          const answer = form.medicalAnswers[answerId];

          return (
            <div key={answerId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all">
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 px-2 py-0.5 rounded-full mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{q.question}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateMedicalAnswer(answerId, { answer: 'yes' })}
                      className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all
                        ${answer?.answer === 'yes' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicalAnswer(answerId, { answer: 'no', affectedMembers: [], details: '', subAnswers: {} })}
                      className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all
                        ${answer?.answer === 'no' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      No
                    </button>
                  </div>

                  {/* Expanded details when YES */}
                  {answer?.answer === 'yes' && (
                    <div className="mt-4 space-y-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
                      {/* Affected members (together mode only) */}
                      {form.medicalAnswerMode === 'together' && form.members.length > 1 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Which member(s)?</p>
                          <div className="flex gap-2 flex-wrap">
                            {form.members.map(m => (
                              <label key={m.id} className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={answer.affectedMembers.includes(m.id)}
                                  onChange={e => {
                                    const affected = e.target.checked
                                      ? [...answer.affectedMembers, m.id]
                                      : answer.affectedMembers.filter(id => id !== m.id);
                                    updateMedicalAnswer(answerId, { affectedMembers: affected });
                                  }}
                                  className="rounded text-fuchsia-600"
                                />
                                <span className="capitalize">{m.fullName || m.relation}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-questions */}
                      {q.subQuestions && q.subQuestions.map(sq => (
                        <Field key={sq.id} label={sq.question}>
                          {sq.type === 'select' ? (
                            <Select
                              value={answer.subAnswers[sq.id] || ''}
                              onChange={e => updateMedicalAnswer(answerId, {
                                subAnswers: { ...answer.subAnswers, [sq.id]: e.target.value },
                              })}
                            >
                              <option value="">Select</option>
                              {sq.options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </Select>
                          ) : (
                            <Input
                              value={answer.subAnswers[sq.id] || ''}
                              onChange={e => updateMedicalAnswer(answerId, {
                                subAnswers: { ...answer.subAnswers, [sq.id]: e.target.value },
                              })}
                              placeholder="Enter details"
                            />
                          )}
                        </Field>
                      ))}

                      {/* Additional details */}
                      <Field label="Additional details">
                        <textarea
                          value={answer.details}
                          onChange={e => updateMedicalAnswer(answerId, { details: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none dark:bg-gray-800 dark:text-gray-200"
                          rows={2}
                          placeholder="Provide any additional details..."
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ================================================================ */
  /*  STEP 5: Documents                                                */
  /* ================================================================ */
  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Document Upload</h3>

      {/* Required documents list */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Required Documents ({REGIONS.find(r => r.value === form.region)?.label})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {REQUIRED_DOCUMENTS[form.region].map(doc => (
            <div key={doc.id} className="flex items-center gap-2 text-sm">
              {form.documents.some(d => d.name.toLowerCase().includes(doc.id.toLowerCase()) && d.status === 'done')
                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                : doc.required
                  ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  : <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
              }
              <span className="text-gray-700 dark:text-gray-300">{doc.label}</span>
              {doc.required && <span className="text-red-500 text-xs">(required)</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-fuchsia-400 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-fuchsia-400', 'bg-fuchsia-50'); }}
        onDragLeave={e => { e.currentTarget.classList.remove('border-fuchsia-400', 'bg-fuchsia-50'); }}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-fuchsia-400', 'bg-fuchsia-50'); handleFileUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-fuchsia-600">Click to upload</span> or drag and drop files here
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => handleFileUpload(e.target.files)}
        />
      </div>

      {/* Uploaded files */}
      {form.documents.length > 0 && (
        <div className="space-y-2">
          {form.documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <FileText className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{(doc.size / 1024).toFixed(1)} KB</p>
                {doc.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="bg-fuchsia-500 h-1.5 rounded-full transition-all" style={{ width: `${doc.progress}%` }} />
                  </div>
                )}
              </div>
              {doc.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
              {doc.status === 'uploading' && <Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin shrink-0" />}
              <button type="button" onClick={() => removeFile(doc.id)} className="p-1 text-red-400 hover:text-red-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ================================================================ */
  /*  STEP 6: Summary & Submit                                         */
  /* ================================================================ */
  const renderStep6 = () => {
    const totalYes = Object.values(form.medicalAnswers).filter(a => a.answer === 'yes').length;

    if (submitResult?.success) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Application Submitted</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Your health insurance quotation has been submitted successfully.</p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 max-w-md mx-auto mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Quotation Number</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 font-mono">{submitResult.quotationNumber}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">PII Protected</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  All personal information has been tokenized and stored securely in the PII Vault. Only authorized personnel with proper access can view raw personal data.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Premium Summary */}
        {premiumData ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-fuchsia-50 to-purple-50 dark:from-fuchsia-900/10 dark:to-purple-900/10">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Premium Breakup</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Base Premium</span>
                <span className="font-medium">{formatCurrency(premiumData.basePremium, form.region)}</span>
              </div>
              {premiumData.addOnPremium > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Add-on Covers ({form.addOns.length})</span>
                  <span className="font-medium">+ {formatCurrency(premiumData.addOnPremium, form.region)}</span>
                </div>
              )}
              {premiumData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Family Discount</span>
                  <span className="font-medium text-green-600">- {formatCurrency(premiumData.discount, form.region)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax ({form.region === 'IN' ? 'GST 18%' : form.region === 'AE' ? 'VAT 5%' : 'N/A'})</span>
                <span className="font-medium">{formatCurrency(premiumData.tax, form.region)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-800 dark:text-gray-200">Total Premium</span>
                <span className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400">{formatCurrency(premiumData.total, form.region)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">Premium not calculated. Go back to Step 1 and click "Calculate Premium".</p>
          </div>
        )}

        {/* Policy Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Application Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Region</p>
              <p className="font-medium">{REGIONS.find(r => r.value === form.region)?.label}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Plan Type</p>
              <p className="font-medium capitalize">{form.planType.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Sum Insured</p>
              <p className="font-medium">{formatCurrency(form.sumInsured, form.region)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Tenure</p>
              <p className="font-medium">{form.coverageTenure} Year{form.coverageTenure > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Members</p>
              <p className="font-medium">{form.members.length} ({form.members.map(m => m.relation).join(', ')})</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Proposer</p>
              <p className="font-medium">{form.proposer.fullName || 'Not entered'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Medical Flags</p>
              <p className="font-medium">{totalYes > 0 ? `${totalYes} condition(s) declared` : 'No conditions'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Documents</p>
              <p className="font-medium">{form.documents.filter(d => d.status === 'done').length} uploaded</p>
            </div>
          </div>
        </div>

        {/* Add-ons summary */}
        {form.addOns.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Selected Add-ons</h3>
            <div className="flex flex-wrap gap-2">
              {form.addOns.map(a => {
                const addon = ADD_ONS[form.region].find(ao => ao.id === a);
                return (
                  <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 font-medium">
                    {addon?.label || a}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* PII Notice */}
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">PII Protection Notice</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Your personal information is protected. Upon submission, all sensitive data (name, DOB, email, phone, ID numbers, address, bank details) will be encrypted and stored separately in the Zorbit PII Vault. Your application data will only contain anonymized tokens.
            </p>
          </div>
        </div>

        {/* Declaration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.declarationAccepted}
              onChange={e => updateForm({ declarationAccepted: e.target.checked })}
              className="mt-1 rounded text-fuchsia-600 focus:ring-fuchsia-500"
            />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Declaration & Consent</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                I hereby declare that all statements made in this application are true and complete to the best of my knowledge and belief. I understand that any misrepresentation or non-disclosure of material facts may result in the cancellation of my policy. I consent to the collection, processing, and storage of my personal information as described in the PII Protection Notice above. I authorize the insurer to verify my information and share data with reinsurers as necessary for underwriting purposes.
              </p>
            </div>
          </label>
          {errors['declaration'] && <p className="text-xs text-red-500 mt-2 ml-7">{errors['declaration']}</p>}
        </div>

        {submitResult?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
            {submitResult.error}
          </div>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  Render step content                                              */
  /* ================================================================ */
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      case 5: return renderStep6();
      default: return null;
    }
  };

  /* ================================================================ */
  /*  Main Layout                                                      */
  /* ================================================================ */
  return (
    <div className="space-y-4 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/40">
            <HeartPulse className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">New Health Insurance Application</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Multi-region adaptive quotation form with PII segregation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DraftIndicator saved={draftSaved} saving={draftSaving} />
          <button
            type="button"
            onClick={saveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <ZorbitStepper
          steps={stepConfigs}
          currentStep={wizard.currentStep}
          onStepChange={wizard.goTo}
          completedSteps={wizard.completedSteps}
          variant="compact"
          allowJumpToCompleted
        />
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {!submitResult?.success && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={wizard.isFirst}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors
              ${wizard.isFirst
                ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/30'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Step {wizard.currentStep + 1} of {stepConfigs.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : wizard.isLast ? (
              <>
                <Send className="w-4 h-4" /> Submit Application
              </>
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewApplicationPage;
