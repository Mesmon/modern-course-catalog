import { Handle, Position } from '@xyflow/react';
import { BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { useState, useContext, useMemo } from 'react';
import { CourseMapContext } from './DependencyMap';

export function CourseNode({ id, data, selected, xPos, yPos, targetPosition = Position.Left, sourcePosition = Position.Right }: any) {
  const context = useContext(CourseMapContext);
  const isHebrew = data.locale === 'he';
  const [isHovered, setIsHovered] = useState(false);
  
  if (!context) return null;
  const { onRemoveNode, fetchCourseData, updateCourseTerm, dictionary, selectedRelations } = context;

  const uniqueRelatedCourses = useMemo(() => {
    return data.relatedCourses?.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i) || [];
  }, [data.relatedCourses]);

  const filteredCourses = useMemo(() => {
    // If no context relations are found (e.g map just loaded), default to showing all or safe fallback
    const activeRels = selectedRelations || [];
    return uniqueRelatedCourses.filter((rc: any) => activeRels.includes(rc.relation));
  }, [uniqueRelatedCourses, selectedRelations]);

  const allTerms = useMemo(() => {
    const terms: { year: string, semester: string, label: string }[] = [];
    const currentYear = new Date().getFullYear();
    const knownKeys = new Set<string>();

    if (data.offerings && Array.isArray(data.offerings)) {
      data.offerings.forEach((off: any) => {
        terms.push({ year: off.year, semester: off.semester, label: `${off.year}-${off.semester}` });
        knownKeys.add(`${off.year}-${off.semester}`);
      });
    }

    // Always provide the current term as a fallback if it's missing
    const currentKey = `${data.year}-${data.semester}`;
    if (!knownKeys.has(currentKey)) {
        terms.push({
            year: data.year?.toString() || currentYear.toString(),
            semester: data.semester?.toString() || '2',
            label: `${data.year || currentYear}-${data.semester || 2}`
        });
        knownKeys.add(currentKey);
    }

    for (let y = currentYear + 1; y >= currentYear - 3; y--) {
      for (let s = 3; s >= 1; s--) {
        const key = `${y}-${s}`;
        if (!knownKeys.has(key)) {
          terms.push({
            year: y.toString(),
            semester: s.toString(),
            label: key
          });
          knownKeys.add(key);
        }
      }
    }

    terms.sort((a, b) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return Number(b.semester) - Number(a.semester);
    });
    
    return terms;
  }, [data.offerings, data.year, data.semester, isHebrew]);
  
  return (
    <div
      dir={isHebrew ? 'rtl' : 'ltr'}
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 flex flex-col p-3 w-[280px] transition-all relative z-10
        ${selected ? 'ring-primary shadow-md z-50' : 'ring-slate-200 dark:ring-slate-800'}
        ${data.loading ? 'opacity-70 animate-pulse' : ''}
        ${isHovered ? 'shadow-lg z-50 scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={targetPosition}
        className={`w-3 h-3 ring-2 ring-white dark:ring-slate-900 ${targetPosition === Position.Left ? '-left-1.5' : '-top-1.5'} bg-slate-300 dark:bg-slate-700`}
      />
      
      <div className="flex items-center gap-2 mb-2 pr-6">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
            {data.dept}.{data.degree}.{data.courseId}
          </span>
          <span className="font-bold text-sm leading-tight text-slate-800 dark:text-slate-200 text-wrap" title={data.name}>
            {data.name}
          </span>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onRemoveNode?.(id); }}
        className={`absolute top-2 ${isHebrew ? 'left-2' : 'right-2'} p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${isHovered ? 'opacity-100' : ''}`}
        title={dictionary?.map?.removeFromMap || 'Remove'}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {data.stats && (
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{data.stats.points} {dictionary?.course?.points}</span>
          <span className="bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={data.type}>{data.type}</span>
        </div>
      )}

      {/* Hover Card */}
      {isHovered && !data.loading && (
        <div className={`absolute top-[calc(100%-8px)] pt-2 w-64 z-50 nowheel nopan ${isHebrew ? 'right-0' : 'left-0'}`}>
          <div className="bg-slate-900 dark:bg-slate-950 text-white dark:text-slate-200 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">{dictionary?.department?.courseDetails}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
               <span className="text-slate-400">{dictionary?.department?.title}</span>
               <span>{data.dept}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-slate-400">{dictionary?.course?.courseId}</span>
               <span>{data.courseId}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-slate-400">{dictionary?.course?.points}</span>
               <span>{data.stats?.points || '-'}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-slate-400">{dictionary?.course?.activeIn || dictionary?.course?.type}</span>
                 <select
                   value={`${data.year}-${data.semester}`}
                   onChange={(e) => {
                     e.stopPropagation();
                     const [y, s] = e.target.value.split('-');
                     updateCourseTerm?.(data.courseId, data.dept, data.degree, y, s, data.name);
                   }}
                   className="bg-slate-800 dark:bg-slate-800 px-1 py-0.5 mt-0.5 rounded border border-slate-700 dark:border-slate-700 outline-none cursor-pointer hover:bg-slate-700 dark:hover:bg-slate-700 w-full text-xs text-slate-200"
                   title={dictionary?.course?.activeIn || 'Select Term'}
                   onClick={(e) => {
                     e.stopPropagation();
                   }}
                 >
                   {allTerms.map((term: any) => (
                     <option key={`${term.year}-${term.semester}`} value={`${term.year}-${term.semester}`}>
                       {term.label}
                     </option>
                   ))}
                 </select>
            </div>
          </div>
          <div className="mt-2 text-xs bg-white/10 p-2 rounded-lg text-slate-300">
             {data.name}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
            <span className="font-bold text-xs text-slate-300">{dictionary?.map?.relatedCourses}</span>
            {(!filteredCourses || filteredCourses.length === 0) ? (
               <span className="text-[10px] text-slate-400 italic">{dictionary?.map?.noConnections}</span>
            ) : (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {filteredCourses.map((rc: any, idx: number) => (
                  <div 
                    key={`${rc.id}-${idx}`} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      fetchCourseData?.(
                        rc.params.course, rc.params.dept, rc.params.degree, rc.params.year, rc.params.semester, rc.name,
                        { x: xPos || 0, y: yPos || 0 }
                      );
                    }}
                    className="flex items-center justify-between bg-white/5 p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer group"
                    title={dictionary?.map?.addToMap}
                  >
                    <div className="flex flex-col text-[10px] truncate pr-2 pointer-events-none">
                       <span className="font-bold text-white truncate" title={rc.name}>{rc.name}</span>
                       <span className="text-slate-400">{rc.id} • {rc.relation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      <Handle
        type="source"
        position={sourcePosition}
        className={`w-3 h-3 ring-2 ring-white dark:ring-slate-900 ${sourcePosition === Position.Right ? '-right-1.5' : '-bottom-1.5'} bg-primary`}
      />
    </div>
  );
}
