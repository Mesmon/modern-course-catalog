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
import { Clock, MapPin, User, Check, Trash2 } from 'lucide-react';
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

  const groupedByType = useMemo(() => {
    const map: Record<string, CourseGroup[]> = {};
    (groups || []).forEach((g) => {
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
      const defaults = new Set<string>();
      Object.values(groupedByType).forEach((typeGroups) => {
        const withMeetings = typeGroups.find((g) => g.meetings && g.meetings.length > 0);
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(group.id)) {
        next.delete(group.id);
      } else {
        typeGroups.forEach((tg) => next.delete(tg.id));
        next.add(group.id);
      }
      return next;
    });
  };

  const handleSave = () => {
    const selected = (groups || []).filter((g) => selectedIds.has(g.id));
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] flex flex-col gap-4"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {courseId}
          </span>
          <DialogTitle className="text-xl font-semibold">{courseName}</DialogTitle>
          <DialogDescription>{dictionary.schedule.selectGroupsDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-1 space-y-5 pe-1">
          {!groups || groups.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
              {dictionary.schedule.noGroupsAvailable}
            </div>
          ) : (
            Object.entries(groupedByType).map(([type, typeGroups]) => (
              <div key={type} className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <h4 className="font-semibold text-xs text-muted-foreground">
                    {type} ({typeGroups.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {typeGroups.map((group) => {
                    const isSelected = selectedIds.has(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => toggleGroup(group, typeGroups)}
                        className={cn(
                          'cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 relative select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/30'
                            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isSelected ? 'default' : 'secondary'}
                              className="font-medium text-xs"
                            >
                              {dictionary.schedule.group} {group.id}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {group.type}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'h-4 w-4 rounded-full flex items-center justify-center border transition-colors shrink-0 mt-0.5',
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-slate-300 dark:border-slate-700'
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>

                        {group.lecturer && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{group.lecturer}</span>
                          </div>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          {group.meetings && group.meetings.length > 0 ? (
                            group.meetings.map((m, idx) => (
                              <div key={idx} className="text-xs space-y-0.5">
                                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>
                                    {dictionary.schedule.days[m.day] || `יום ${m.day}`} •{' '}
                                    <span dir="ltr" className="inline-block font-mono">
                                      {m.startTime} - {m.endTime}
                                    </span>
                                  </span>
                                </div>
                                {m.location && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ps-4">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{m.location}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
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

        <DialogFooter className="gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 sm:justify-between">
          <div>
            {isAlreadyScheduled && onRemove && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onRemove();
                  onOpenChange(false);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 gap-1.5 font-medium h-9 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{dictionary.schedule.removeFromSchedule}</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg font-medium"
            >
              {dictionary.schedule.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-9 rounded-lg font-medium gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{dictionary.schedule.saveSelection}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
