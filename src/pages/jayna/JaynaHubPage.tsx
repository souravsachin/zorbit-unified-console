import React from 'react';
import {
  Sparkles,
  Bot,
  GitBranch,
  Phone,
  PhoneCall,
  Link2,
  Shield,
  BarChart3,
  FileText,
  Mic,
  Brain,
  Headphones,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const JaynaHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="jayna"
      moduleName="Jayna AI Calling"
      moduleDescription="Agentic AI Calling Platform &mdash; Voice Agents, Workflows, PSTN &amp; Magic Links"
      moduleIntro="Jayna AI Calling enables organizations to configure intelligent voice agents that handle inbound and outbound calls. Agents follow structured workflows with step-by-step conversation flows, integrate with backend tools for real-time data lookup, and produce full transcripts with outcome tracking. Supports PSTN lines, browser-based magic links, and test calls from the console."
      icon={Sparkles}
      capabilities={[
        {
          icon: Bot,
          title: 'AI Voice Agents',
          description: 'Configure agents with custom personalities, system prompts, voice settings (TTS engine + voice ID), and LLM provider selection.',
        },
        {
          icon: GitBranch,
          title: 'Conversation Workflows',
          description: 'Design step-by-step call flows: greet, collect information, verify identity, execute actions via tools, respond, and close.',
        },
        {
          icon: PhoneCall,
          title: 'Test Calls',
          description: 'Start test calls directly from the console. See live transcript, agent responses, and call outcome in real time.',
        },
        {
          icon: Link2,
          title: 'Magic Links',
          description: 'Generate shareable browser-based calling links. No app install needed — callers connect via WebRTC in any modern browser.',
        },
        {
          icon: Phone,
          title: 'PSTN Integration',
          description: 'Wire agents to real phone numbers for production inbound/outbound calling via SIP trunks.',
        },
        {
          icon: BarChart3,
          title: 'Call Analytics',
          description: 'Full call history with transcripts, duration, outcomes, and recordings. Track agent performance across all calls.',
        },
      ]}
      targetUsers={[
        { role: 'Call Center Managers', desc: 'Configure AI agents and workflows for different call types and departments.' },
        { role: 'Operations Leads', desc: 'Monitor call volumes, outcomes, and agent performance metrics.' },
        { role: 'IT Administrators', desc: 'Set up PSTN lines, magic links, and integrate with existing telephony infrastructure.' },
        { role: 'Product Owners', desc: 'Design conversation flows and test agent behavior before production deployment.' },
      ]}
      lifecycleStages={[
        { label: 'Agent Created', description: 'New AI agent configured with personality, voice, LLM, and greeting.', color: '#f59e0b' },
        { label: 'Workflow Assigned', description: 'Conversation workflow attached to agent with ordered steps.', color: '#3b82f6' },
        { label: 'Line Configured', description: 'PSTN number or magic link wired to the agent for live calls.', color: '#8b5cf6' },
        { label: 'Call Active', description: 'Agent is handling a live call, following workflow steps.', color: '#10b981' },
        { label: 'Call Completed', description: 'Call ended. Transcript, recording, and outcome stored.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'jayna-overview.mp4',
          title: 'Jayna AI Calling Overview',
          thumbnail: '',
          timestamp: '2026-04-01',
          duration: 180,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Agent Configuration', startMs: 20000 },
            { title: 'Workflow Builder', startMs: 50000 },
            { title: 'Test Call Demo', startMs: 90000 },
            { title: 'Call History', startMs: 130000 },
            { title: 'PSTN & Magic Links', startMs: 155000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/jayna/"
      swaggerUrl="/api/jayna/api-docs"
      faqs={[
        { question: 'What LLM providers are supported?', answer: 'Jayna supports OpenAI (GPT-4, GPT-4o), Anthropic (Claude), and local Ollama models. The LLM provider is configured per agent.' },
        { question: 'What TTS engines are available?', answer: 'Currently Edge TTS (Microsoft) with 300+ voices across 70+ languages. Additional engines (ElevenLabs, Azure Neural) coming soon.' },
        { question: 'Can I test calls without a phone number?', answer: 'Yes. The Test Call page lets you start a browser-based call to any agent. You can also generate magic links for external testers.' },
        { question: 'How are call transcripts stored?', answer: 'Transcripts are stored as an array of turns (agent/caller) with timestamps. They are searchable and exportable. Recordings are stored as audio files with URLs.' },
        { question: 'Can agents call external APIs during a conversation?', answer: 'Yes. Agents can be configured with tools that call external REST endpoints. For example, a policy lookup tool that fetches data from your CRM during the call.' },
      ]}
      resources={[
        { label: 'Jayna API (Swagger)', url: 'https://zorbit.scalatics.com/api/jayna/api-docs', icon: FileText },
        { label: 'Voice Engine Service', url: '/support-center', icon: Mic },
        { label: 'AI Gateway Service', url: '/support-center', icon: Brain },
        { label: 'RTC Service (WebRTC)', url: '/support-center', icon: Headphones },
      ]}
    />
  );
};

export default JaynaHubPage;
