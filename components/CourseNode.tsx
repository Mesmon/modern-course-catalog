import { Handle, Position } from '@xyflow/react';
import { BookOpen, Trash2, Plus, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useContext, useMemo } from 'react';
import { CourseMapContext } from './DependencyMap';
import { getAvailableAcademicYears, MIN_ACADEMIC_YEAR } from '@/lib/schedule';
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
  const {
    onRemoveNode,
    fetchCourseData,
    updateCourseTerm,
    dictionary,
    existingNodeIds,
    hoveredNodeId,
    setHoveredNodeId,
    connectedNodeIds,
  } = context;

  const isDimmed =
    hoveredNodeId &&
    hoveredNodeId !== id &&
    connectedNodeIds &&
    !connectedNodeIds.has(id);

  const isHighlighted =
    hoveredNodeId &&
    hoveredNodeId !== id &&
    connectedNodeIds &&
    connectedNodeIds.has(id);

  const { prerequisites, unlocks } = useMemo(() => {
    const unique = (
      data.relatedCourses?.filter(
        (v: any, i: number, a: any[]) => a.findIndex((t) => t.id === v.id) === i
      ) || []
    );
    const prereqs: any[] = [];
    const nextCourses: any[] = [];

    unique.forEach((rc: any) => {
      const rel = String(rc.relation || '');
      const isBlocked =
        Boolean(rc.isBlockedCourse) ||
        rel.includes('Blocks') ||
        rel.includes('חוסם') ||
        rel.includes('דרישת קדם עבור');

      if (isBlocked) {
        nextCourses.push(rc);
      } else {
        prereqs.push(rc);
      }
    });

    return { prerequisites: prereqs, unlocks: nextCourses };
  }, [data.relatedCourses]);

  const allTerms = useMemo(() => {
    const terms: { year: string; semester: string; label: string }[] = [];
    const availableYears = getAvailableAcademicYears();
    const knownKeys = new Set<string>();

    if (data.offerings && Array.isArray(data.offerings)) {
      data.offerings.forEach((off: any) => {
        if (Number(off.year) < MIN_ACADEMIC_YEAR) return;
        terms.push({
          year: off.year,
          semester: off.semester,
          label: `${off.year}-${off.semester}`,
        });
        knownKeys.add(`${off.year}-${off.semester}`);
      });
    }

    const safeDataYear =
      Number(data.year) >= MIN_ACADEMIC_YEAR ? String(data.year) : String(MIN_ACADEMIC_YEAR);
    const currentKey = `${safeDataYear}-${data.semester || 1}`;
    if (!knownKeys.has(currentKey)) {
      terms.push({
        year: safeDataYear,
        semester: data.semester?.toString() || '1',
        label: currentKey,
      });
      knownKeys.add(currentKey);
    }

    for (const yr of availableYears) {
      for (let s = 3; s >= 1; s--) {
        const key = `${yr}-${s}`;
        if (!knownKeys.has(key)) {
          terms.push({
            year: yr,
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

  const renderCourseButton = (rc: any, idx: number) => {
    const targetCourseId = rc.params?.course || rc.id?.split('.')?.[2] || rc.id;
    const isAdded = existingNodeIds?.has(targetCourseId);

    return (
      <button
        type="button"
        key={`${rc.id}-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isAdded) return;
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
        className={cn(
          'flex items-center justify-between gap-2 text-start p-2 rounded-lg transition-colors',
          isAdded
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 cursor-default'
            : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group/rel'
        )}
        title={isAdded ? (isHebrew ? 'כבר במפה' : 'Already on map') : dictionary?.map?.addToMap}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
            {rc.name}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            {rc.id} • {rc.cleanRelation || rc.relation}
          </span>
        </div>
        {isAdded ? (
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <Plus className="h-3.5 w-3.5 text-slate-400 group-hover/rel:text-primary shrink-0" />
        )}
      </button>
    );
  };

  const showDetails = isHovered || selected;

  return (
    <div
      dir={isHebrew ? 'rtl' : 'ltr'}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border flex flex-col p-3.5 w-[250px] sm:w-[270px] transition-all duration-200 relative z-10',
        selected
          ? 'border-primary ring-2 ring-primary/20 shadow-lg z-50'
          : isHighlighted
          ? 'border-primary/70 ring-2 ring-primary/15 shadow-md z-30'
          : 'border-slate-200/90 dark:border-slate-800 shadow-xs',
        data.loading && 'border-primary/70 ring-2 ring-primary/15',
        isHovered && 'shadow-lg border-primary/60 dark:border-primary/60 z-50',
        isDimmed && 'opacity-40'
      )}
      onMouseEnter={() => {
        setIsHovered(true);
        setHoveredNodeId?.(id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredNodeId?.(null);
      }}
    >
      {/* Target Handle (Left side - incoming prerequisites) */}
      <Handle
        type="target"
        position={targetPosition}
        style={{ left: -5 }}
        className="w-2.5 h-2.5 !bg-orange-600 ring-2 ring-white dark:ring-slate-900 border-0"
      />

      <div className="flex items-start gap-2.5 mb-2 pe-7">
        <div className="h-7 w-7 rounded-md bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-center text-orange-700 dark:text-orange-400 shrink-0 mt-0.5">
          {data.loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <BookOpen className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/60"
              dir="ltr"
            >
              {data.dept}.{data.degree}.{data.courseId}
            </span>
            {typeof data.stage === 'number' && !data.loading && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                {isHebrew ? `שלב ${data.stage + 1}` : `Stage ${data.stage + 1}`}
              </span>
            )}
          </div>
          <span
            className="font-bold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-2 mt-1"
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
          'nodrag nopan absolute top-2.5 end-2.5 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-opacity cursor-pointer',
          showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none sm:pointer-events-auto'
        )}
        title={dictionary?.map?.removeFromMap || 'Remove'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {data.loading ? (
        <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-primary font-semibold">
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>{isHebrew ? 'טוען קשרי קדם...' : 'Loading prerequisites...'}</span>
          </span>
          <span className="h-2 w-12 rounded bg-orange-100 dark:bg-orange-950/60 animate-pulse" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1.5 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            {data.stats?.points && (
              <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
                {data.stats.points} {dictionary?.course?.points}
              </span>
            )}
            {data.type && (
              <span
                className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[115px]"
                title={data.type}
              >
                {data.type}
              </span>
            )}
          </div>

          {(prerequisites.length > 0 || unlocks.length > 0) && (
            <div className="flex items-center gap-1 text-[10px] font-mono shrink-0" dir="ltr">
              {prerequisites.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/60 font-bold"
                  title={isHebrew ? 'קורסי קדם' : 'Prerequisites'}
                >
                  {prerequisites.length}→
                </span>
              )}
              {unlocks.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 font-bold"
                  title={isHebrew ? 'פותח קורסים' : 'Unlocks'}
                >
                  →{unlocks.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hover / Tap Details Popover */}
      {showDetails && !data.loading && (
        <div
          className="absolute top-full pt-2 w-[250px] sm:w-72 z-50 nowheel nopan nodrag start-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-3.5 rounded-lg shadow-xl flex flex-col gap-2.5">
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

            {prerequisites.length === 0 && unlocks.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {dictionary?.map?.noConnections}
              </span>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pe-1 overscroll-contain">
                {prerequisites.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[11px] text-orange-700 dark:text-orange-400 flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3 shrink-0" />
                      {isHebrew ? 'קורסי קדם / צמודים (משמאל)' : 'Prerequisites (Left)'}
                    </span>
                    {prerequisites.map((rc, idx) => renderCourseButton(rc, idx))}
                  </div>
                )}

                {unlocks.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      {isHebrew ? 'פותח קורסים (לימין)' : 'Unlocks Courses (Right)'}
                    </span>
                    {unlocks.map((rc, idx) => renderCourseButton(rc, idx))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Handle (Right side - outgoing to dependent courses) */}
      <Handle
        type="source"
        position={sourcePosition}
        style={{ right: -5 }}
        className="w-2.5 h-2.5 !bg-primary ring-2 ring-white dark:ring-slate-900 border-0"
      />
    </div>
  );
}

