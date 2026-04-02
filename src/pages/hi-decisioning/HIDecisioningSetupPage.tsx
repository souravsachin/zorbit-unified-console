import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { DemoDataGenerator } from '../../components/shared/DemoDataGenerator';
import { generateHIDecisioningPreview } from '../../components/shared/DemoDataGenerator/generators';
import { Brain } from 'lucide-react';
import type { DemoColumnDef, CohortOption } from '../../components/shared/DemoDataGenerator';

const DEC_COLUMNS: DemoColumnDef[] = [
  { key: 'refId', label: 'Ref', type: 'text', editable: false, width: 'w-24' },
  { key: 'applicantName', label: 'Applicant', type: 'text' },
  { key: 'product', label: 'Product', type: 'select', options: ['AWNIC NAS Dubai', 'AWNIC NAS Abu Dhabi', 'AWNIC Enhanced', 'AWNIC Basic', 'AWNIC Platinum', 'AWNIC Gold'] },
  { key: 'riskScore', label: 'Risk Score', type: 'number' },
  { key: 'decision', label: 'Decision', type: 'select', options: ['auto_accept', 'refer', 'decline', 'load'] },
  { key: 'rulesTriggered', label: 'Rules Triggered', type: 'number' },
  { key: 'loadingPct', label: 'Loading %', type: 'number' },
];

const DEC_COHORTS: CohortOption[] = [
  { key: 'clean', label: 'Clean Cases', description: 'Auto-accept, no loading', defaultPct: 40 },
  { key: 'diabetic', label: 'Diabetic', description: 'Triggers diabetes rules', defaultPct: 15 },
  { key: 'hypertension', label: 'Hypertension', description: 'BP-related rules', defaultPct: 15 },
  { key: 'high_bmi', label: 'High BMI (>35)', description: 'BMI loading rules', defaultPct: 10 },
  { key: 'senior', label: 'Senior (60+)', description: 'Age-based loading', defaultPct: 10 },
  { key: 'high_sum', label: 'High Sum Insured', description: 'High coverage rules', defaultPct: 10 },
];

export default function HIDecisioningSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="hi-decisioning"
      moduleName="HI Decisioning"
      icon={Brain}
      seedEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed"
      demoSeedEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed/demo"
      demoFlushEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed/demo"
      flushEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed/all"
      healthEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/health"
      demoGenerator={
        <DemoDataGenerator
          moduleId="hi-decisioning"
          moduleName="HI Decisioning"
          seedEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed/demo"
          flushEndpoint="/api/hi-decisioning/api/v1/G/hi-decisioning/seed/demo"
          columns={DEC_COLUMNS}
          cohortOptions={DEC_COHORTS}
          generatePreview={generateHIDecisioningPreview}
        />
      }
    />
  );
}
