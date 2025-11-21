import type { Person, Relationship } from '../types'
import type { Node, Edge } from 'reactflow'

export interface PersonNode extends Node {
  data: {
    person: Person
    generation: number
    parents: Person[]
    children: Person[]
    spouses: Person[]
  }
}

/**
 * Transform persons and relationships into React Flow nodes and edges
 */
export function transformToGraphData(
  persons: Person[],
  relationships: Relationship[],
  rootPersonId?: string
): { nodes: PersonNode[]; edges: Edge[] } {
  const nodes: PersonNode[] = []
  const edges: Edge[] = []

  // Helper functions
  const getParents = (personId: string): Person[] => {
    return relationships
      .filter(r => r.type === 'PARENT_CHILD' && r.person2_id === personId)
      .map(r => persons.find(p => p.id === r.person1_id))
      .filter(Boolean) as Person[]
  }

  const getChildren = (personId: string): Person[] => {
    return relationships
      .filter(r => r.type === 'PARENT_CHILD' && r.person1_id === personId)
      .map(r => persons.find(p => p.id === r.person2_id))
      .filter(Boolean) as Person[]
  }

  const getSpouses = (personId: string): Person[] => {
    return relationships
      .filter(r => r.type === 'SPOUSE' && (r.person1_id === personId || r.person2_id === personId))
      .map(r => {
        const spouseId = r.person1_id === personId ? r.person2_id : r.person1_id
        return persons.find(p => p.id === spouseId)
      })
      .filter(Boolean) as Person[]
  }

  // Calculate generations (BFS from root or find roots)
  const generationMap = new Map<string, number>()

  if (rootPersonId) {
    // Start from specific person
    calculateGenerations(rootPersonId, 0)
  } else {
    // Find root persons (people with no parents)
    const rootPersons = persons.filter(p => getParents(p.id).length === 0)
    rootPersons.forEach(p => calculateGenerations(p.id, 0))
  }

  function calculateGenerations(personId: string, generation: number, visited = new Set<string>()) {
    if (visited.has(personId)) return
    visited.add(personId)

    const currentGen = generationMap.get(personId)
    if (currentGen === undefined || generation < currentGen) {
      generationMap.set(personId, generation)
    }

    // Process children (next generation)
    const children = getChildren(personId)
    children.forEach(child => {
      calculateGenerations(child.id, generation + 1, visited)
    })

    // Process spouses (same generation)
    const spouses = getSpouses(personId)
    spouses.forEach(spouse => {
      if (!generationMap.has(spouse.id)) {
        generationMap.set(spouse.id, generation)
      }
    })
  }

  // Create nodes
  persons.forEach((person) => {
    const generation = generationMap.get(person.id) ?? 0
    const parents = getParents(person.id)
    const children = getChildren(person.id)
    const spouses = getSpouses(person.id)

    nodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: 0, y: 0 }, // Will be calculated by layout
      data: {
        person,
        generation,
        parents,
        children,
        spouses
      }
    })
  })

  // Create edges
  relationships.forEach((rel) => {
    if (rel.type === 'PARENT_CHILD') {
      // Parent to child edge
      edges.push({
        id: `${rel.person1_id}-${rel.person2_id}`,
        source: rel.person1_id,
        target: rel.person2_id,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        animated: false,
        label: 'child'
      })
    } else if (rel.type === 'SPOUSE') {
      // Spouse edge (horizontal)
      edges.push({
        id: `spouse-${rel.person1_id}-${rel.person2_id}`,
        source: rel.person1_id,
        target: rel.person2_id,
        type: 'straight',
        style: { stroke: '#ef4444', strokeWidth: 3 },
        animated: false,
        label: '💕'
      })
    }
  })

  return { nodes, edges }
}

/**
 * Apply hierarchical layout to nodes
 */
export function applyHierarchicalLayout(
  nodes: PersonNode[],
  _edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): PersonNode[] {
  const HORIZONTAL_SPACING = 250
  const VERTICAL_SPACING = 200

  // Group by generation
  const generationGroups = new Map<number, PersonNode[]>()
  nodes.forEach(node => {
    const gen = node.data.generation
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, [])
    }
    generationGroups.get(gen)!.push(node)
  })

  // Position nodes
  const positionedNodes: PersonNode[] = []

  // Sort generations (oldest to newest)
  const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b)

  sortedGenerations.forEach((generation) => {
    const nodesInGen = generationGroups.get(generation)!
    const yPos = generation * VERTICAL_SPACING

    // Position nodes horizontally
    nodesInGen.forEach((node, index) => {
      const xPos = (index - nodesInGen.length / 2) * HORIZONTAL_SPACING + (HORIZONTAL_SPACING / 2)

      positionedNodes.push({
        ...node,
        position: {
          x: direction === 'TB' ? xPos : yPos,
          y: direction === 'TB' ? yPos : xPos
        }
      })
    })
  })

  return positionedNodes
}

/**
 * Filter nodes by generation depth
 */
export function filterByGenerationDepth(
  nodes: PersonNode[],
  edges: Edge[],
  rootPersonId: string,
  maxDepth: number
): { nodes: PersonNode[]; edges: Edge[] } {
  const rootNode = nodes.find(n => n.id === rootPersonId)
  if (!rootNode) return { nodes, edges }

  const rootGeneration = rootNode.data.generation
  const minGeneration = rootGeneration - Math.floor(maxDepth / 2)
  const maxGeneration = rootGeneration + Math.ceil(maxDepth / 2)

  const filteredNodes = nodes.filter(node => {
    const gen = node.data.generation
    return gen >= minGeneration && gen <= maxGeneration
  })

  const nodeIds = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = edges.filter(edge =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  )

  return { nodes: filteredNodes, edges: filteredEdges }
}
