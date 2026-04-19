// Lucide icon name → component lookup. Tree-shakeable; only the icons
// imported here are bundled. Manifests reference icons by string name.
// Adding a new icon = add one entry here and rebuild.
//
// This is the ONE remaining hardcoding in the FE that we cannot remove
// (React + Vite tree-shaking forbids dynamic-string imports). Manifests
// stay convention-driven: if your manifest icon string is in this map,
// it renders; otherwise, fallback Circle is used.

import {
  Heart, Car, Anchor, Home, Activity, Landmark, Stethoscope, Truck,
  Briefcase, Plus, Scale, Globe2, Circle,
  Bot, GitBranch, PhoneCall, Play, Volume2, Mic, Headphones,
  Award, Map, Sprout, Eye, BookOpen, Video, MessageSquare, Code,
  Shield, Key, List, Upload,
  BarChart3, FileText,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  // Insurer / line-of-business
  Heart, Car, Anchor, Home, Activity, Landmark, Stethoscope, Truck,
  Briefcase, Plus, Scale, Globe2,
  // AI & Voice
  Bot, GitBranch, PhoneCall, Play, Volume2, Mic, Headphones,
  // Administration
  Award, Map, Sprout, Eye, BookOpen, Video, MessageSquare, Code,
  // Authorization / Module Registry
  Shield, Key, List, Upload,
  // Observability
  BarChart3, FileText,
};

export function lucideIconByName(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] || null;
}

export const FALLBACK_ICON: LucideIcon = Circle;
