'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseGroup } from '@/types/course';
import { Clock, MapPin, User, Check, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  courseId: string;
  groups: CourseGroup[];
  initialSelectedGroupIds?: string[];
  isAlreadyScheduled?: boolean;
  onConfirm: (selectedGroups: CourseGroup[]) => void;
  onRemove?: () => void;
  dictionary: any;
  locale: string;
}

export function GroupSelectorDialog({
  open,
  onOpenChange,
  courseName,
  courseId,
  groups,
  initialSelectedGroupIds,
  isAlreadyScheduled = false,
  onConfirm,
  onRemove,
  dictionary,
  locale,
}: GroupSelectorDialogProps) {
  const isRtl = locale === 'he';

  // Group by type (e.g., 'שעור', 'תרגיל', 'מעבדה')
  const groupedByType = useMemo(() => {
    const map: Record<string, CourseGroup[]> = {};
    (groups || []).forEach(g => {
      const t = g.type || dictionary.course.type || 'Group';
      if (!map[t]) map[t] = [];
      map[t].push(g);
    });
    return map;
  }, [groups, dictionary]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    if (initialSelectedGroupIds && initialSelectedGroupIds.length > 0) {
      setSelectedIds(new Set(initialSelectedGroupIds));
    } else {
      // Auto-select the first group with meetings (or first group) of each type
      const defaults = new Set<string>();
      Object.values(groupedByType).forEach(typeGroups => {
        const withMeetings = typeGroups.find(g => g.meetings && g.meetings.length > 0);
        if (withMeetings) {
          defaults.add(withMeetings.id);
        } else if (typeGroups[0]) {
          defaults.add(typeGroups[0].id);
        }
      });
      setSelectedIds(defaults);
    }
  }, [open, initialSelectedGroupIds, groupedByType]);

  const toggleGroup = (group: CourseGroup, typeGroups: CourseGroup[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(group.id)) {
        next.delete(group.id);
      } else {
        // If another group of the same type was selected, replace it for convenience,
        // unless there's only 1 group or the user wants to switch between groups of that type
        typeGroups.forEach(tg => next.delete(tg.id));
        next.add(group.id);
      }
      return next;
    });
  };

  const handleSave = () => {
    const selected = (groups || []).filter(g => selectedIds.has(g.id));
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('sm:max-w-2xl max-h-[85vh] flex flex-col', isRtl ? 'text-right' : 'text-left')}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold">
            <Calendar className="h-4 w-4" />
            <span>{courseId}</span>
          </div>
          <DialogTitle className="text-2xl font-black">{courseName}</DialogTitle>
          <DialogDescription>
            {dictionary.schedule.selectGroupsDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-6 pr-1">
          {(!groups || groups.length === 0) ? (
            <div className="py-10 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
              {dictionary.schedule.noGroupsAvailable}
            </div>
          ) : (
            Object.entries(groupedByType).map(([type, typeGroups]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {type} ({typeGroups.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {typeGroups.map(group => {
                    const isSelected = selectedIds.has(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => toggleGroup(group, typeGroups)}
                        className={cn(
                          'cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2 relative select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 dark:bg-primary/15 ring-2 ring-primary/30 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={isSelected ? 'default' : 'secondary'} className="font-bold text-xs">
                              {dictionary.schedule.group} {group.id}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {group.type}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'h-5 w-5 rounded-full flex items-center justify-center border transition-colors shrink-0',
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-slate-300 dark:border-slate-700'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>

                        {group.lecturer && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{group.lecturer}</span>
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          {group.meetings && group.meetings.length > 0 ? (
                            group.meetings.map((m, idx) => (
                              <div key={idx} className="text-xs space-y-0.5">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span>
                                    {dictionary.schedule.days[m.day] || `יום ${m.day}`} •{' '}
                                    <span dir="ltr" className="inline-block font-mono">
                                      {m.startTime} - {m.endTime}
                                    </span>
                                  </span>
                                </div>
                                {m.location && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 ps-5">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{m.location}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{dictionary.schedule.noMeetings}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className={cn('gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 sm:justify-between', isRtl && 'flex-row-reverse')}>
          <div>
            {isAlreadyScheduled && onRemove && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onRemove();
                  onOpenChange(false);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 gap-2 font-bold"
              >
                <Trash2 className="h-4 w-4" />
                {dictionary.schedule.removeFromSchedule}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.schedule.cancel}
            </Button>
            <Button type="button" onClick={handleSave} className="font-bold gap-2">
              <Check className="h-4 w-4" />
              {dictionary.schedule.saveSelection}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
