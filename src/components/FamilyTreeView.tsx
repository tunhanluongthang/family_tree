import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  BackgroundVariant,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonNode } from './PersonNode'
import { usePersonStore } from '../store/usePersonStore'
import { transformToGraphData, applyHierarchicalLayout, filterByGenerationDepth, PersonNode as PersonNodeType } from '../utils/treeLayout'

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes: NodeTypes = {
  personNode: PersonNode
}

export function FamilyTreeView() {
  const { t } = useTranslation()
  const { persons, relationships } = usePersonStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [generationDepth, setGenerationDepth] = useState<number>(10)
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB')

  // Transform data whenever persons or relationships change
  useEffect(() => {
    if (persons.length === 0) return

    // Transform to graph data
    let { nodes: graphNodes, edges: graphEdges } = transformToGraphData(
      persons,
      relationships,
      selectedPersonId || undefined
    )

    // Apply layout
    const layoutedNodes = applyHierarchicalLayout(graphNodes, graphEdges, layoutDirection)

    // Filter by generation depth if needed
    if (selectedPersonId && generationDepth < 10) {
      const filtered = filterByGenerationDepth(layoutedNodes, graphEdges, selectedPersonId, generationDepth)
      setNodes(filtered.nodes)
      setEdges(filtered.edges)
    } else {
      setNodes(layoutedNodes)
      setEdges(graphEdges)
    }
  }, [persons, relationships, selectedPersonId, generationDepth, layoutDirection, setNodes, setEdges])

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedPersonId(node.id)
  }, [])

  // Stats
  const stats = useMemo(() => {
    const generations = new Set(nodes.map(n => (n as PersonNodeType).data.generation))
    return {
      totalPeople: persons.length,
      visiblePeople: nodes.length,
      generations: generations.size,
      relationships: edges.length
    }
  }, [nodes, edges, persons])

  if (persons.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('tree.emptyState.title')}</h3>
          <p className="text-gray-600">{t('tree.emptyState.description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 }
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const personNode = node as PersonNodeType
            switch (personNode.data.person.gender) {
              case 'male': return '#93c5fd'
              case 'female': return '#fbcfe8'
              default: return '#d1d5db'
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Control Panel */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 space-y-3">
          {/* Stats */}
          <div className="text-sm space-y-1">
            <div className="font-semibold text-gray-700">{t('tree.stats.title')}</div>
            <div className="text-gray-600">
              {t('tree.stats.people')} {stats.visiblePeople} / {stats.totalPeople}
            </div>
            <div className="text-gray-600">
              {t('tree.stats.generations')} {stats.generations}
            </div>
            <div className="text-gray-600">
              {t('tree.stats.connections')} {stats.relationships}
            </div>
          </div>

          {/* Generation Depth Filter */}
          <div className="pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tree.filters.generationDepth')}
            </label>
            <select
              value={generationDepth}
              onChange={(e) => setGenerationDepth(Number(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={3}>{t('tree.generationOptions.three')}</option>
              <option value={5}>{t('tree.generationOptions.five')}</option>
              <option value={7}>{t('tree.generationOptions.seven')}</option>
              <option value={10}>{t('tree.generationOptions.all')}</option>
            </select>
          </div>

          {/* Layout Direction */}
          <div className="pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tree.filters.layout')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLayoutDirection('TB')}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  layoutDirection === 'TB'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('tree.filters.layoutVertical')}
              </button>
              <button
                onClick={() => setLayoutDirection('LR')}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  layoutDirection === 'LR'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('tree.filters.layoutHorizontal')}
              </button>
            </div>
          </div>

          {/* Selected Person */}
          {selectedPersonId && (
            <div className="pt-3 border-t">
              <div className="text-xs text-gray-600 mb-1">{t('tree.filters.focusedOn')}</div>
              <div className="text-sm font-medium text-indigo-600">
                {persons.find(p => p.id === selectedPersonId)?.first_name}
              </div>
              <button
                onClick={() => setSelectedPersonId(null)}
                className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {t('tree.filters.clearFocus')}
              </button>
            </div>
          )}
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left" className="bg-white rounded-lg shadow-lg p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">{t('tree.legend.title')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 border-2 border-blue-400 rounded"></div>
              <span>{t('tree.legend.male')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-200 border-2 border-pink-400 rounded"></div>
              <span>{t('tree.legend.female')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-indigo-500"></div>
              <span>{t('tree.legend.parentChild')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span>{t('tree.legend.married')}</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
