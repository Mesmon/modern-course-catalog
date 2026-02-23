import { Handle, Position } from '@xyflow/react';
import { BookOpen, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useState, useContext } from 'react';
import { CourseMapContext } from './DependencyMap';

export function CourseNode({ id, data, selected, xPos, yPos }: any) {
  const context = useContext(CourseMapContext);
  const isHebrew = data.locale === 'he';
  const [isHovered, setIsHovered] = useState(false);
  
  if (!context) return null;
  const { onRemoveNode, fetchCourseData, dictionary } = context;
  
  return (
    <div
      dir={isHebrew ? 'rtl' : 'ltr'}
      className={`bg-white rounded-xl shadow-sm ring-1 flex flex-col p-3 min-w-[200px] transition-all relative z-10
        ${selected ? 'ring-primary shadow-md z-50' : 'ring-slate-200'}
        ${data.loading ? 'opacity-70 animate-pulse' : ''}
        ${isHovered ? 'shadow-lg z-50 scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-slate-300 ring-2 ring-white"
      />
      
      <div className="flex items-center gap-2 mb-2 pr-6">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {data.dept}.{data.degree}.{data.courseId}
          </span>
          <span className="font-bold text-sm text-slate-800 truncate" title={data.name}>
            {data.name}
          </span>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onRemoveNode?.(id); }}
        className={`absolute top-2 ${isHebrew ? 'left-2' : 'right-2'} p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${isHovered ? 'opacity-100' : ''}`}
        title={dictionary?.map?.removeFromMap || 'Remove'}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {data.stats && (
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
          <span className="bg-slate-50 px-1.5 py-0.5 rounded">{data.stats.points} {dictionary?.course?.points}</span>
          <span className="bg-slate-50 px-1.5 py-0.5 rounded">{data.type}</span>
        </div>
      )}

      {/* Hover Card */}
      {isHovered && !data.loading && (
        <div className={`absolute top-[calc(100%-8px)] pt-2 w-64 z-50 nowheel nopan ${isHebrew ? 'right-0' : 'left-0'}`}>
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
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
               <span className="text-slate-400">{dictionary?.course?.type}</span>
               <span>{data.type || '-'}</span>
            </div>
          </div>
          <div className="mt-2 text-xs bg-white/10 p-2 rounded-lg text-slate-300">
             {data.name}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
            <span className="font-bold text-xs text-slate-300">{dictionary?.map?.relatedCourses}</span>
            {(!data.relatedCourses || data.relatedCourses.length === 0) ? (
               <span className="text-[10px] text-slate-400 italic">{dictionary?.map?.noConnections}</span>
            ) : (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {data.relatedCourses.map((rc: any, idx: number) => (
                  <div 
                    key={idx} 
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
        position={Position.Bottom}
        className="w-3 h-3 bg-primary ring-2 ring-white"
      />
    </div>
  );
}
