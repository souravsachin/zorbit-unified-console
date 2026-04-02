import React from 'react';
import {
  Zap,
  FileText,
  Shield,
  Settings,
  BarChart3,
  GitBranch,
  Users,
  AlertTriangle,
  Target,
  Sliders,
  Code,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const HIDecisioningHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="hi-decisioning"
      moduleName="HI Decisioning"
      moduleDescription="Underwriting Rules Engine &mdash; 15 Rules, 11 Action Types"
      moduleIntro="HI Decisioning is the automated underwriting rules engine for health insurance. It evaluates applications against 15 configurable rules with 11 action types including approve, decline, load premium, exclude condition, and refer to specialist. Rules support per-member evaluation for family policies, condition builders with AND/OR logic, and priority-based execution order."
      icon={Zap}
      capabilities={[
        {
          icon: Settings,
          title: '15 Configurable Rules',
          description: 'Rules cover age limits, BMI thresholds, pre-existing conditions, occupation hazards, geographic restrictions, and sum insured limits.',
        },
        {
          icon: GitBranch,
          title: '11 Action Types',
          description: 'Approve, decline, load premium, exclude condition, sub-limit, waiting period, refer, escalate, counter-offer, request medical, and waive.',
        },
        {
          icon: Sliders,
          title: 'Condition Builder',
          description: 'Visual condition builder with AND/OR logic, nested groups, and support for numeric ranges, lookups, and calculated fields.',
        },
        {
          icon: Users,
          title: 'Per-Member Evaluation',
          description: 'Family policies are evaluated member-by-member. Each member can receive different loadings, exclusions, or sub-limits.',
        },
        {
          icon: Target,
          title: 'Priority Execution',
          description: 'Rules execute in priority order. Higher-priority rules can override lower ones. Execution stops on terminal actions (approve/decline).',
        },
        {
          icon: BarChart3,
          title: 'Decision Audit',
          description: 'Every rule evaluation is logged with input values, matched conditions, and applied actions for regulatory compliance.',
        },
      ]}
      targetUsers={[
        { role: 'Actuaries', desc: 'Define and calibrate underwriting rules based on risk models.' },
        { role: 'Chief Underwriter', desc: 'Approve rule changes and review decision quality metrics.' },
        { role: 'Compliance Officers', desc: 'Ensure rules comply with regulatory requirements and anti-discrimination laws.' },
        { role: 'IT/Config Analysts', desc: 'Build and test rule conditions using the visual condition builder.' },
      ]}
      lifecycleStages={[
        { label: 'Rule Created', description: 'New rule is drafted with conditions and actions in the rule builder.', color: '#f59e0b' },
        { label: 'Active', description: 'Rule is published and actively evaluating incoming applications.', color: '#10b981' },
        { label: 'Evaluating', description: 'Rule engine processes an application. Each rule runs in priority order.', color: '#3b82f6' },
        { label: 'Decision', description: 'All applicable rules have fired. Final decision aggregated from rule outcomes.', color: '#8b5cf6' },
        { label: 'Loading Applied', description: 'Premium loadings, exclusions, or sub-limits applied to the policy terms.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'hi-decisioning-overview.mp4',
          title: 'HI Decisioning Overview',
          thumbnail: '',
          timestamp: '2026-03-18',
          duration: 120,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Rule Engine', startMs: 15000 },
            { title: 'Condition Builder', startMs: 40000 },
            { title: 'Action Types', startMs: 65000 },
            { title: 'Decision Audit', startMs: 90000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/hi-decisioning/"
      swaggerUrl="/api/hi-decisioning/api-docs"
      faqs={[
        { question: 'What are the 15 rules?', answer: 'Age limit, BMI threshold, pre-existing condition exclusion, occupation hazard loading, geographic restriction, sum insured cap, family size loading, smoker loading, pregnancy waiting period, chronic condition sub-limit, adventure sports exclusion, senior citizen loading, NRI surcharge, group size discount, and loyalty discount.' },
        { question: 'How does per-member evaluation work?', answer: 'For family policies, each insured member is evaluated independently. A family of 4 generates 4 separate evaluation passes, each with their own loadings and exclusions.' },
        { question: 'Can rules be tested before activation?', answer: 'Yes. The rule builder includes a test mode where you can run sample applications through a rule to verify conditions and actions before publishing.' },
        { question: 'How are conflicting rules handled?', answer: 'Rules execute in priority order (lowest number = highest priority). Terminal actions (approve/decline) stop execution. Non-terminal actions (loading, exclusion) accumulate.' },
      ]}
      resources={[
        { label: 'HI Decisioning API (Swagger)', url: 'https://scalatics.com:3116/api', icon: FileText },
        { label: 'UW Workflow Integration', url: '/uw-workflow', icon: Shield },
        { label: 'Rule Condition Reference', url: '#', icon: Code },
      ]}
    />
  );
};

export default HIDecisioningHubPage;
