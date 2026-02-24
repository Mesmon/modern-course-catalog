"use client"

import React, { useState, useCallback, useEffect, createContext, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, MarkerType, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CourseNode } from './CourseNode';
import { useAllCourses } from '@/hooks/useCourses';
import { Plus, Trash2, Filter, Loader2, Workflow } from 'lucide-react';
import { Button } from './ui/button';

const nodeWidth = 320;
const nodeHeight = 150;
const columnGap = 200; // Increased to give edges more breathing room
const rowGap = 150;    // Increased drastically to spread nodes vertically

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // 1. Group nodes by Term (Year + Semester)
  const columns: Record<string, Node[]> = {};
  
  nodes.forEach(node => {
    const year = node.data.year || 2026;
    const sem = node.data.semester || 2;
    const termKey = `${year}-${sem}`;
    
    if (!columns[termKey]) columns[termKey] = [];
    columns[termKey].push(node);
  });

  // 2. Sort columns chronologically (Left to Right)
  const sortedTermKeys = Object.keys(columns).sort((a, b) => {
    const [yearA, semA] = a.split('-').map(Number);
    const [yearB, semB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return semA - semB;
  });

  // 3. Barycenter Heuristic (Iterative intersection reduction)
  // Initially position them alphabetically
  const nodePositions = new Map<string, { x: number, y: number }>();
  let currentX = 0;
  
  sortedTermKeys.forEach((termKey) => {
    const colNodes = columns[termKey];
    colNodes.sort((a, b) => (a.data.name as string).localeCompare(b.data.name as string));
    
    let currentY = 0;
    colNodes.forEach((node) => {
      nodePositions.set(node.id, { x: currentX, y: currentY });
      currentY += nodeHeight + rowGap;
    });
    currentX += nodeWidth + columnGap;
  });

  // Run a few passes of the Barycenter algorithm to refine Y coordinates
  // For each node, calculate the average Y position of all its connected neighbors
  const iterations = 4;
  for (let i = 0; i < iterations; i++) {
    // Process columns alternating left-to-right, then right-to-left
    const keys = i % 2 === 0 ? sortedTermKeys : [...sortedTermKeys].reverse();
    
    keys.forEach((termKey) => {
       const colNodes = columns[termKey];
       
       const barycenters = new Map<string, number>();
       
       colNodes.forEach(node => {
          // Find all connected edges
          const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
          
          if (connectedEdges.length === 0) {
              barycenters.set(node.id, nodePositions.get(node.id)!.y);
              return;
          }
          
          let sumY = 0;
          let weight = 0;
          
          connectedEdges.forEach(e => {
              const neighborId = e.source === node.id ? e.target : e.source;
              const neighborPos = nodePositions.get(neighborId);
              if (neighborPos) {
                 sumY += neighborPos.y;
                 weight += 1;
              }
          });
          
          barycenters.set(node.id, sumY / weight);
       });
       
       // Sort this column based on the computed barycenter average
       colNodes.sort((a, b) => (barycenters.get(a.id) || 0) - (barycenters.get(b.id) || 0));
    });
  }

  // 4. To ensure vertical spread and horizontal alignment across sparse columns,
  // we find the maximum number of nodes in any column, and distribute nodes 
  // evenly using a fixed grid structure vertically.
  let maxNodesInCol = 0;
  Object.values(columns).forEach(col => {
    if (col.length > maxNodesInCol) maxNodesInCol = col.length;
  });

  const totalHeight = maxNodesInCol * (nodeHeight + rowGap);

  sortedTermKeys.forEach((termKey) => {
    const colNodes = columns[termKey];
    const colCount = colNodes.length;
    
    // Spread nodes evenly across the available total height
    const spreadGap = colCount > 1 ? (totalHeight - (colCount * nodeHeight)) / (colCount - 1) : 0;
    
    let currentY = colCount === 1 ? (totalHeight / 2) - (nodeHeight / 2) : 0;
    
    colNodes.forEach((node) => {
       const pos = nodePositions.get(node.id)!;
       nodePositions.set(node.id, { x: pos.x, y: currentY });
       currentY += nodeHeight + spreadGap;
    });
  });

  // 4. Apply final calculated matrix to Node array
  const newNodes = nodes.map(n => ({...n})); // Clone
  
  newNodes.forEach(node => {
    const pos = nodePositions.get(node.id);
    if (pos) {
      node.targetPosition = Position.Left;
      node.sourcePosition = Position.Right;
      node.position = { x: pos.x, y: pos.y };
    }
  });

  return { nodes: newNodes, edges };
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
  const [selectedRelations, setSelectedRelations] = useState<string[]>(['קורס קדם']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingDept, setIsFetchingDept] = useState(false);
  const [showFetchDeptDialog, setShowFetchDeptDialog] = useState(false);
  const [fetchDeptInput, setFetchDeptInput] = useState('');
  
  // Autocomplete state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestContainerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: courses = [] } = useAllCourses();

  const availableRelations = React.useMemo(() => {
    const relations = new Set<string>();
    nodes.forEach(n => {
      if (n.data && Array.isArray((n.data as any).relatedCourses)) {
        (n.data as any).relatedCourses.forEach((rc: any) => {
          if (rc.relation) relations.add(rc.relation);
        });
      }
    });
    return Array.from(relations);
  }, [nodes]);

  const filteredEdges = React.useMemo(() => {
    if (!selectedRelations || selectedRelations.length === 0) return [];
    return edges.filter(e => {
      if (!e.label) return true;
      return selectedRelations.includes(e.label as string);
    });
  }, [edges, selectedRelations]);

  // Load from local storage on mount
  useEffect(() => {
    const savedNodes = localStorage.getItem('dependencyMapNodes');
    const savedEdges = localStorage.getItem('dependencyMapEdges');
    const savedRelations = localStorage.getItem('dependencyMapRelations');
    
    let initialNodes = [];
    let initialEdges = [];
    
    if (savedNodes) initialNodes = JSON.parse(savedNodes);
    if (savedEdges) {
      // Re-apply bezier and colors to cached edges
      initialEdges = JSON.parse(savedEdges).map((e: any) => {
        const isPreReq = e.label?.includes('קדם') || e.label?.includes('prerequisite') || false;
        const isCoreq = e.label?.includes('צמוד') || e.label?.includes('corequisite') || false;
        const strokeColor = isPreReq ? '#ef4444' : isCoreq ? '#eab308' : '#3b82f6';
        
        return {
          ...e,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
          style: { stroke: strokeColor, strokeWidth: 3 },
        };
      });
    }
    if (savedRelations) setSelectedRelations(JSON.parse(savedRelations));
    
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, []);

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
        // Wait a tick for state to update, then trigger fetch
        setTimeout(() => document.getElementById('dialog-fetch-btn')?.click(), 0);
      } else if (fetchDeptInput) {
        handleFetchDepartment();
      }
    } else if (e.key === 'Escape') {
      setIsSuggestOpen(false);
    }
  };

  // Save to local storage on change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem('dependencyMapNodes', JSON.stringify(nodes));
      localStorage.setItem('dependencyMapEdges', JSON.stringify(edges));
      localStorage.setItem('dependencyMapRelations', JSON.stringify(selectedRelations));
    } else if (nodes.length === 0 && edges.length === 0) {
      localStorage.removeItem('dependencyMapNodes');
      localStorage.removeItem('dependencyMapEdges');
      // Keep relations preference even if map is cleared
    }
  }, [nodes, edges, selectedRelations]);

  const onRemoveNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    // edges connected to removed nodes are automatically handled by React Flow if we were to delete via standard methods, 
    // but manually filtering them from state is safer when building controlled components:
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'default', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, style: { stroke: '#3b82f6', strokeWidth: 3 } } as any, eds)),
    [setEdges],
  );

  const fetchCourseData = async (courseId: string, dept: string, degree: string, year: string, semester: string, name: string, sourcePos?: {x: number, y: number}, forceUpdate = false) => {
    // Add pending node
    const newNodeId = courseId;
    if (!forceUpdate && nodes.some(n => n.id === newNodeId)) return; // Already exists

    if (!forceUpdate) {
      const getNewPosition = () => {
        if (sourcePos) {
          // Place relative to source: slight random X offset, fixed Y offset (below)
          return { 
            x: sourcePos.x + (Math.random() * 200 - 100), 
            y: sourcePos.y + 200 
          };
        }
        return { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 };
      };

      const newNode = {
        id: newNodeId,
        type: 'course',
        position: getNewPosition(),
        data: {
          id: newNodeId,
          courseId, dept, degree, name, locale,
          year: Number(year), semester: Number(semester),
          loading: true,
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
    }
    
    try {
      const res = await fetch(`/api/courses/${courseId}?dept=${dept}&degree=${degree}&year=${year}&semester=${semester}`);
      if (res.ok) {
        const detail = await res.json();
        
        // Update node with detail
        setNodes((nds) => nds.map(n => {
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
                relatedCourses: detail.relatedCourses,
                offerings: detail.offerings || [],
              }
            };
          }
          return n;
        }));

        // Add edges based on relatedCourses
        if (detail.relatedCourses && detail.relatedCourses.length > 0) {
          setEdges((eds) => {
             const newEdges = [...eds];
             // In state update, we need latest nodes to check 'nds.some' ideally
             // Best effort here referencing closure nodes
             detail.relatedCourses.forEach((rc: any) => {
               const targetId = rc.params.course;
               
               // We will use a state updater callback to have latest nodes and edges
               // Actually we're already in a state updater callback for edges, but we need nodes.
               // It's safer to just let the user add dependencies manually, or just add all edges where source/target are present.
             });
             return newEdges;
          });

          // A better way to do dynamic edges is to use a separate effect that runs when nodes change
          // For now let's just use `setEdges` with full function body
          setNodes(latestNodes => {
            setEdges(latestEdges => {
              const newEdges = [...latestEdges];
              detail.relatedCourses.forEach((rc: any) => {
                const targetId = rc.params.course;
                if (latestNodes.some(n => n.id === targetId || n.id === newNodeId)) {
                  const isPreReq = rc.relation.includes('קדם') || rc.relation.includes('prerequisite');
                  const source = isPreReq ? targetId : newNodeId;
                  const target = isPreReq ? newNodeId : targetId;
                  
                  const isCoreq = rc.relation.includes('צמוד') || rc.relation.includes('corequisite');
                  const strokeColor = isPreReq ? '#ef4444' : isCoreq ? '#eab308' : '#3b82f6';
                  
                  const edgeExists = newEdges.some(e => e.source === source && e.target === target);
                  if (!edgeExists) {
                     newEdges.push({
                       id: `e${source}-${target}`,
                       source,
                       target,
                       type: 'default',
                       animated: isPreReq ? true : false,
                       markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
                       label: rc.relation,
                       style: { stroke: strokeColor, strokeWidth: 3 },
                       labelStyle: { fill: strokeColor, fontWeight: 800, fontSize: 11 },
                       labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: strokeColor, strokeWidth: 1, rx: 4, ry: 4 },
                     });
                  }
                }
              });
              return newEdges;
            });
            return latestNodes;
          });
        }

      } else {
        setNodes((nds) => nds.map(n => n.id === newNodeId ? { ...n, data: { ...n.data, loading: false } } : n));
      }
    } catch (e) {
      console.error(e);
      setNodes((nds) => nds.map(n => n.id === newNodeId ? { ...n, data: { ...n.data, loading: false } } : n));
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
          // Invalidate the 'courses' query so useAllCourses refetches
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
    setNodes((nds) => nds.map(n => n.id === courseId ? { ...n, data: { ...n.data, loading: true } } : n));
    fetchCourseData(courseId, dept, degree, year, semester, name, undefined, true);
  }, [setNodes]);

  return (
    <div className="h-full w-full" id="tour-map-area">
      <div className="absolute top-4 z-10 flex gap-2" style={{ [locale === 'he' ? 'right' : 'left']: '16px' }}>
        <Button id="tour-map-add" onClick={() => setOpen(true)} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border dark:border-slate-800 shadow-sm rounded-xl font-bold gap-2">
            <Plus className="h-4 w-4" />
            {dictionary.map.addCourse}
        </Button>
        {nodes.length > 0 && (
          <Button onClick={() => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
          }} variant="outline" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm rounded-xl font-bold gap-2 transition-all border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Workflow className="h-4 w-4" />
            {dictionary.map.chronologicalLayout || 'Chronological Layout'}
          </Button>
        )}
        {nodes.length > 0 && (
          <Button onClick={() => { setNodes([]); setEdges([]); }} variant="outline" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 border-red-100 dark:border-red-900/50 shadow-sm rounded-xl font-bold gap-2 transition-all">
            <Trash2 className="h-4 w-4" />
            {dictionary.map.clearMap}
          </Button>
        )}
        {availableRelations.length > 0 && (
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowFilter(!showFilter)} 
              className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm rounded-xl font-bold gap-2 transition-all border-slate-200 dark:border-slate-800 ${showFilter || (selectedRelations.length > 0 && selectedRelations.length !== availableRelations.length) ? 'text-primary border-primary/50 bg-primary/5 dark:bg-primary/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Filter className="h-4 w-4" />
              {dictionary.map.filterRelations}
            </Button>
            {showFilter && (
              <div className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg ${locale === 'he' ? 'right-0' : 'left-0'} z-50`}>
                <div className="flex flex-col gap-2 text-start">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{dictionary.map.filterRelations}</span>
                  {availableRelations.map(rel => (
                    <label key={rel} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg" dir={locale === 'he' ? 'rtl' : 'ltr'}>
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

      <CourseMapContext.Provider value={{ onRemoveNode, fetchCourseData, updateCourseTerm, dictionary, selectedRelations }}>
        <ReactFlow
          nodes={nodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap zoomable pannable 
                   nodeColor={(n) => n.selected ? '#3b82f6' : '#cbd5e1'} 
                   maskColor="rgba(241, 245, 249, 0.7)" />
          <Background color="#cbd5e1" gap={16} />
        </ReactFlow>
      </CourseMapContext.Provider>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div id="tour-map-search">
          <CommandInput 
            placeholder={dictionary.map.searchPlaceholder} 
            className={locale === 'he' ? 'text-right' : 'text-left'} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>
        <CommandList className={locale === 'he' ? 'text-right' : 'text-left'} dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
              <p className="font-bold text-slate-700 dark:text-slate-300">{dictionary.navbar.noResults}</p>
              <p className="text-sm text-muted-foreground whitespace-normal leading-tight mx-auto max-w-[300px]">
                {dictionary.map.suggestDepartment}
              </p>
              {searchQuery && (
                 <Button 
                   onClick={() => setShowFetchDeptDialog(true)} 
                   className="mt-2"
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
                  const year = (course as any).params?.year || '2026'
                  const semester = (course as any).params?.semester || '2'
                  
                  fetchCourseData(cId, dept, degree, year, semester, course.name);
                }}
                className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg m-1"
              >
                <div className="flex flex-col gap-1 w-full text-start">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{course.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono tracking-tight w-fit">{course.id}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={showFetchDeptDialog} onOpenChange={setShowFetchDeptDialog}>
        <DialogContent className={`sm:max-w-md ${locale === 'he' ? 'text-right' : 'text-left'}`} dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <DialogHeader className={locale === 'he' ? 'text-right' : 'text-left'}>
            <DialogTitle>{dictionary.map.fetchDeptTitle}</DialogTitle>
            <DialogDescription>
              {dictionary.map.fetchDeptDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4" ref={suggestContainerRef}>
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
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-4 w-4",
                    locale === 'he' ? 'left-3' : 'right-3'
                )}>
                  <Loader2 className="h-full w-full animate-spin text-primary/50" />
                </div>
              )}
              {isSuggestOpen && filteredDepartments.length > 0 && (
                <div className="absolute top-full z-[100] w-full mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <ul className="max-h-[200px] overflow-auto py-2">
                    {filteredDepartments.map((dept, index) => (
                      <li key={dept.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFetchDeptInput(dept.id);
                            setIsSuggestOpen(false);
                            // Auto-fetch if wanted, or just populate input. Opting to populate for consistency.
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors group",
                            selectedIndex === index && "bg-primary/5",
                            locale === 'he' ? 'flex-row text-right' : 'flex-row-reverse text-left'
                          )}
                        >
                          <span className="text-slate-400 dark:text-slate-500 text-sm font-medium group-hover:text-primary transition-colors">#{dept.id}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{dept.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className={`sm:justify-end gap-2 mt-4 ${locale === 'he' ? 'flex-row-reverse sm:space-x-reverse' : ''}`}>
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
              {isFetchingDept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dictionary.map.searchDeptBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
