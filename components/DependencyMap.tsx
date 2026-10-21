"use client"

import React, { useState, useCallback, useEffect, createContext, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Position,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CourseNode } from './CourseNode';
import { useAllCourses } from '@/hooks/useCourses';
import { Plus, Trash2, Filter, Loader2, Workflow, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

const NODE_WIDTH = 270;
const NODE_HEIGHT = 116;
const COLUMN_GAP = 170; // Horizontal space for Left -> Right bezier curves
const ROW_GAP = 54;     // Minimum vertical gap between nodes in the same stage

function getRelationStyle(relationLabel?: string) {
  const rel = relationLabel || '';
  const isCoreq = rel.includes('צמוד') || rel.toLowerCase().includes('coreq');
  const isPreReq =
    !isCoreq &&
    (rel.includes('קדם') || rel.toLowerCase().includes('prereq') || rel === '');

  if (isCoreq) {
    return {
      color: '#d97706', // amber-600
      isPreReq: false,
      isCoreq: true,
      dash: '6 4',
    };
  }
  if (isPreReq) {
    return {
      color: '#ea580c', // BGU orange-600
      isPreReq: true,
      isCoreq: false,
      dash: undefined,
    };
  }
  return {
    color: '#059669', // emerald-600
    isPreReq: false,
    isCoreq: false,
    dash: undefined,
  };
}

function isBlockedRelation(rc: any): boolean {
  if (rc?.isBlockedCourse) return true;
  const rel = String(rc?.relation || '');
  return (
    rel.includes('Blocks') ||
    rel.includes('חוסם') ||
    rel.includes('דרישת קדם עבור')
  );
}

function cleanRelationName(raw?: string): string {
  if (!raw) return 'קורס קדם';
  const match = raw.match(/\(([^)]+)\)$/);
  if (
    match &&
    (raw.includes('Blocks') ||
      raw.includes('חוסם') ||
      raw.includes('דרישת קדם עבור') ||
      raw.includes('קדם פותח'))
  ) {
    return match[1];
  }
  return raw;
}

/**
 * Builds deterministic directed edges (Prerequisite Left -> Dependent Right)
 * across all nodes currently on the map, preserving any manual user edges.
 */
function buildEdgesForNodes(nodes: Node[], existingEdges: Edge[]): Edge[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edgeMap = new Map<string, Edge>();
  const undirectedPairs = new Set<string>();

  // 1. Authoritative edges derived from node.data.relatedCourses
  nodes.forEach((node) => {
    const related: any[] = Array.isArray(node.data?.relatedCourses)
      ? (node.data.relatedCourses as any[])
      : [];

    related.forEach((rc) => {
      const otherId = rc.params?.course || rc.id?.split('.')?.[2] || rc.id;
      if (!otherId || !nodeIds.has(otherId) || otherId === node.id) return;

      const isBlocked = isBlockedRelation(rc);

      // Prerequisite always on the Left (source), Dependent course on the Right (target)
      const source = isBlocked ? node.id : otherId;
      const target = isBlocked ? otherId : node.id;
      const label = cleanRelationName(rc.cleanRelation || rc.relation);
      const key = `${source}->${target}`;
      const pairKey = [source, target].sort().join('::');

      if (!edgeMap.has(key)) {
        const styleInfo = getRelationStyle(label);
        undirectedPairs.add(pairKey);
        edgeMap.set(key, {
          id: `e${source}-${target}`,
          source,
          target,
          type: 'default',
          label,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: styleInfo.color,
            width: 18,
            height: 18,
          },
          style: {
            stroke: styleInfo.color,
            strokeWidth: 2,
            strokeDasharray: styleInfo.dash,
          },
        });
      }
    });
  });

  // 2. Keep any manual user-connected edges that aren't already covered by catalog relations
  existingEdges.forEach((e) => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target) || e.source === e.target) return;
    const pairKey = [e.source, e.target].sort().join('::');
    if (undirectedPairs.has(pairKey)) return;

    const rawLabel = typeof e.label === 'string' ? e.label : 'קורס קדם';
    const label = cleanRelationName(rawLabel);
    const key = `${e.source}->${e.target}`;
    const styleInfo = getRelationStyle(label);

    undirectedPairs.add(pairKey);
    edgeMap.set(key, {
      ...e,
      id: `e${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'default',
      label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: styleInfo.color,
        width: 18,
        height: 18,
      },
      style: {
        stroke: styleInfo.color,
        strokeWidth: 2,
        strokeDasharray: styleInfo.dash,
      },
    });
  });

  return Array.from(edgeMap.values());
}

/**
 * Sugiyama-style Left-to-Right (LR) Directed Acyclic Graph Layout:
 * 1. Breaks cycles deterministically
 * 2. Computes longest-path horizontal ranks (Stage 0 on Left -> Stage N on Right)
 * 3. Pulls root prerequisites close to their dependents to avoid long spanning edges
 * 4. Runs multi-pass Barycenter crossing reduction + force-directed vertical alignment
 */
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return { nodes: [], edges };

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const validEdges = edges.filter(
    (e) => nodeMap.has(e.source) && nodeMap.has(e.target) && e.source !== e.target
  );

  // 1. Build adjacency & break cycles via DFS
  const rawOut = new Map<string, string[]>();
  const undirectedAdj = new Map<string, Set<string>>();
  nodes.forEach((n) => {
    rawOut.set(n.id, []);
    undirectedAdj.set(n.id, new Set());
  });

  validEdges.forEach((e) => {
    rawOut.get(e.source)!.push(e.target);
    undirectedAdj.get(e.source)!.add(e.target);
    undirectedAdj.get(e.target)!.add(e.source);
  });

  const backEdges = new Set<string>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfsCycle = (u: string) => {
    visited.add(u);
    inStack.add(u);
    for (const v of rawOut.get(u) || []) {
      if (inStack.has(v)) {
        backEdges.add(`${u}->${v}`);
      } else if (!visited.has(v)) {
        dfsCycle(v);
      }
    }
    inStack.delete(u);
  };

  nodes.forEach((n) => {
    if (!visited.has(n.id)) dfsCycle(n.id);
  });

  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodes.forEach((n) => {
    outEdges.set(n.id, []);
    inEdges.set(n.id, []);
  });

  validEdges.forEach((e) => {
    const key = `${e.source}->${e.target}`;
    if (backEdges.has(key)) return;
    outEdges.get(e.source)!.push(e.target);
    inEdges.get(e.target)!.push(e.source);
  });

  // 2. Find connected components so disconnected subgraphs don't tangle
  const componentOf = new Map<string, number>();
  const components: string[][] = [];
  const compVisited = new Set<string>();

  nodes.forEach((n) => {
    if (compVisited.has(n.id)) return;
    const comp: string[] = [];
    const queue = [n.id];
    compVisited.add(n.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      comp.push(curr);
      for (const nb of Array.from(undirectedAdj.get(curr) || [])) {
        if (!compVisited.has(nb)) {
          compVisited.add(nb);
          queue.push(nb);
        }
      }
    }
    components.push(comp);
  });

  // Sort components: multi-node connected components first (largest first), singletons last
  components.sort((a, b) => {
    if ((b.length > 1) !== (a.length > 1)) return b.length > 1 ? 1 : -1;
    if (b.length !== a.length) return b.length - a.length;
    return a[0].localeCompare(b[0]);
  });

  components.forEach((comp, idx) => {
    comp.forEach((id) => componentOf.set(id, idx));
  });

  // 3. Assign horizontal rank (0 = leftmost, increasing to the right)
  const rank = new Map<string, number>();
  nodes.forEach((n) => rank.set(n.id, 0));

  for (let iter = 0; iter < nodes.length; iter++) {
    let changed = false;
    validEdges.forEach((e) => {
      if (backEdges.has(`${e.source}->${e.target}`)) return;
      const uRank = rank.get(e.source) || 0;
      const vRank = rank.get(e.target) || 0;
      if (vRank < uRank + 1) {
        rank.set(e.target, uRank + 1);
        changed = true;
      }
    });
    if (!changed) break;
  }

  // Pull root nodes (inDegree === 0, outDegree > 0) closer to their immediate children
  // so edges don't span multiple columns unnecessarily
  for (let iter = 0; iter < nodes.length; iter++) {
    let changed = false;
    nodes.forEach((n) => {
      const ins = inEdges.get(n.id) || [];
      const outs = outEdges.get(n.id) || [];
      if (ins.length === 0 && outs.length > 0) {
        const minChildRank = Math.min(...outs.map((cid) => rank.get(cid) || 0));
        const desiredRank = Math.max(0, minChildRank - 1);
        if ((rank.get(n.id) || 0) !== desiredRank) {
          rank.set(n.id, desiredRank);
          changed = true;
        }
      }
    });
    if (!changed) break;
  }

  // Group nodes into columns by rank
  let maxRank = 0;
  rank.forEach((r) => {
    if (r > maxRank) maxRank = r;
  });

  const columns: Node[][] = Array.from({ length: maxRank + 1 }, () => []);
  nodes.forEach((n) => {
    const r = rank.get(n.id) || 0;
    columns[r].push(n);
  });

  // Initial deterministic sort within each column
  columns.forEach((col) => {
    col.sort((a, b) => {
      const compA = componentOf.get(a.id) ?? 0;
      const compB = componentOf.get(b.id) ?? 0;
      if (compA !== compB) return compA - compB;
      const degA = (outEdges.get(a.id)?.length || 0) + (inEdges.get(a.id)?.length || 0);
      const degB = (outEdges.get(b.id)?.length || 0) + (inEdges.get(b.id)?.length || 0);
      if (degA !== degB) return degB - degA;
      return String(a.data?.courseId || a.id).localeCompare(String(b.data?.courseId || b.id));
    });
  });

  // 4. Barycenter Crossing Minimization + Coordinate Assignment
  const yPos = new Map<string, number>();
  const minSpacing = NODE_HEIGHT + ROW_GAP;

  // Initial centered Y distribution per column
  columns.forEach((col) => {
    const count = col.length;
    col.forEach((n, idx) => {
      yPos.set(n.id, (idx - (count - 1) / 2) * minSpacing);
    });
  });

  // Helper to resolve vertical overlaps in a column while keeping nodes near desiredY
  const resolveColumnY = (col: Node[], desiredY: Map<string, number>) => {
    if (col.length === 0) return;
    const ys = col.map((n) => desiredY.get(n.id) ?? yPos.get(n.id) ?? 0);

    // Forward pass: push down overlapping nodes
    for (let i = 1; i < ys.length; i++) {
      const gap =
        (componentOf.get(col[i].id) !== componentOf.get(col[i - 1].id))
          ? minSpacing + 36
          : minSpacing;
      if (ys[i] < ys[i - 1] + gap) {
        ys[i] = ys[i - 1] + gap;
      }
    }

    // Backward pass: pull up from bottom
    for (let i = ys.length - 2; i >= 0; i--) {
      const gap =
        (componentOf.get(col[i + 1].id) !== componentOf.get(col[i].id))
          ? minSpacing + 36
          : minSpacing;
      if (ys[i] > ys[i + 1] - gap) {
        ys[i] = ys[i + 1] - gap;
      }
    }

    // Center the resolved column around the mean of its desiredY
    const desiredMean =
      col.reduce((sum, n) => sum + (desiredY.get(n.id) ?? 0), 0) / col.length;
    const actualMean = ys.reduce((sum, y) => sum + y, 0) / ys.length;
    const shift = desiredMean - actualMean;

    col.forEach((n, idx) => {
      yPos.set(n.id, ys[idx] + shift);
    });
  };

  // Run 12 alternating Left->Right and Right->Left sweeps
  const SWEEPS = 12;
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    const forward = sweep % 2 === 0;
    const startR = forward ? 1 : maxRank - 1;
    const endR = forward ? maxRank : 0;
    const step = forward ? 1 : -1;

    for (let r = startR; forward ? r <= endR : r >= endR; r += step) {
      const col = columns[r];
      if (!col || col.length === 0) continue;

      const desiredY = new Map<string, number>();

      col.forEach((node) => {
        const ins = inEdges.get(node.id) || [];
        const outs = outEdges.get(node.id) || [];

        let weightedSum = 0;
        let totalWeight = 0;

        // Primary direction neighbors get weight 1.0, opposite direction get 0.35
        ins.forEach((uId) => {
          const w = forward ? 1.0 : 0.35;
          weightedSum += (yPos.get(uId) ?? 0) * w;
          totalWeight += w;
        });

        outs.forEach((vId) => {
          const w = forward ? 0.35 : 1.0;
          weightedSum += (yPos.get(vId) ?? 0) * w;
          totalWeight += w;
        });

        if (totalWeight > 0) {
          desiredY.set(node.id, weightedSum / totalWeight);
        } else {
          desiredY.set(node.id, yPos.get(node.id) ?? 0);
        }
      });

      // Sort column by component first (for isolated nodes), then by desiredY
      col.sort((a, b) => {
        const compA = componentOf.get(a.id) ?? 0;
        const compB = componentOf.get(b.id) ?? 0;
        const isIsoA = (inEdges.get(a.id)?.length || 0) + (outEdges.get(a.id)?.length || 0) === 0;
        const isIsoB = (inEdges.get(b.id)?.length || 0) + (outEdges.get(b.id)?.length || 0) === 0;
        if (isIsoA !== isIsoB) return isIsoA ? 1 : -1;
        if (compA !== compB) return compA - compB;
        return (desiredY.get(a.id) ?? 0) - (desiredY.get(b.id) ?? 0);
      });

      resolveColumnY(col, desiredY);
    }
  }

  // Normalize all coordinates so top-left starts cleanly near (40, 40)
  let minY = Infinity;
  yPos.forEach((y) => {
    if (y < minY) minY = y;
  });
  if (!Number.isFinite(minY)) minY = 0;

  const newNodes = nodes.map((n) => {
    const r = rank.get(n.id) || 0;
    const x = r * (NODE_WIDTH + COLUMN_GAP) + 40;
    const y = Math.round((yPos.get(n.id) ?? 0) - minY + 40);

    return {
      ...n,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: { x, y },
      data: {
        ...n.data,
        stage: r,
      },
    };
  });

  return { nodes: newNodes, edges: validEdges };
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const nodeTypes = {
  course: CourseNode,
};

interface Department {
  id: string;
  name: string;
}

export const CourseMapContext = createContext<any>(null);

export function DependencyMap({ dictionary, locale }: { dictionary: any, locale: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [open, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRelations, setSelectedRelations] = useState<string[]>(['קורס קדם', 'קורס צמוד']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingDept, setIsFetchingDept] = useState(false);
  const [showFetchDeptDialog, setShowFetchDeptDialog] = useState(false);
  const [fetchDeptInput, setFetchDeptInput] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
  
  // Autocomplete state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestContainerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: courses = [] } = useAllCourses();

  const existingNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  const availableRelations = useMemo(() => {
    const relations = new Set<string>();
    nodes.forEach((n) => {
      if (n.data && Array.isArray((n.data as any).relatedCourses)) {
        (n.data as any).relatedCourses.forEach((rc: any) => {
          const rel = cleanRelationName(rc.cleanRelation || rc.relation);
          if (rel) relations.add(rel);
        });
      }
    });
    edges.forEach((e) => {
      if (typeof e.label === 'string' && e.label) {
        relations.add(cleanRelationName(e.label));
      }
    });
    return Array.from(relations);
  }, [nodes, edges]);

  // Keep selectedRelations inclusive of newly discovered relation types by default
  useEffect(() => {
    if (availableRelations.length > 0) {
      setSelectedRelations((prev) => {
        const cleanedPrev = prev.map(cleanRelationName);
        const merged = new Set([...cleanedPrev, ...availableRelations]);
        return Array.from(merged);
      });
    }
  }, [availableRelations]);

  // Active focused node (either hovered on desktop or tapped/selected on mobile)
  const activeNodeId = useMemo(() => {
    if (hoveredNodeId) return hoveredNodeId;
    const selectedNode = nodes.find((n) => n.selected);
    return selectedNode ? selectedNode.id : null;
  }, [hoveredNodeId, nodes]);

  // Nodes connected to the currently active node
  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return null;
    const set = new Set<string>([activeNodeId]);
    edges.forEach((e) => {
      if (e.source === activeNodeId) set.add(e.target);
      if (e.target === activeNodeId) set.add(e.source);
    });
    return set;
  }, [activeNodeId, edges]);

  const filteredEdges = useMemo<Edge[]>(() => {
    if (!selectedRelations || selectedRelations.length === 0) return [];
    return edges
      .filter((e) => {
        if (!e.label) return true;
        return selectedRelations.includes(cleanRelationName(e.label as string));
      })
      .map((e) => {
        const label = cleanRelationName(e.label as string);
        const styleInfo = getRelationStyle(label);
        const isConnectedToActive =
          activeNodeId && (e.source === activeNodeId || e.target === activeNodeId);
        const isDimmed = activeNodeId && !isConnectedToActive;

        return {
          ...e,
          type: 'default',
          animated: Boolean(isConnectedToActive),
          // Show text pill on the edge only when hovering/selecting a connected node so edges don't clutter
          label: isConnectedToActive ? label : undefined,
          zIndex: isConnectedToActive ? 40 : 1,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: styleInfo.color,
            width: 18,
            height: 18,
          },
          style: {
            stroke: styleInfo.color,
            strokeWidth: isConnectedToActive ? 2.75 : 2,
            strokeDasharray: styleInfo.dash,
            opacity: isDimmed ? 0.18 : 0.85,
            transition: 'opacity 150ms ease, stroke-width 150ms ease',
          },
          labelStyle: {
            fill: styleInfo.color,
            fontWeight: 600,
            fontSize: 11,
          },
          labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 0.95,
            stroke: styleInfo.color,
            strokeWidth: 1,
            rx: 6,
            ry: 6,
          },
          labelBgPadding: [6, 4] as [number, number],
        };
      });
  }, [edges, selectedRelations, activeNodeId]);

  const hasLoadedInitialRef = useRef(false);
  const isHydratingFromCloudRef = useRef(false);

  const runAutoLayout = useCallback(
    (targetNodes: Node[], targetEdges: Edge[], shouldFitView = true) => {
      const syncedEdges = buildEdgesForNodes(targetNodes, targetEdges);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        targetNodes,
        syncedEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      if (shouldFitView) {
        setTimeout(() => {
          rfInstanceRef.current?.fitView({ padding: 0.22, duration: 350 });
        }, 50);
      }
    },
    [setNodes, setEdges]
  );

  const loadMapFromLocalStorage = useCallback((isCloudHydration = false) => {
    const savedNodes = localStorage.getItem('dependencyMapNodes');
    const savedEdges = localStorage.getItem('dependencyMapEdges');
    const savedRelations = localStorage.getItem('dependencyMapRelations');

    let initialNodes: Node[] = [];
    let initialEdges: Edge[] = [];

    if (savedNodes) {
      try {
        initialNodes = JSON.parse(savedNodes);
      } catch {
        initialNodes = [];
      }
    }
    if (savedEdges) {
      try {
        initialEdges = JSON.parse(savedEdges);
      } catch {
        initialEdges = [];
      }
    }
    if (savedRelations) {
      try {
        const parsed = JSON.parse(savedRelations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedRelations(parsed.map(cleanRelationName));
        }
      } catch {
        // ignore
      }
    }

    if (isCloudHydration) {
      isHydratingFromCloudRef.current = true;
    }

    if (initialNodes.length > 0) {
      const syncedEdges = buildEdgesForNodes(initialNodes, initialEdges);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        syncedEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setTimeout(() => {
        rfInstanceRef.current?.fitView({ padding: 0.22, duration: 300 });
      }, 80);
    } else if (isCloudHydration) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  // Load from local storage on mount & listen for cloud hydration
  useEffect(() => {
    loadMapFromLocalStorage(false);
    hasLoadedInitialRef.current = true;

    const handleCloudHydrate = () => {
      loadMapFromLocalStorage(true);
    };
    window.addEventListener('dependency-map-cloud-hydrated', handleCloudHydrate);
    return () => {
      window.removeEventListener('dependency-map-cloud-hydrated', handleCloudHydrate);
    };
  }, [loadMapFromLocalStorage]);

  // Fetch departments for autocomplete
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          setDepartments([]);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  // Filter departments based on input
  useEffect(() => {
    const filtered = departments.filter((dept) =>
      fetchDeptInput === '' || 
      dept.id.includes(fetchDeptInput) || 
      dept.name.toLowerCase().includes(fetchDeptInput.toLowerCase())
    )
    setFilteredDepartments(filtered);
  }, [fetchDeptInput, departments]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestContainerRef.current && !suggestContainerRef.current.contains(event.target as globalThis.Node)) {
        setIsSuggestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredDepartments.length - 1 ? prev + 1 : prev));
      setIsSuggestOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredDepartments[selectedIndex]) {
        e.preventDefault();
        setFetchDeptInput(filteredDepartments[selectedIndex].id);
        setIsSuggestOpen(false);
        setTimeout(() => document.getElementById('dialog-fetch-btn')?.click(), 0);
      } else if (fetchDeptInput) {
        handleFetchDepartment();
      }
    } else if (e.key === 'Escape') {
      setIsSuggestOpen(false);
    }
  };

  // Save to local storage on change & notify cloud sync
  useEffect(() => {
    if (!hasLoadedInitialRef.current) return;
    if (isHydratingFromCloudRef.current) {
      isHydratingFromCloudRef.current = false;
      return;
    }
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem('dependencyMapNodes', JSON.stringify(nodes));
      localStorage.setItem('dependencyMapEdges', JSON.stringify(edges));
      localStorage.setItem('dependencyMapRelations', JSON.stringify(selectedRelations));
    } else if (nodes.length === 0 && edges.length === 0) {
      localStorage.removeItem('dependencyMapNodes');
      localStorage.removeItem('dependencyMapEdges');
    }
    window.dispatchEvent(new Event('dependency-map-updated'));
  }, [nodes, edges, selectedRelations]);

  const onRemoveNode = useCallback((nodeId: string) => {
    setHoveredNodeId((prev) => (prev === nodeId ? null : prev));
    setNodes((nds) => {
      const remainingNodes = nds.filter((n) => n.id !== nodeId);
      setEdges((eds) => {
        const remainingEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          remainingNodes,
          remainingEdges
        );
        setTimeout(() => setNodes(layoutedNodes), 0);
        return layoutedEdges;
      });
      return remainingNodes;
    });
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const label = selectedRelations[0] || 'קורס קדם';
      const styleInfo = getRelationStyle(label);
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'default',
            label,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: styleInfo.color,
              width: 18,
              height: 18,
            },
            style: {
              stroke: styleInfo.color,
              strokeWidth: 2,
              strokeDasharray: styleInfo.dash,
            },
          } as any,
          eds
        )
      );
    },
    [setEdges, selectedRelations]
  );

  const fetchCourseData = async (
    courseId: string,
    dept: string,
    degree: string,
    year: string,
    semester: string,
    name: string,
    sourcePos?: { x: number; y: number },
    forceUpdate = false
  ) => {
    const newNodeId = courseId;
    if (!forceUpdate && nodes.some((n) => n.id === newNodeId)) return;

    if (!forceUpdate) {
      const initialPos = sourcePos
        ? { x: sourcePos.x + NODE_WIDTH + COLUMN_GAP, y: sourcePos.y }
        : { x: 80, y: 80 };

      const pendingNode: Node = {
        id: newNodeId,
        type: 'course',
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: initialPos,
        data: {
          id: newNodeId,
          courseId,
          dept,
          degree,
          name,
          locale,
          year: Number(year),
          semester: Number(semester),
          loading: true,
        },
      };

      setNodes((nds) => [...nds, pendingNode]);
    }

    try {
      const res = await fetch(
        `/api/courses/${courseId}?dept=${dept}&degree=${degree}&year=${year}&semester=${semester}`
      );
      if (res.ok) {
        const detail = await res.json();

        setNodes((latestNodes) => {
          const updatedNodes = latestNodes.map((n) => {
            if (n.id === newNodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  loading: false,
                  year: Number(detail.year || n.data.year),
                  semester: Number(detail.semester || n.data.semester),
                  stats: { points: detail.points },
                  type: detail.type,
                  relatedCourses: [
                    ...(detail.relatedCourses || []).map((rc: any) => ({
                      ...rc,
                      isBlockedCourse: false,
                      cleanRelation: cleanRelationName(rc.relation),
                    })),
                    ...(detail.blockedCourses || []).map((bc: any) => ({
                      ...bc,
                      isBlockedCourse: true,
                      cleanRelation: cleanRelationName(bc.relation),
                      relation: `${dictionary?.course?.prerequisiteFor || 'Blocks'} (${cleanRelationName(bc.relation)})`,
                    })),
                  ],
                  offerings: detail.offerings || [],
                },
              };
            }
            return n;
          });

          setEdges((latestEdges) => {
            const syncedEdges = buildEdgesForNodes(updatedNodes, latestEdges);
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
              updatedNodes,
              syncedEdges
            );
            setTimeout(() => {
              setNodes(layoutedNodes);
              rfInstanceRef.current?.fitView({ padding: 0.22, duration: 350 });
            }, 0);
            return layoutedEdges;
          });

          return updatedNodes;
        });
      } else {
        setNodes((nds) =>
          nds.map((n) => (n.id === newNodeId ? { ...n, data: { ...n.data, loading: false } } : n))
        );
      }
    } catch (e) {
      console.error(e);
      setNodes((nds) =>
        nds.map((n) => (n.id === newNodeId ? { ...n, data: { ...n.data, loading: false } } : n))
      );
    }
  };

  const handleFetchDepartment = async () => {
    if (!fetchDeptInput) return;
    setIsFetchingDept(true);
    try {
      const res = await fetch(`/api/departments/${fetchDeptInput}`);
      if (res.ok) {
        const deptCourses = await res.json();
        if (deptCourses && deptCourses.length > 0) {
          toast.success(dictionary.map.deptFound);
          queryClient.invalidateQueries({ queryKey: ['courses'] });
          setShowFetchDeptDialog(false);
          setFetchDeptInput('');
        } else {
          toast.error(dictionary.map.deptNotFound);
        }
      } else {
        toast.error(dictionary.map.deptNotFound);
      }
    } catch (err) {
      console.error(err);
      toast.error(dictionary.map.deptNotFound);
    } finally {
      setIsFetchingDept(false);
    }
  };

  const updateCourseTerm = useCallback((courseId: string, dept: string, degree: string, year: string, semester: string, name: string) => {
    setNodes((nds) => nds.map(n => n.id === courseId ? { ...n, data: { ...n.data, year: Number(year), semester: Number(semester) } } : n));
  }, [setNodes]);

  return (
    <div className="h-full w-full relative" id="tour-map-area">
      <div
        className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-10 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-none"
        dir={locale === 'he' ? 'rtl' : 'ltr'}
      >
        <Button
          id="tour-map-add"
          size="sm"
          onClick={() => setOpen(true)}
          className="pointer-events-auto h-9 px-3 sm:px-3.5 rounded-lg font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {dictionary.map.addCourse}
        </Button>
        {nodes.length > 0 && (
          <Button
            size="sm"
            onClick={() => runAutoLayout(nodes, edges, true)}
            variant="outline"
            className="pointer-events-auto h-9 px-2.5 sm:px-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Workflow className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {locale === 'he' ? 'סידור אוטומטי (שמאל ⬅ ימין)' : 'Auto-Arrange (Left ➔ Right)'}
            </span>
            <span className="sm:hidden">
              {locale === 'he' ? 'סידור אוטומטי' : 'Auto-Arrange'}
            </span>
          </Button>
        )}
        {nodes.length > 0 && (
          <Button
            size="sm"
            onClick={() => { setNodes([]); setEdges([]); }}
            variant="outline"
            className="pointer-events-auto h-9 px-2.5 sm:px-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 border-red-200/80 dark:border-red-900/50 shadow-xs rounded-lg font-medium text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xs:inline">{dictionary.map.clearMap}</span>
          </Button>
        )}
        {availableRelations.length > 0 && (
          <div className="relative pointer-events-auto">
            <Button 
              size="sm"
              variant="outline" 
              onClick={() => setShowFilter(!showFilter)} 
              className={cn(
                "h-9 px-2.5 sm:px-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800",
                showFilter || (selectedRelations.length > 0 && selectedRelations.length !== availableRelations.length)
                  ? 'text-primary border-primary/50 bg-primary/5 dark:bg-primary/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{dictionary.map.filterRelations}</span>
            </Button>
            {showFilter && (
              <div className={`absolute top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-lg ${locale === 'he' ? 'right-0' : 'left-0'} z-50`}>
                <div className="flex flex-col gap-1 text-start">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1.5 py-1">{dictionary.map.filterRelations}</span>
                  {availableRelations.map(rel => (
                    <label key={rel} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg" dir={locale === 'he' ? 'rtl' : 'ltr'}>
                      <input 
                        type="checkbox" 
                        checked={selectedRelations.includes(rel)}
                        onChange={() => {
                          setSelectedRelations(prev => 
                            prev.includes(rel) 
                              ? prev.filter(r => r !== rel)
                              : [...prev, rel]
                          );
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="truncate" title={rel}>{rel}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flow Direction & Legend Pill */}
      {nodes.length > 0 && (
        <div
          className="absolute bottom-3 sm:bottom-4 z-10 flex items-center gap-2.5 sm:gap-4 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 pointer-events-none"
          style={{ [locale === 'he' ? 'right' : 'left']: '52px' }}
          dir="ltr"
        >
          <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
            <span>{locale === 'he' ? 'קדם (שמאל)' : 'Prereqs (Left)'}</span>
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span>{locale === 'he' ? 'המשך (ימין)' : 'Next (Right)'}</span>
          </div>
          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-orange-600 rounded-full inline-block" />
              <span>{locale === 'he' ? 'קורס קדם' : 'Prerequisite'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-600 inline-block" />
              <span>{locale === 'he' ? 'קורס צמוד' : 'Corequisite'}</span>
            </span>
          </div>
        </div>
      )}

      <CourseMapContext.Provider
        value={{
          onRemoveNode,
          fetchCourseData,
          updateCourseTerm,
          dictionary,
          selectedRelations,
          existingNodeIds,
          hoveredNodeId: activeNodeId,
          setHoveredNodeId,
          connectedNodeIds,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => {
            rfInstanceRef.current = instance;
          }}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.15}
          maxZoom={1.5}
        >
          <Controls showInteractive={false} />
          <MiniMap
            className="!hidden md:!block"
            zoomable
            pannable
            nodeColor={(n) => (n.selected ? '#ea580c' : '#cbd5e1')}
            maskColor="rgba(241, 245, 249, 0.7)"
          />
          <Background color="#cbd5e1" gap={20} />
        </ReactFlow>
      </CourseMapContext.Provider>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div id="tour-map-search" dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <CommandInput 
            placeholder={dictionary.map.searchPlaceholder} 
            className={locale === 'he' ? 'text-right' : 'text-left'} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>
        <CommandList className={locale === 'he' ? 'text-right' : 'text-left'} dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center text-center gap-3 py-6 px-4">
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{dictionary.navbar.noResults}</p>
              <p className="text-xs text-muted-foreground whitespace-normal leading-relaxed mx-auto max-w-[280px]">
                {dictionary.map.suggestDepartment}
              </p>
              {searchQuery && (
                 <Button 
                   size="sm"
                   onClick={() => setShowFetchDeptDialog(true)} 
                   className="mt-1 rounded-lg"
                 >
                   {dictionary.map.searchDeptBtn}
                 </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup heading={dictionary.home.fullCatalog}>
            {courses.map((course: any) => (
              <CommandItem
                key={course.id}
                value={`${course.id} ${course.name}`}
                onSelect={() => {
                  setOpen(false)
                  const parts = course.id.split('.')
                  const dept = (course as any).params?.dept || parts[0] || '202'
                  const degree = (course as any).params?.degree || parts[1] || '1'
                  const cId = (course as any).params?.course || parts[2] || course.id
                  const activeParts = course.activeIn ? course.activeIn.split('-') : []
                  const latestOffering = (course as any).offerings?.[0]
                  const year = (course as any).params?.year || latestOffering?.year || activeParts[0] || '2027'
                  const semester = (course as any).params?.semester || latestOffering?.semester || activeParts[1] || '1'
                  
                  fetchCourseData(cId, dept, degree, year, semester, course.name);
                }}
                className="flex items-center justify-between gap-3 py-2.5 px-3 cursor-pointer rounded-lg my-0.5"
              >
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {course.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {course.id}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={showFetchDeptDialog} onOpenChange={setShowFetchDeptDialog}>
        <DialogContent className="sm:max-w-md" dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <DialogHeader>
            <DialogTitle>{dictionary.map.fetchDeptTitle}</DialogTitle>
            <DialogDescription>
              {dictionary.map.fetchDeptDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center py-2" ref={suggestContainerRef}>
            <div className="grid flex-1 gap-2 relative">
              <Input
                value={fetchDeptInput}
                onChange={(e) => {
                  setFetchDeptInput(e.target.value);
                  setIsSuggestOpen(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setIsSuggestOpen(true)}
                placeholder={dictionary.map.fetchDeptPlaceholder}
                disabled={isFetchingDept}
                className={cn(locale === 'he' ? 'text-right' : 'text-left')}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {isLoadingDepartments && (
                <div className="absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4">
                  <Loader2 className="h-full w-full animate-spin text-primary/50" />
                </div>
              )}
              {isSuggestOpen && filteredDepartments.length > 0 && (
                <div className="absolute top-full z-[100] w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                  <ul className="max-h-[200px] overflow-auto py-1">
                    {filteredDepartments.map((dept, index) => (
                      <li key={dept.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFetchDeptInput(dept.id);
                            setIsSuggestOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start",
                            selectedIndex === index && "bg-slate-50 dark:bg-slate-800/60"
                          )}
                        >
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{dept.name}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-mono shrink-0">#{dept.id}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFetchDeptDialog(false)}
              disabled={isFetchingDept}
            >
              {dictionary.map.cancel}
            </Button>
            <Button
              id="dialog-fetch-btn"
              type="button"
              onClick={handleFetchDepartment}
              disabled={isFetchingDept || !fetchDeptInput}
            >
              {isFetchingDept && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {dictionary.map.searchDeptBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
