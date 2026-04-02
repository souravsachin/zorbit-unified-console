import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { DemoDataGenerator } from '../../components/shared/DemoDataGenerator';
import { generateUWWorkflowPreview } from '../../components/shared/DemoDataGenerator/generators';
import { GitBranch } from 'lucide-react';
import type { DemoColumnDef, CohortOption } from '../../components/shared/DemoDataGenerator';

const UW_COLUMNS: DemoColumnDef[] = [
  { key: 'refId', label: 'Ref', type: 'text', editable: false, width: 'w-24' },
  { key: 'proposerName', label: 'Proposer Name', type: 'text' },
  { key: 'product', label: 'Product', type: 'select', options: ['AWNIC NAS Dubai', 'AWNIC NAS Abu Dhabi', 'AWNIC Enhanced', 'AWNIC Basic', 'AWNIC Platinum', 'AWNIC Gold'] },
  { key: 'region', label: 'Region', type: 'select', options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'RAK', 'Fujairah'] },
  { key: 'premium', label: 'Premium (AED)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['new', 'nstp_review', 'approved', 'declined', 'referred'] },
  { key: 'type', label: 'Type', type: 'select', options: ['STP', 'NSTP'] },
];

const UW_COHORTS: CohortOption[] = [
  { key: 'clean', label: 'Clean Cases', description: 'Healthy, auto-accept STP', defaultPct: 40 },
  { key: 'diabetic', label: 'Diabetic', description: 'Type 1/2 diabetes flag', defaultPct: 15 },
  { key: 'hypertension', label: 'Hypertension', description: 'High BP history', defaultPct: 15 },
  { key: 'high_bmi', label: 'High BMI (>35)', description: 'Obesity loading', defaultPct: 10 },
  { key: 'senior', label: 'Senior (60+)', description: 'Age-related loading', defaultPct: 10 },
  { key: 'high_sum', label: 'High Sum Insured', description: '>500K AED coverage', defaultPct: 10 },
];

export default function UWWorkflowSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="uw-workflow"
      moduleName="UW Workflow"
      icon={GitBranch}
      seedEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed"
      demoSeedEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed/demo"
      demoFlushEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed/demo"
      flushEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed/all"
      healthEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/health"
      demoGenerator={
        <DemoDataGenerator
          moduleId="uw-workflow"
          moduleName="UW Workflow"
          seedEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed/demo"
          flushEndpoint="/api/uw-workflow/api/v1/G/uw-workflow/seed/demo"
          columns={UW_COLUMNS}
          cohortOptions={UW_COHORTS}
          generatePreview={generateUWWorkflowPreview}
        />
      }
    />
  );
}
