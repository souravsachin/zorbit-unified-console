import React from 'react';
import {
  Workflow,
  FileText,
  ClipboardList,
  BarChart3,
  Shield,
  Clock,
  Users,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const UWWorkflowHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="uw-workflow"
      moduleName="UW Workflow"
      moduleDescription="Underwriting Workflow Engine &mdash; 13 Queues, 20 Actions"
      moduleIntro="UW Workflow is the underwriting workflow engine that manages the end-to-end evaluation of insurance applications. It operates 13 specialized queues with 20 distinct actions, supporting both Straight-Through Processing (STP) for low-risk applications and Non-STP manual review for complex cases. Every action is tracked in a full audit trail."
      icon={Workflow}
      capabilities={[
        {
          icon: ClipboardList,
          title: '13 Work Queues',
          description: 'Specialized queues for new business, renewals, endorsements, medical reviews, financial checks, and escalations.',
        },
        {
          icon: GitBranch,
          title: '20 Workflow Actions',
          description: 'Actions include assign, review, approve, decline, refer, escalate, request info, waive, override, and more.',
        },
        {
          icon: Shield,
          title: 'STP / NSTP Routing',
          description: 'Automatic Straight-Through Processing for clean cases. Complex cases routed to manual NSTP queues.',
        },
        {
          icon: BarChart3,
          title: 'Status Progression',
          description: 'Real-time tracking of application status through the underwriting pipeline with SLA monitoring.',
        },
        {
          icon: Clock,
          title: 'Audit Trail',
          description: 'Every action, assignment change, and status transition is recorded with timestamp, user, and reason.',
        },
        {
          icon: Users,
          title: 'Team Assignment',
          description: 'Round-robin, skill-based, and manual assignment modes. Workload balancing across underwriting teams.',
        },
      ]}
      targetUsers={[
        { role: 'Underwriters', desc: 'Evaluate applications from assigned queues and make accept/decline decisions.' },
        { role: 'Senior Underwriters', desc: 'Handle escalated cases and override automated decisions.' },
        { role: 'UW Managers', desc: 'Monitor queue health, SLA compliance, and team performance.' },
        { role: 'Operations', desc: 'Track application flow and resolve bottlenecks.' },
      ]}
      lifecycleStages={[
        { label: 'New', description: 'Application received from quotation module. Awaiting queue assignment.', color: '#f59e0b' },
        { label: 'Under Review', description: 'Assigned to an underwriter. Medical, financial, and risk evaluation in progress.', color: '#3b82f6' },
        { label: 'STP', description: 'Straight-Through Processing: application meets all automated criteria.', color: '#10b981' },
        { label: 'NSTP', description: 'Non-STP: requires manual review by a specialist underwriter.', color: '#8b5cf6' },
        { label: 'Approved', description: 'Underwriting complete. Application approved with terms and conditions.', color: '#059669' },
        { label: 'Declined', description: 'Application does not meet risk appetite. Decline reason codes attached.', color: '#ef4444' },
        { label: 'Policy', description: 'Approved application converted to an active insurance policy.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'uw-workflow-overview.mp4',
          title: 'UW Workflow Overview',
          thumbnail: '',
          timestamp: '2026-03-18',
          duration: 120,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Work Queues', startMs: 15000 },
            { title: 'STP vs NSTP', startMs: 40000 },
            { title: 'Actions & Transitions', startMs: 65000 },
            { title: 'Audit Trail', startMs: 90000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/uw-workflow/"
      swaggerUrl="/api/uw-workflow/api-docs"
      faqs={[
        { question: 'What are the 13 queues?', answer: 'New Business, Renewal, Endorsement, Medical Review, Financial Review, Risk Assessment, Escalation, Refer to Specialist, Pending Info, Counter Offer, Declined Review, STP Auto-Approve, and Manager Override.' },
        { question: 'How does STP work?', answer: 'Applications that pass all automated decisioning rules (from HI Decisioning) are routed to the STP queue and auto-approved without manual intervention.' },
        { question: 'What triggers an escalation?', answer: 'High sum insured, adverse medical history, or when an underwriter explicitly escalates a case they cannot decide on.' },
        { question: 'How are SLAs tracked?', answer: 'Each queue has configurable SLA targets (e.g., 2 hours for STP, 24 hours for NSTP). Breaches trigger alerts and auto-escalation.' },
      ]}
      resources={[
        { label: 'UW Workflow API (Swagger)', url: 'https://scalatics.com:3115/api', icon: FileText },
        { label: 'HI Decisioning Integration', url: '/hi-decisioning', icon: Shield },
        { label: 'Audit Trail Viewer', url: '/audit', icon: ClipboardList },
      ]}
    />
  );
};

export default UWWorkflowHubPage;
