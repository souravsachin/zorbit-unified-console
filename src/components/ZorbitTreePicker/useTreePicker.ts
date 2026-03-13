import { useState, useCallback, useMemo, useEffect } from 'react';
import { TreeNode, UseTreePickerOptions, UseTreePickerReturn } from './types';

function getAllLeafIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      ids.push(...getAllLeafIds(node.children));
    } else {
      ids.push(node.id);
    }
  }
  return ids;
}

function getAllNodeIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids.push(...getAllNodeIds(node.children));
    }
  }
  return ids;
}

function getChildIds(node: TreeNode): string[] {
  if (!node.children) return [];
  const ids: string[] = [];
  for (const child of node.children) {
    if (!child.disabled) {
      ids.push(child.id);
    }
    if (child.children && child.children.length > 0) {
      ids.push(...getChildIds(child));
    }
  }
  return ids;
}

function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function filterNodes(nodes: TreeNode[], term: string): TreeNode[] {
  const lower = term.toLowerCase();
  const result: TreeNode[] = [];

  for (const node of nodes) {
    const labelMatch = node.label.toLowerCase().includes(lower);
    const descMatch = node.description?.toLowerCase().includes(lower) ?? false;

    if (node.children && node.children.length > 0) {
      const filteredChildren = filterNodes(node.children, term);
      if (labelMatch || descMatch || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: labelMatch || descMatch ? node.children : filteredChildren,
        });
      }
    } else {
      if (labelMatch || descMatch) {
        result.push(node);
      }
    }
  }

  return result;
}

function countLeaves(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      count += countLeaves(node.children);
    } else {
      count++;
    }
  }
  return count;
}

export function useTreePicker(options: UseTreePickerOptions): UseTreePickerReturn {
  const { nodes, initialSelection, mode = 'multi', onChange } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => initialSelection ?? new Set<string>()
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set<string>());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    return filterNodes(nodes, searchTerm.trim());
  }, [nodes, searchTerm]);

  const totalCount = useMemo(() => countLeaves(nodes), [nodes]);
  const selectedCount = selectedIds.size;

  // Sync with external changes to initialSelection
  useEffect(() => {
    if (initialSelection) {
      setSelectedIds(initialSelection);
    }
  }, [initialSelection]);

  const updateSelection = useCallback(
    (next: Set<string>) => {
      setSelectedIds(next);
      onChange?.(next);
    },
    [onChange]
  );

  const toggleSelect = useCallback(
    (id: string) => {
      const node = findNodeById(nodes, id);
      if (node?.disabled) return;

      if (mode === 'single') {
        const next = new Set<string>();
        if (!selectedIds.has(id)) {
          next.add(id);
        }
        updateSelection(next);
        return;
      }

      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      updateSelection(next);
    },
    [nodes, selectedIds, mode, updateSelection]
  );

  const selectAll = useCallback(
    (parentId: string) => {
      if (mode === 'single') return;
      const parent = findNodeById(nodes, parentId);
      if (!parent) return;
      const childIds = getChildIds(parent);
      const next = new Set(selectedIds);
      for (const cid of childIds) {
        next.add(cid);
      }
      updateSelection(next);
    },
    [nodes, selectedIds, mode, updateSelection]
  );

  const deselectAll = useCallback(
    (parentId?: string) => {
      if (mode === 'single') {
        updateSelection(new Set<string>());
        return;
      }
      if (!parentId) {
        updateSelection(new Set<string>());
        return;
      }
      const parent = findNodeById(nodes, parentId);
      if (!parent) return;
      const childIds = getChildIds(parent);
      const next = new Set(selectedIds);
      for (const cid of childIds) {
        next.delete(cid);
      }
      updateSelection(next);
    },
    [nodes, selectedIds, mode, updateSelection]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAllFn = useCallback(() => {
    const allParentIds = getAllNodeIds(nodes).filter((id) => {
      const node = findNodeById(nodes, id);
      return node?.children && node.children.length > 0;
    });
    setExpandedIds(new Set(allParentIds));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set<string>());
  }, []);

  const setSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      // Auto-expand all categories when searching
      const allParentIds = getAllNodeIds(nodes).filter((id) => {
        const node = findNodeById(nodes, id);
        return node?.children && node.children.length > 0;
      });
      setExpandedIds(new Set(allParentIds));
    }
  }, [nodes]);

  return {
    selectedIds,
    expandedIds,
    searchTerm,
    filteredNodes,
    toggleSelect,
    selectAll,
    deselectAll,
    toggleExpand,
    expandAll: expandAllFn,
    collapseAll,
    setSearch,
    selectedCount,
    totalCount,
  };
}
