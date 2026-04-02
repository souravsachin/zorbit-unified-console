import React from 'react';
import { Headset, MessageSquare, Phone, Video, BookOpen, LifeBuoy } from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const SupportCenterHubPage: React.FC = () => (
  <ModuleHubPage
    moduleId="support-center"
    moduleName="Support Center"
    moduleDescription="Unified help desk — chat, voice, video support with AI-assisted responses and human escalation"
    icon={Headset}
    capabilities={[
      {
        icon: MessageSquare,
        title: 'Live Chat',
        description: 'Real-time chat support with AI-powered initial response and seamless human escalation.',
      },
      {
        icon: Phone,
        title: 'Voice Support',
        description: 'Voice calls via LiveKit with automatic transcription and sentiment analysis.',
      },
      {
        icon: Video,
        title: 'Video Calls',
        description: 'Face-to-face video support for complex issues requiring screen sharing or document review.',
      },
      {
        icon: BookOpen,
        title: 'Knowledge Base',
        description: 'Self-service documentation, FAQs, and guided troubleshooting for common issues.',
      },
      {
        icon: LifeBuoy,
        title: 'Ticket Management',
        description: 'Track support requests from creation to resolution with SLA monitoring and priority routing.',
      },
      {
        icon: Headset,
        title: 'JAYNA AI Agent',
        description: 'AI-powered support agent that handles common queries, routes complex issues, and learns from resolutions.',
      },
    ]}
    lifecycleStages={[
      { label: 'Created', description: 'Support ticket or conversation initiated by user', color: '#3b82f6' },
      { label: 'AI Response', description: 'JAYNA AI provides initial response and attempts resolution', color: '#8b5cf6' },
      { label: 'Escalated', description: 'Issue routed to human agent for specialized handling', color: '#f59e0b' },
      { label: 'Resolved', description: 'Issue resolved and satisfaction feedback collected', color: '#10b981' },
    ]}
    faqs={[
      { question: 'What channels are supported?', answer: 'Chat, voice calls, video calls, and email — all unified in a single conversation thread per issue.' },
      { question: 'How does AI escalation work?', answer: 'JAYNA AI attempts resolution first. If confidence is low or the user requests a human, the conversation is seamlessly handed off to an available agent.' },
    ]}
    resources={[
      { label: 'Support Center', url: '/support-center' },
      { label: 'Chat API (Swagger)', url: '/api/chat/api-docs' },
    ]}
  />
);

export default SupportCenterHubPage;
