/**
 * Canonical event type constants for the admin console domain.
 * Naming convention: domain.entity.action
 */
export const DashboardEvents = {
  WIDGET_CREATED: 'dashboard.widget.created',
  WIDGET_UPDATED: 'dashboard.widget.updated',
  WIDGET_DELETED: 'dashboard.widget.deleted',
} as const;

export const TaxonomyEvents = {
  TAXONOMY_CREATED: 'taxonomy.taxonomy.created',
  TAXONOMY_UPDATED: 'taxonomy.taxonomy.updated',
  TAXONOMY_DELETED: 'taxonomy.taxonomy.deleted',
  TAXONOMY_ACTIVATED: 'taxonomy.taxonomy.activated',
  TAXONOMY_CLONED: 'taxonomy.taxonomy.cloned',
  CATEGORY_CREATED: 'taxonomy.category.created',
  CATEGORY_UPDATED: 'taxonomy.category.updated',
  CATEGORY_DELETED: 'taxonomy.category.deleted',
  ITEM_CREATED: 'taxonomy.item.created',
  ITEM_UPDATED: 'taxonomy.item.updated',
  ITEM_DELETED: 'taxonomy.item.deleted',
} as const;

export const WorkflowEvents = {
  DEFINITION_CREATED: 'workflow.definition.created',
  INSTANCE_CREATED: 'workflow.instance.created',
  INSTANCE_TRANSITIONED: 'workflow.instance.transitioned',
} as const;

export const PCG4Events = {
  CONFIGURATION_CREATED: 'pcg4.configuration.created',
  CONFIGURATION_STAGE_UPDATED: 'pcg4.configuration.stage_updated',
  CONFIGURATION_DELETED: 'pcg4.configuration.deleted',
  CONFIGURATION_CLONED: 'pcg4.configuration.cloned',
  PLAN_CREATED: 'pcg4.plan.created',
  PLAN_UPDATED: 'pcg4.plan.updated',
  BENEFIT_UPDATED: 'pcg4.benefit.updated',
} as const;

export const DemoEvents = {
  SEGMENT_CREATED: 'demo.segment.created',
  SEGMENT_UPDATED: 'demo.segment.updated',
  SEGMENT_DELETED: 'demo.segment.deleted',
  SEGMENT_DUPLICATED: 'demo.segment.duplicated',
  PLAYLIST_CREATED: 'demo.playlist.created',
  PLAYLIST_UPDATED: 'demo.playlist.updated',
  PLAYLIST_DELETED: 'demo.playlist.deleted',
} as const;

export type DashboardEventType = (typeof DashboardEvents)[keyof typeof DashboardEvents];
export type DemoEventType = (typeof DemoEvents)[keyof typeof DemoEvents];
export type TaxonomyEventType = (typeof TaxonomyEvents)[keyof typeof TaxonomyEvents];
export type WorkflowEventType = (typeof WorkflowEvents)[keyof typeof WorkflowEvents];
export type PCG4EventType = (typeof PCG4Events)[keyof typeof PCG4Events];
export type AdminConsoleEventType = DashboardEventType | DemoEventType | TaxonomyEventType | WorkflowEventType | PCG4EventType;

/**
 * Canonical event envelope for all Zorbit platform events.
 */
export interface ZorbitEventEnvelope<T = unknown> {
  eventId: string;
  eventType: AdminConsoleEventType;
  timestamp: string;
  source: string;
  namespace: string;
  namespaceId: string;
  payload: T;
  metadata?: Record<string, string>;
}
