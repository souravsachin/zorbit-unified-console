// =============================================================================
// PCG4 Configurator — Type Definitions
// =============================================================================

/* ------------------------------------------------------------------ */
/*  Insurer                                                            */
/* ------------------------------------------------------------------ */
export interface InsurerDetails {
  name: string;
  description: string;
  internal_code: string;
  regulator_assigned_code: string;
}

/* ------------------------------------------------------------------ */
/*  Product                                                            */
/* ------------------------------------------------------------------ */
export interface ProductDetails {
  name: string;
  description: string;
  internal_code: string;
  regulator_assigned_code: string;
}

/* ------------------------------------------------------------------ */
/*  Plan                                                               */
/* ------------------------------------------------------------------ */
export type PlanTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Basic'
  | 'Premium'
  | 'Comprehensive';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type NetworkRestriction = 'In-Network' | 'Out-of-Network' | 'Both';

export interface GeneralRules {
  annual_limit: number;
  deductible: number;
  out_of_pocket_max: number;
  network_restrictions: NetworkRestriction;
  waiting_period_days: number;
}

export interface CostShare {
  copay: number;
  coinsurance: number;
  deductible_applies: boolean;
}

export interface VisitLimits {
  annual_visits: number;
  lifetime_limit: number;
  per_event_cap: number;
}

export interface Authorization {
  required: boolean;
  notes: string;
}

export interface EncounterBenefit {
  category: string;
  sub_category: string;
  encounter_type: string;
  description: string;
  coverage: boolean;
  annual_limit: number;
  waiting_period_days: number;
  cost_share: CostShare;
  visit_limits: VisitLimits;
  authorization: Authorization;
  exclusions: string[];
}

export interface PlanBenefits {
  general_rules: GeneralRules;
  encounter_specific: EncounterBenefit[];
}

export interface Plan {
  plan_id: string;
  plan_name: string;
  plan_tier: PlanTier | '';
  regions: string[];
  currency: CurrencyCode;
  benefits: PlanBenefits;
}

/* ------------------------------------------------------------------ */
/*  Environment                                                        */
/* ------------------------------------------------------------------ */
export interface EnvironmentPublish {
  env_type: string;
  env_name: string;
  env_url: string;
  made_live_on: string;
  made_live_by: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  Configuration (top-level)                                          */
/* ------------------------------------------------------------------ */
export type ConfigurationStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type ConfigurationStage =
  | 'insurer_details'
  | 'product_details'
  | 'create_plans'
  | 'base_plan_configuration'
  | 'encounter_configuration'
  | 'benefits_setup'
  | 'plan_specific_overrides'
  | 'review_publish';

export interface PCG4Configuration {
  id?: string;
  insurer: InsurerDetails | null;
  product: ProductDetails | null;
  plans: Plan[];
  current_stage: ConfigurationStage;
  status: ConfigurationStatus;
  environments_live_in?: EnvironmentPublish[];
  created_at?: string;
  updated_at?: string;
}

/* ------------------------------------------------------------------ */
/*  Encounter Taxonomy (for step 5)                                    */
/* ------------------------------------------------------------------ */
export interface EncounterType {
  type_id: string;
  label: string;
  description: string;
}

export interface EncounterCategory {
  category_id: string;
  category_name: string;
  description: string;
  types: EncounterType[];
}

/* ------------------------------------------------------------------ */
/*  Step Props (shared interface for all step components)               */
/* ------------------------------------------------------------------ */
export interface StepProps {
  configuration: PCG4Configuration;
  onNext: (data: Partial<PCG4Configuration>) => Promise<boolean>;
  onPrevious: () => void;
  onSave: (data: Partial<PCG4Configuration>) => Promise<{ success: boolean; error?: string }>;
  saving: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

/* ------------------------------------------------------------------ */
/*  Validation Error                                                   */
/* ------------------------------------------------------------------ */
export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Publish Settings                                                   */
/* ------------------------------------------------------------------ */
export interface PublishSettings {
  target_environment: 'staging' | 'production' | 'testing';
  scheduled_date: string;
  notes: string;
}
