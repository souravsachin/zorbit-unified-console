import React from 'react';

export interface TreeNode {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  metadata?: Record<string, any>;
  disabled?: boolean;
}

export interface ZorbitTreePickerProps {
  nodes: TreeNode[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  mode?: 'single' | 'multi';
  searchable?: boolean;
  searchPlaceholder?: string;
  expandAll?: boolean;
  showSelectAll?: boolean;
  showCount?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  className?: string;
  renderItem?: (node: TreeNode, selected: boolean) => React.ReactNode;
}

export interface UseTreePickerOptions {
  nodes: TreeNode[];
  initialSelection?: Set<string>;
  mode?: 'single' | 'multi';
  onChange?: (selectedIds: Set<string>) => void;
}

export interface UseTreePickerReturn {
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  searchTerm: string;
  filteredNodes: TreeNode[];
  toggleSelect: (id: string) => void;
  selectAll: (parentId: string) => void;
  deselectAll: (parentId?: string) => void;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearch: (term: string) => void;
  selectedCount: number;
  totalCount: number;
}
