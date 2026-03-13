import React, { useState, useCallback } from 'react';
import { ZorbitTreePicker } from '../../components/ZorbitTreePicker';
import type { TreeNode } from '../../components/ZorbitTreePicker';

const sampleNodes: TreeNode[] = [
  {
    id: 'cat-fruits',
    label: 'Fruits',
    description: 'Fresh produce',
    children: [
      { id: 'apple', label: 'Apple', description: 'Crisp and sweet' },
      { id: 'banana', label: 'Banana', description: 'Rich in potassium' },
      { id: 'cherry', label: 'Cherry', description: 'Small stone fruit' },
      { id: 'dragonfruit', label: 'Dragonfruit', description: 'Exotic tropical fruit' },
      { id: 'elderberry', label: 'Elderberry', description: 'Dark purple berry' },
      { id: 'fig', label: 'Fig', description: 'Sweet Mediterranean fruit' },
    ],
  },
  {
    id: 'cat-vegetables',
    label: 'Vegetables',
    description: 'Garden vegetables',
    children: [
      { id: 'asparagus', label: 'Asparagus', description: 'Spring vegetable' },
      { id: 'broccoli', label: 'Broccoli', description: 'Cruciferous vegetable' },
      { id: 'carrot', label: 'Carrot', description: 'Root vegetable, high in beta-carotene' },
      { id: 'daikon', label: 'Daikon', description: 'Japanese white radish' },
      { id: 'eggplant', label: 'Eggplant', description: 'Also known as aubergine' },
      { id: 'fennel', label: 'Fennel', description: 'Anise-flavored herb' },
      { id: 'garlic', label: 'Garlic', description: 'Aromatic bulb' },
      { id: 'horseradish', label: 'Horseradish', description: 'Pungent root condiment', disabled: true },
    ],
  },
  {
    id: 'cat-grains',
    label: 'Grains & Cereals',
    description: 'Staple carbohydrates',
    children: [
      { id: 'barley', label: 'Barley', description: 'Ancient cereal grain' },
      { id: 'corn', label: 'Corn', description: 'Versatile grain crop' },
      { id: 'millet', label: 'Millet', description: 'Small-seeded grass' },
      { id: 'oats', label: 'Oats', description: 'Heart-healthy breakfast grain' },
      { id: 'quinoa', label: 'Quinoa', description: 'Protein-rich pseudocereal' },
      { id: 'rice', label: 'Rice', description: 'World staple food' },
      { id: 'wheat', label: 'Wheat', description: 'Bread wheat' },
    ],
  },
  {
    id: 'cat-proteins',
    label: 'Proteins',
    description: 'Protein sources',
    children: [
      { id: 'chicken', label: 'Chicken', description: 'Poultry' },
      { id: 'salmon', label: 'Salmon', description: 'Fatty fish rich in omega-3' },
      { id: 'tofu', label: 'Tofu', description: 'Soy-based protein' },
      { id: 'lentils', label: 'Lentils', description: 'Legume high in fiber' },
      { id: 'eggs', label: 'Eggs', description: 'Complete protein source' },
    ],
  },
];

function findLabel(nodes: TreeNode[], id: string): string | null {
  for (const n of nodes) {
    if (n.id === id) return n.label;
    if (n.children) {
      const found = findLabel(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

const TreePickerDemoPage: React.FC = () => {
  const [multiSelected, setMultiSelected] = useState<Set<string>>(
    () => new Set(['apple', 'broccoli', 'rice'])
  );
  const [singleSelected, setSingleSelected] = useState<Set<string>>(
    () => new Set(['salmon'])
  );

  const handleMultiChange = useCallback((ids: Set<string>) => {
    setMultiSelected(ids);
  }, []);

  const handleSingleChange = useCallback((ids: Set<string>) => {
    setSingleSelected(ids);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ZorbitTreePicker Demo</h1>
        <p className="text-sm text-gray-500 mt-1">
          A generic, reusable hierarchical selection component with accordion categories,
          search, and both single and multi-select modes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Multi-select */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Multi-Select Mode</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select multiple items across categories. Try searching and using "Select All".
              Horseradish is disabled.
            </p>
          </div>

          <ZorbitTreePicker
            nodes={sampleNodes}
            selectedIds={multiSelected}
            onSelectionChange={handleMultiChange}
            mode="multi"
            searchable
            searchPlaceholder="Search food items..."
            showSelectAll
            showCount
            maxHeight="360px"
          />

          <div className="bg-gray-50 border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Selected Items ({multiSelected.size})
            </h3>
            {multiSelected.size === 0 ? (
              <p className="text-sm text-gray-400 italic">No items selected</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(multiSelected).map((id) => {
                  const label = findLabel(sampleNodes, id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                        bg-blue-100 text-blue-700 rounded-full"
                    >
                      {label}
                      <button
                        className="hover:text-blue-900"
                        onClick={() => {
                          const next = new Set(multiSelected);
                          next.delete(id);
                          setMultiSelected(next);
                        }}
                        aria-label={`Remove ${label}`}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Single-select */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Single-Select Mode</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select exactly one item. Selecting a new item deselects the previous.
            </p>
          </div>

          <ZorbitTreePicker
            nodes={sampleNodes}
            selectedIds={singleSelected}
            onSelectionChange={handleSingleChange}
            mode="single"
            searchable
            searchPlaceholder="Search food items..."
            showSelectAll={false}
            showCount={false}
            maxHeight="360px"
          />

          <div className="bg-gray-50 border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Selected Item
            </h3>
            {singleSelected.size === 0 ? (
              <p className="text-sm text-gray-400 italic">No item selected</p>
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {findLabel(sampleNodes, Array.from(singleSelected)[0]!)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Custom renderer demo */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Custom Item Renderer</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Using the renderItem prop to customize how leaf items are displayed.
          </p>
        </div>

        <div className="max-w-lg">
          <ZorbitTreePicker
            nodes={sampleNodes.slice(0, 2)}
            selectedIds={multiSelected}
            onSelectionChange={handleMultiChange}
            mode="multi"
            searchable={false}
            showSelectAll
            showCount
            maxHeight="300px"
            renderItem={(node, selected) => (
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                    ${selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {node.label.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>
                    {node.label}
                  </p>
                  {node.description && (
                    <p className="text-xs text-gray-400">{node.description}</p>
                  )}
                </div>
                {selected && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default TreePickerDemoPage;
