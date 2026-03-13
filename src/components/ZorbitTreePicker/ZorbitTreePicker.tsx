import React, { useCallback, useRef, useEffect } from 'react';
import { TreeNode, ZorbitTreePickerProps } from './types';

function highlightMatch(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

function getChildLeafIds(node: TreeNode): string[] {
  if (!node.children || node.children.length === 0) return [node.id];
  const ids: string[] = [];
  for (const child of node.children) {
    if (!child.disabled) {
      ids.push(...getChildLeafIds(child));
    }
  }
  return ids;
}

function countSelectedInCategory(node: TreeNode, selectedIds: Set<string>): number {
  const leafIds = getChildLeafIds(node);
  return leafIds.filter((id) => selectedIds.has(id)).length;
}

function countLeafChildren(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  let count = 0;
  for (const child of node.children) {
    if (!child.disabled) {
      count += countLeafChildren(child);
    }
  }
  return count;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  mode: 'single' | 'multi';
  searchTerm: string;
  showSelectAll: boolean;
  showCount: boolean;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onSelectAllCategory: (id: string) => void;
  onDeselectAllCategory: (id: string) => void;
  renderItem?: (node: TreeNode, selected: boolean) => React.ReactNode;
  focusedId: string | null;
  onFocusChange: (id: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  depth,
  selectedIds,
  expandedIds,
  mode,
  searchTerm,
  showSelectAll,
  showCount,
  onToggleSelect,
  onToggleExpand,
  onSelectAllCategory,
  onDeselectAllCategory,
  renderItem,
  focusedId,
  onFocusChange,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFocused = focusedId === node.id;
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isFocused]);

  if (hasChildren) {
    const selectedInCat = countSelectedInCategory(node, selectedIds);
    const totalInCat = countLeafChildren(node);
    const allSelected = selectedInCat === totalInCat && totalInCat > 0;

    return (
      <div role="treeitem" aria-expanded={isExpanded} aria-label={node.label}>
        <div
          ref={itemRef}
          className={`flex items-center justify-between cursor-pointer select-none
            px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150
            ${isFocused ? 'ring-2 ring-blue-400 ring-inset' : ''}
            ${depth > 0 ? 'border-l-2 border-gray-200' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => onToggleExpand(node.id)}
          onFocus={() => onFocusChange(node.id)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand(node.id);
            }
            if (e.key === 'ArrowRight' && !isExpanded) {
              e.preventDefault();
              onToggleExpand(node.id);
            }
            if (e.key === 'ArrowLeft' && isExpanded) {
              e.preventDefault();
              onToggleExpand(node.id);
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {node.icon && <span className="flex-shrink-0">{node.icon}</span>}
            <span className="font-medium text-sm text-gray-800 truncate">
              {highlightMatch(node.label, searchTerm)}
            </span>
            {node.description && (
              <span className="text-xs text-gray-400 truncate hidden sm:inline">
                - {highlightMatch(node.description, searchTerm)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {showSelectAll && mode === 'multi' && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  if (allSelected) {
                    onDeselectAllCategory(node.id);
                  } else {
                    onSelectAllCategory(node.id);
                  }
                }}
                aria-label={allSelected ? `Deselect all in ${node.label}` : `Select all in ${node.label}`}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {showCount && (
              <span
                className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 text-xs font-medium rounded-full
                  ${selectedInCat > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {selectedInCat}/{totalInCat}
              </span>
            )}
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {isExpanded && (
            <div role="group" aria-label={`${node.label} items`}>
              {node.children!.map((child) => (
                <TreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedIds={selectedIds}
                  expandedIds={expandedIds}
                  mode={mode}
                  searchTerm={searchTerm}
                  showSelectAll={showSelectAll}
                  showCount={showCount}
                  onToggleSelect={onToggleSelect}
                  onToggleExpand={onToggleExpand}
                  onSelectAllCategory={onSelectAllCategory}
                  onDeselectAllCategory={onDeselectAllCategory}
                  renderItem={renderItem}
                  focusedId={focusedId}
                  onFocusChange={onFocusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaf node
  return (
    <div
      ref={itemRef}
      role="treeitem"
      aria-selected={isSelected}
      aria-disabled={node.disabled}
      className={`flex items-center gap-3 cursor-pointer select-none
        px-3 py-2 transition-all duration-150
        ${node.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        ${isSelected ? 'bg-blue-50' : ''}
        ${isFocused ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      onClick={() => !node.disabled && onToggleSelect(node.id)}
      onFocus={() => onFocusChange(node.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!node.disabled) onToggleSelect(node.id);
        }
      }}
    >
      {renderItem ? (
        renderItem(node, isSelected)
      ) : (
        <>
          <input
            type={mode === 'single' ? 'radio' : 'checkbox'}
            checked={isSelected}
            disabled={node.disabled}
            onChange={() => {}}
            className={`flex-shrink-0 h-4 w-4 border-gray-300 focus:ring-blue-500
              ${mode === 'single' ? 'text-blue-600' : 'text-blue-600 rounded'}`}
            tabIndex={-1}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {node.icon && <span className="flex-shrink-0">{node.icon}</span>}
              <span className="text-sm text-gray-900 truncate">
                {highlightMatch(node.label, searchTerm)}
              </span>
            </div>
            {node.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {highlightMatch(node.description, searchTerm)}
              </p>
            )}
          </div>
          {isSelected && (
            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              Selected
            </span>
          )}
        </>
      )}
    </div>
  );
};

const ZorbitTreePicker: React.FC<ZorbitTreePickerProps> = ({
  nodes,
  selectedIds,
  onSelectionChange,
  mode = 'multi',
  searchable = true,
  searchPlaceholder = 'Search...',
  expandAll: expandAllProp = false,
  showSelectAll = true,
  showCount = true,
  maxHeight = '400px',
  emptyMessage = 'No items found',
  className = '',
  renderItem,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    if (expandAllProp) {
      const ids = new Set<string>();
      const collectParents = (ns: TreeNode[]) => {
        for (const n of ns) {
          if (n.children && n.children.length > 0) {
            ids.add(n.id);
            collectParents(n.children);
          }
        }
      };
      collectParents(nodes);
      return ids;
    }
    return new Set<string>();
  });
  const [focusedId, setFocusedId] = React.useState<string | null>(null);

  // Filter nodes
  const filteredNodes = React.useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    const lower = searchTerm.toLowerCase();

    const filter = (ns: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      for (const n of ns) {
        const labelMatch = n.label.toLowerCase().includes(lower);
        const descMatch = n.description?.toLowerCase().includes(lower) ?? false;
        if (n.children && n.children.length > 0) {
          const filteredChildren = filter(n.children);
          if (labelMatch || descMatch || filteredChildren.length > 0) {
            result.push({
              ...n,
              children: labelMatch || descMatch ? n.children : filteredChildren,
            });
          }
        } else if (labelMatch || descMatch) {
          result.push(n);
        }
      }
      return result;
    };
    return filter(nodes);
  }, [nodes, searchTerm]);

  // Auto-expand when searching
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const ids = new Set<string>();
      const collectParents = (ns: TreeNode[]) => {
        for (const n of ns) {
          if (n.children && n.children.length > 0) {
            ids.add(n.id);
            collectParents(n.children);
          }
        }
      };
      collectParents(filteredNodes);
      setExpandedIds(ids);
    }
  }, [searchTerm, filteredNodes]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback(
    (id: string) => {
      if (mode === 'single') {
        const next = new Set<string>();
        if (!selectedIds.has(id)) next.add(id);
        onSelectionChange(next);
        return;
      }
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange, mode]
  );

  const findNode = useCallback(
    (id: string, ns: TreeNode[] = nodes): TreeNode | null => {
      for (const n of ns) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(id, n.children);
          if (found) return found;
        }
      }
      return null;
    },
    [nodes]
  );

  const selectAllCategory = useCallback(
    (parentId: string) => {
      const parent = findNode(parentId);
      if (!parent) return;
      const childIds = getChildLeafIds(parent);
      const next = new Set(selectedIds);
      for (const cid of childIds) next.add(cid);
      onSelectionChange(next);
    },
    [findNode, selectedIds, onSelectionChange]
  );

  const deselectAllCategory = useCallback(
    (parentId: string) => {
      const parent = findNode(parentId);
      if (!parent) return;
      const childIds = getChildLeafIds(parent);
      const next = new Set(selectedIds);
      for (const cid of childIds) next.delete(cid);
      onSelectionChange(next);
    },
    [findNode, selectedIds, onSelectionChange]
  );

  const handleExpandAll = useCallback(() => {
    const ids = new Set<string>();
    const collect = (ns: TreeNode[]) => {
      for (const n of ns) {
        if (n.children && n.children.length > 0) {
          ids.add(n.id);
          collect(n.children);
        }
      }
    };
    collect(nodes);
    setExpandedIds(ids);
  }, [nodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set<string>());
  }, []);

  const allExpanded = React.useMemo(() => {
    let parentCount = 0;
    const count = (ns: TreeNode[]) => {
      for (const n of ns) {
        if (n.children && n.children.length > 0) {
          parentCount++;
          count(n.children);
        }
      }
    };
    count(nodes);
    return parentCount > 0 && expandedIds.size >= parentCount;
  }, [nodes, expandedIds]);

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {selectedIds.size} selected
          </span>
        </div>
        <button
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          onClick={allExpanded ? handleCollapseAll : handleExpandAll}
          aria-label={allExpanded ? 'Collapse all categories' : 'Expand all categories'}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Search */}
      {searchable && (
        <div className="px-3 py-2 border-b">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                placeholder:text-gray-400"
              aria-label="Search tree items"
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tree */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
        role="tree"
        aria-label="Tree picker"
        aria-multiselectable={mode === 'multi'}
      >
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">{emptyMessage}</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          filteredNodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              mode={mode}
              searchTerm={searchTerm}
              showSelectAll={showSelectAll}
              showCount={showCount}
              onToggleSelect={toggleSelect}
              onToggleExpand={toggleExpand}
              onSelectAllCategory={selectAllCategory}
              onDeselectAllCategory={deselectAllCategory}
              renderItem={renderItem}
              focusedId={focusedId}
              onFocusChange={setFocusedId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ZorbitTreePicker;
