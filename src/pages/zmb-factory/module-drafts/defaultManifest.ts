/**
 * Default in-progress manifest used when the owner starts a fresh module.
 * Aligns with Manifest v2.3 — the owner can override every value in the UI.
 *
 * Added 2026-04-22 by Soldier AU.
 */
import type { ModuleDraftManifest } from './types';

export function buildDefaultManifest(): ModuleDraftManifest {
  const slug = 'new-module';
  const apiPrefix = `/${slug}/api/v1`;
  return {
    moduleId: 'zorbit-app-new-module',
    moduleName: 'New Module',
    displayName: 'New Module',
    version: '0.1.0',
    description: 'Describe the module in one sentence.',
    owner: 'OneZippy.ai',
    moduleType: 'app',
    manifestVersion: '2.3',
    icon: 'widgets',
    color: '#6366f1',

    placement: {
      scaffold: 'Business',
      scaffoldSortOrder: 50,
      edition: 'Health Insurance',
      businessLine: 'Servicing',
      capabilityArea: 'Uncategorised',
      sortOrder: 500,
    },

    registration: {
      kafkaTopic: 'platform-module-announcements',
      manifestUrl: `https://zorbit-uat.onezippy.ai/${slug}/api/v1/G/manifest`,
    },

    navigation: {
      sections: [
        {
          id: 'guide',
          label: 'Guide',
          sortOrder: 0,
          icon: 'menu_book',
          items: [
            {
              label: 'Intro',
              feRoute: `/m/${slug}/guide/intro`,
              icon: 'BookOpen',
              feComponent: '@platform:GuideIntroView',
              sortOrder: 1,
            },
            {
              label: 'Presentation',
              feRoute: `/m/${slug}/guide/presentation`,
              icon: 'Presentation',
              feComponent: '@platform:GuideSlideDeck',
              sortOrder: 2,
            },
            {
              label: 'Lifecycle',
              feRoute: `/m/${slug}/guide/lifecycle`,
              icon: 'GitBranch',
              feComponent: '@platform:GuideLifecycle',
              sortOrder: 3,
            },
            {
              label: 'Video',
              feRoute: `/m/${slug}/guide/video`,
              icon: 'PlayCircle',
              feComponent: '@platform:GuideVideos',
              sortOrder: 4,
            },
            {
              label: 'Pricing',
              feRoute: `/m/${slug}/guide/pricing`,
              icon: 'Tag',
              feComponent: '@platform:GuidePricing',
              sortOrder: 5,
            },
          ],
        },
      ],
    },

    frontend: {
      loadStrategy: 'lazy',
      entryComponent: 'App',
      routes: [`/m/${slug}/*`],
      components: [],
    },

    backend: {
      apiPrefix: `${apiPrefix}/O/{orgId}`,
      healthEndpoint: `${apiPrefix}/G/health`,
      endpoints: [],
    },

    dependencies: {
      requires: [
        'zorbit-cor-identity',
        'zorbit-cor-authorization',
        'zorbit-cor-module_registry',
      ],
      optional: [],
    },

    privileges: [],
    entities: [],

    seed: {
      systemMin: '-- system-min seed SQL (idempotent baseline)\n',
      demo: '-- demo seed SQL — identifiers MUST be prefixed with DEMO-\n',
      files: { systemMin: 'seed/system-min.sql', demo: 'seed/demo.sql' },
    },

    guide: {
      intro: {
        headline: 'New Module',
        summary: 'One-paragraph pitch.',
        narration: 'Welcome to the new module. Replace this narration with your own intro.',
        feRoute: `/m/${slug}/guide/intro`,
      },
      slides: {
        feRoute: `/m/${slug}/guide/presentation`,
        deck: [
          {
            title: 'Overview',
            body: 'What this module does.',
            bullets: ['Capability 1', 'Capability 2', 'Capability 3'],
            narration: 'This module helps you do X, Y, and Z.',
          },
          {
            title: 'Integration',
            body: 'How other modules integrate.',
            bullets: ['REST API', 'Kafka events', 'Navigation surface'],
            narration: 'You can integrate via REST, Kafka events, or by mounting the navigation surface.',
          },
        ],
      },
      lifecycle: {
        feRoute: `/m/${slug}/guide/lifecycle`,
        narration: 'Records flow through Draft, Active, and Archived stages.',
        phases: [
          { name: 'Draft', description: 'Record authored, not yet in effect.' },
          { name: 'Active', description: 'Record is active.' },
          { name: 'Archived', description: 'No longer active.' },
        ],
      },
      videos: { feRoute: `/m/${slug}/guide/video`, entries: [] },
      pricing: {
        feRoute: `/m/${slug}/guide/pricing`,
        status: 'coming-soon',
        tiers: [
          { name: 'Community', monthlyPrice: 0, features: ['Basic features', 'Community support'] },
          { name: 'Business', monthlyPrice: 199, features: ['All features', 'Email support'] },
          { name: 'Enterprise', monthlyPrice: null, features: ['Dedicated CSM', 'SLA'] },
        ],
      },
      docs: { feRoute: `/m/${slug}/guide/resources`, links: [] },
    },

    events: { publishes: [], consumes: [] },

    pii: { autoDetect: false, declaredFields: [] },
  };
}
