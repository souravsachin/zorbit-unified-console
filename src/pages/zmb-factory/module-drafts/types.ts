/**
 * Types shared across the ZMB Module Drafts authoring UI.
 */

export interface ManifestIdentity {
  moduleId?: string;
  moduleName?: string;
  displayName?: string;
  version?: string;
  description?: string;
  owner?: string;
  moduleType?: 'cor' | 'pfs' | 'app' | 'tpm' | 'sdk' | 'ext' | 'adm' | 'ai';
  manifestVersion?: string;
  icon?: string;
  color?: string;
}

export interface ManifestPlacement {
  scaffold?: string;
  scaffoldSortOrder?: number;
  edition?: string;
  businessLine?: string;
  capabilityArea?: string;
  sortOrder?: number;
}

export interface MenuItem {
  label: string;
  feRoute?: string;
  beRoute?: string;
  icon?: string;
  privilege?: string;
  feComponent?: string;
  sortOrder?: number;
  items?: MenuItem[];
  feProps?: Record<string, any>;
}

export interface NavSection {
  id: string;
  label: string;
  icon?: string;
  sortOrder?: number;
  privilege?: string;
  items: MenuItem[];
}

export interface FeComponentDecl {
  name: string;
  importPath?: string;
  $src?: string;
  props?: Record<string, any>;
}

export interface BeRouteDecl {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  privilege?: string;
  handler?: string;
}

export interface PrivilegeDecl {
  code: string;
  label?: string;
  description?: string;
}

export interface EntityFieldDecl {
  key: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  readonly?: boolean;
  maxLength?: number;
  default?: any;
  values?: string[];
  refEntity?: string;
  pii?: boolean;
}

export interface EntityDecl {
  entity: string;
  displayName?: string;
  namespace: 'G' | 'O' | 'D' | 'U';
  hashIdPrefix: string;
  table: string;
  resource?: string;
  softDelete?: boolean;
  timestamps?: boolean;
  fields: EntityFieldDecl[];
  audit?: { eventPrefix?: string; sensitiveFields?: string[] };
  privileges?: Record<string, string>;
}

export interface DependenciesDecl {
  requires?: string[];
  optional?: string[];
}

export interface GuideSlide {
  title?: string;
  body?: string;
  image?: string;
  bullets?: string[];
  narration?: string;
  narrationAudioDataUrl?: string; // populated when user clicks "Synthesise"
}

export interface GuideVideo {
  title?: string;
  src?: string;
  duration?: number;
  playerType?: string;
  poster?: string;
  chapters?: Array<{ t: number; label: string }>;
  narration?: string;
}

export interface GuideBlock {
  intro?: { headline?: string; summary?: string; narration?: string; feRoute?: string };
  slides?: { feRoute?: string; deck?: GuideSlide[] };
  lifecycle?: {
    feRoute?: string;
    narration?: string;
    phases?: Array<{ name: string; description?: string; narration?: string }>;
  };
  videos?: { feRoute?: string; entries?: GuideVideo[] };
  pricing?: {
    feRoute?: string;
    status?: string;
    tiers?: Array<{ name: string; monthlyPrice: number | null; features?: string[] }>;
  };
  docs?: { feRoute?: string; links?: Array<{ label: string; href: string }> };
}

export interface SeedsDecl {
  systemMin?: string; // SQL text
  demo?: string; // SQL text
  files?: { systemMin?: string; demo?: string };
}

/**
 * The in-memory manifest we edit in the browser. We keep it loosely typed
 * so round-tripping an imported manifest doesn't strip unknown keys.
 */
export interface ModuleDraftManifest extends ManifestIdentity {
  placement?: ManifestPlacement;
  navigation?: { sections: NavSection[] };
  frontend?: {
    loadStrategy?: string;
    entryComponent?: string;
    routes?: string[];
    components?: FeComponentDecl[];
  };
  backend?: {
    apiPrefix?: string;
    healthEndpoint?: string;
    endpoints?: BeRouteDecl[];
  };
  dependencies?: DependenciesDecl | { platform?: string[]; business?: string[]; optional?: string[] };
  privileges?: PrivilegeDecl[];
  entities?: EntityDecl[];
  seed?: SeedsDecl;
  guide?: GuideBlock;
  events?: { publishes?: string[]; consumes?: string[] };
  db?: any;
  registration?: any;
  pii?: any;
  [extra: string]: any;
}

export type SectionKey =
  | 'identity'
  | 'placement'
  | 'menu'
  | 'feComponents'
  | 'beRoutes'
  | 'dependencies'
  | 'privileges'
  | 'entities'
  | 'seeds'
  | 'guide'
  | 'events';

export const SECTION_LABELS: Record<SectionKey, string> = {
  identity: 'Identity',
  placement: 'Placement',
  menu: 'Menu',
  feComponents: 'FE Components',
  beRoutes: 'BE Routes',
  dependencies: 'Dependencies',
  privileges: 'Privileges',
  entities: 'Entities',
  seeds: 'Seeds',
  guide: 'Guide',
  events: 'Events',
};
