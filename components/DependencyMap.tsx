"use client"

import React, { useState, useCallback, useEffect, createContext } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CourseNode } from './CourseNode';
import { useAllCourses } from '@/hooks/useCourses';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Button } from './ui/button';
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

export const CourseMapContext = createContext<any>(null);

export function DependencyMap({ dictionary, locale }: { dictionary: any, locale: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [open, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRelations, setSelectedRelations] = useState<string[]>(['קורס קדם']);

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
    
    if (savedNodes) setNodes(JSON.parse(savedNodes));
    if (savedEdges) setEdges(JSON.parse(savedEdges));
    if (savedRelations) setSelectedRelations(JSON.parse(savedRelations));
  }, []);

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
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges],
  );

  const fetchCourseData = async (courseId: string, dept: string, degree: string, year: string, semester: string, name: string, sourcePos?: {x: number, y: number}) => {
    // Add pending node
    const newNodeId = courseId;
    if (nodes.some(n => n.id === newNodeId)) return; // Already exists

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
        loading: true,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    
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
                stats: { points: detail.points },
                type: detail.type,
                relatedCourses: detail.relatedCourses,
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
                  
                  const edgeExists = newEdges.some(e => e.source === source && e.target === target);
                  if (!edgeExists) {
                     newEdges.push({
                       id: `e${source}-${target}`,
                       source,
                       target,
                       type: 'smoothstep',
                       animated: true,
                       markerEnd: { type: MarkerType.ArrowClosed },
                       label: rc.relation,
                       style: { stroke: '#94a3b8', strokeWidth: 2 },
                       labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
                       labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.8 },
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

  return (
    <div className="h-full w-full" id="tour-map-area">
      <div className="absolute top-4 z-10 flex gap-2" style={{ [locale === 'he' ? 'right' : 'left']: '16px' }}>
        <Button id="tour-map-add" onClick={() => setOpen(true)} className="bg-white text-slate-800 hover:bg-slate-50 border shadow-sm rounded-xl font-bold gap-2">
            <Plus className="h-4 w-4" />
            {dictionary.map.addCourse}
        </Button>
        {nodes.length > 0 && (
          <Button onClick={() => { setNodes([]); setEdges([]); }} variant="outline" className="bg-white/80 backdrop-blur text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-red-100 shadow-sm rounded-xl font-bold gap-2 transition-all">
            <Trash2 className="h-4 w-4" />
            {dictionary.map.clearMap}
          </Button>
        )}
        {availableRelations.length > 0 && (
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowFilter(!showFilter)} 
              className={`bg-white/80 backdrop-blur shadow-sm rounded-xl font-bold gap-2 transition-all ${showFilter || (selectedRelations.length > 0 && selectedRelations.length !== availableRelations.length) ? 'text-primary border-primary/50 bg-primary/5' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter className="h-4 w-4" />
              {dictionary.map.filterRelations}
            </Button>
            {showFilter && (
              <div className={`absolute top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl p-3 shadow-lg ${locale === 'he' ? 'right-0' : 'left-0'} z-50`}>
                <div className="flex flex-col gap-2 text-start">
                  <span className="text-xs font-bold text-slate-500 mb-1">{dictionary.map.filterRelations}</span>
                  {availableRelations.map(rel => (
                    <label key={rel} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg" dir={locale === 'he' ? 'rtl' : 'ltr'}>
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

      <CourseMapContext.Provider value={{ onRemoveNode, fetchCourseData, dictionary, selectedRelations }}>
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
          <CommandInput placeholder={dictionary.map.searchPlaceholder} className={locale === 'he' ? 'text-right' : 'text-left'} />
        </div>
        <CommandList className={locale === 'he' ? 'text-right' : 'text-left'} dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <p>{dictionary.navbar.noResults}</p>
              <p className="text-sm text-muted-foreground whitespace-normal leading-tight mx-auto max-w-[300px]">
                {dictionary.map.suggestDepartment}
              </p>
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
                className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-slate-50 rounded-lg m-1"
              >
                <div className="flex flex-col gap-1 w-full text-start">
                  <span className="font-bold text-slate-900 text-base">{course.name}</span>
                  <span className="text-sm text-slate-500 font-mono tracking-tight w-fit">{course.id}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
