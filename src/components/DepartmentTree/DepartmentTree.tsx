import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users } from 'lucide-react';

export interface HierarchyNode {
  org: {
    id: string;
    hashId: string;
    name: string;
    userCount?: number;
  };
  relationshipType?: string;
  children: HierarchyNode[];
}

interface DepartmentTreeProps {
  hierarchy: HierarchyNode | null;
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (node: HierarchyNode) => void;
  compact?: boolean;
}

interface TreeNodeProps {
  node: HierarchyNode;
  depth: number;
  selectedId?: string | null;
  onSelect?: (node: HierarchyNode) => void;
  isLast: boolean;
  parentIsLast: boolean[];
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedId, onSelect, isLast, parentIsLast }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.org.hashId;

  return (
    <div>
      <div
        className={`flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect?.(node)}
      >
        {/* Expand/collapse toggle */}
        <button
          className={`mr-1 p-0.5 rounded transition-colors ${
            hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : 'invisible'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown size={14} className="text-gray-500" />
          ) : (
            <ChevronRight size={14} className="text-gray-500" />
          )}
        </button>

        {/* Icon */}
        <Building2 size={14} className={`mr-2 flex-shrink-0 ${
          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
        }`} />

        {/* Name */}
        <span className="text-sm font-medium truncate flex-1">{node.org.name}</span>

        {/* Hash ID */}
        <code className="text-[10px] text-gray-400 mx-1.5 hidden group-hover:inline">
          {node.org.hashId}
        </code>

        {/* User count */}
        {node.org.userCount !== undefined && node.org.userCount > 0 && (
          <span className="flex items-center text-xs text-gray-400 ml-1">
            <Users size={11} className="mr-0.5" />
            {node.org.userCount}
          </span>
        )}

        {/* Relationship type badge */}
        {node.relationshipType && node.relationshipType !== 'root' && (
          <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded ml-1">
            {node.relationshipType}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative">
          {/* Vertical guide line */}
          <div
            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${(depth + 1) * 20 + 14}px` }}
          />
          {node.children.map((child, i) => (
            <TreeNode
              key={child.org.hashId || child.org.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              isLast={i === node.children.length - 1}
              parentIsLast={[...parentIsLast, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function countNodes(node: HierarchyNode | null): number {
  if (!node) return 0;
  return 1 + (node.children || []).reduce((sum, c) => sum + countNodes(c), 0);
}

const DepartmentTree: React.FC<DepartmentTreeProps> = ({
  hierarchy,
  loading,
  selectedId,
  onSelect,
  compact,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2" />
        Loading hierarchy...
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No department hierarchy found.
      </div>
    );
  }

  const total = countNodes(hierarchy);

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Department Tree
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
            {total} dept{total !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <TreeNode
        node={hierarchy}
        depth={0}
        selectedId={selectedId}
        onSelect={onSelect}
        isLast={true}
        parentIsLast={[]}
      />
    </div>
  );
};

export default DepartmentTree;
export { countNodes };
