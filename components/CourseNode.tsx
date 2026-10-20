import { Handle, Position } from '@xyflow/react';
import { BookOpen, Trash2, Plus } from 'lucide-react';
import { useState, useContext, useMemo } from 'react';
import { CourseMapContext } from './DependencyMap';
import { cn } from '@/lib/utils';

export function CourseNode({
  id,
  data,
  selected,
  xPos,
  yPos,
  targetPosition = Position.Left,
  sourcePosition = Position.Right,
}: any) {
  const context = useContext(CourseMapContext);
  const isHebrew = data.locale === 'he';
  const [isHovered, setIsHovered] = useState(false);

  if (!context) return null;
  const { onRemoveNode, fetchCourseData, updateCourseTerm, dictionary } = context;

  const uniqueRelatedCourses = useMemo(() => {
    return (
      data.relatedCourses?.filter(
        (v: any, i: number, a: any[]) => a.findIndex((t) => t.id === v.id) === i
      ) || []
    );
  }, [data.relatedCourses]);

  const allTerms = useMemo(() => {
    const terms: { year: string; semester: string; label: string }[] = [];
    const currentYear = Math.max(new Date().getFullYear(), 2026);
    const knownKeys = new Set<string>();

    if (data.offerings && Array.isArray(data.offerings)) {
      data.offerings.forEach((off: any) => {
        terms.push({
          year: off.year,
          semester: off.semester,
          label: `${off.year}-${off.semester}`,
        });
        knownKeys.add(`${off.year}-${off.semester}`);
      });
    }

    const currentKey = `${data.year}-${data.semester}`;
    if (!knownKeys.has(currentKey)) {
      terms.push({
        year: data.year?.toString() || '2027',
        semester: data.semester?.toString() || '1',
        label: `${data.year || 2027}-${data.semester || 1}`,
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
            label: key,
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
  }, [data.offerings, data.year, data.semester]);

  return (
    <div
      dir={isHebrew ? 'rtl' : 'ltr'}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border flex flex-col p-3.5 w-[280px] transition-shadow relative z-10',
        selected
          ? 'border-primary ring-2 ring-primary/20 shadow-md z-40'
          : 'border-slate-200/90 dark:border-slate-800 shadow-xs',
        data.loading && 'opacity-70 animate-pulse',
        isHovered && 'shadow-md border-slate-300 dark:border-slate-700 z-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={targetPosition}
        className={cn(
          'w-2.5 h-2.5 ring-2 ring-white dark:ring-slate-900 bg-slate-400 dark:bg-slate-600',
          targetPosition === Position.Left ? '-left-1.5' : '-top-1.5'
        )}
      />

      <div className="flex items-start gap-2.5 mb-2 pe-7">
        <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {data.dept}.{data.degree}.{data.courseId}
          </span>
          <span
            className="font-semibold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-2"
            title={data.name}
          >
            {data.name}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemoveNode?.(id);
        }}
        className={cn(
          'absolute top-2.5 end-2.5 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-opacity cursor-pointer',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        title={dictionary?.map?.removeFromMap || 'Remove'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {data.stats && (
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
          <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
            {data.stats.points} {dictionary?.course?.points}
          </span>
          {data.type && (
            <span
              className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[140px]"
              title={data.type}
            >
              {data.type}
            </span>
          )}
        </div>
      )}

      {/* Hover Details Popover */}
      {isHovered && !data.loading && (
        <div className="absolute top-full pt-2 w-72 z-50 nowheel nopan start-0">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-muted-foreground font-medium">
                {dictionary?.course?.activeIn || 'Term'}:
              </span>
              <select
                value={`${data.year}-${data.semester}`}
                onChange={(e) => {
                  e.stopPropagation();
                  const [y, s] = e.target.value.split('-');
                  updateCourseTerm?.(data.courseId, data.dept, data.degree, y, s, data.name);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 outline-none cursor-pointer text-xs font-mono font-medium"
                title={dictionary?.course?.activeIn || 'Select Term'}
              >
                {allTerms.map((term: any) => (
                  <option key={`${term.year}-${term.semester}`} value={`${term.year}-${term.semester}`}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                {dictionary?.map?.relatedCourses}
              </span>
              {!uniqueRelatedCourses || uniqueRelatedCourses.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  {dictionary?.map?.noConnections}
                </span>
              ) : (
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pe-1">
                  {uniqueRelatedCourses.map((rc: any, idx: number) => (
                    <button
                      type="button"
                      key={`${rc.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchCourseData?.(
                          rc.params.course,
                          rc.params.dept,
                          rc.params.degree,
                          rc.params.year,
                          rc.params.semester,
                          rc.name,
                          { x: xPos || 0, y: yPos || 0 }
                        );
                      }}
                      className="flex items-center justify-between gap-2 text-start bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors cursor-pointer group/rel"
                      title={dictionary?.map?.addToMap}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                          {rc.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          {rc.id} • {rc.relation}
                        </span>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-slate-400 group-hover/rel:text-primary shrink-0" />
                    </button>
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
        className={cn(
          'w-2.5 h-2.5 ring-2 ring-white dark:ring-slate-900 bg-primary',
          sourcePosition === Position.Right ? '-right-1.5' : '-bottom-1.5'
        )}
      />
    </div>
  );
}
