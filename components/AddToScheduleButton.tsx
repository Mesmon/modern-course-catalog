'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, CalendarCheck } from 'lucide-react';
import { CourseGroup } from '@/types/course';
import {
  loadScheduledCourses,
  upsertScheduledCourse,
  removeScheduledCourse,
  SCHEDULE_EVENT,
  ScheduledCourse,
} from '@/lib/schedule';
import { GroupSelectorDialog } from '@/components/GroupSelectorDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddToScheduleButtonProps {
  courseId: string;
  dept: string;
  degree: string;
  year: string;
  semester: string;
  name: string;
  points: string;
  groups: CourseGroup[];
  dictionary: any;
  locale: string;
  variant?: 'default' | 'outline' | 'mobile';
  className?: string;
}

export function AddToScheduleButton({
  courseId,
  dept,
  degree,
  year,
  semester,
  name,
  points,
  groups,
  dictionary,
  locale,
  variant = 'default',
  className,
}: AddToScheduleButtonProps) {
  const fullId = `${dept}.${degree}.${courseId}`;
  const [open, setOpen] = useState(false);
  const [existingEntry, setExistingEntry] = useState<ScheduledCourse | undefined>(undefined);

  useEffect(() => {
    const sync = () => {
      const list = loadScheduledCourses();
      setExistingEntry(list.find(c => c.id === fullId));
    };
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [fullId]);

  const handleClick = () => {
    // If the course has at most 1 group total and isn't scheduled yet, we can still open the dialog
    // if it has multiple groups, or add directly if there's only 0 or 1 group and not yet in schedule
    if (!existingEntry && (!groups || groups.length <= 1)) {
      upsertScheduledCourse({
        id: fullId,
        courseId,
        dept,
        degree,
        year,
        semester,
        name,
        points,
        selectedGroups: groups || [],
        allGroups: groups || [],
      });
      toast.success(dictionary.schedule.addedToast);
      return;
    }
    setOpen(true);
  };

  const handleConfirm = (selectedGroups: CourseGroup[]) => {
    const wasScheduled = !!existingEntry;
    upsertScheduledCourse({
      id: fullId,
      courseId,
      dept,
      degree,
      year,
      semester,
      name,
      points,
      selectedGroups,
      allGroups: groups || [],
    });
    toast.success(wasScheduled ? dictionary.schedule.updatedToast : dictionary.schedule.addedToast);
  };

  const handleRemove = () => {
    removeScheduledCourse(fullId);
    toast.info(dictionary.schedule.removedToast);
  };

  const isScheduled = !!existingEntry;

  return (
    <>
      <Button
        type="button"
        variant={variant === 'outline' ? 'outline' : 'default'}
        onClick={handleClick}
        className={cn(
          'font-bold gap-2 transition-all',
          isScheduled && variant === 'outline' && 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
          isScheduled && variant !== 'outline' && 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
          className
        )}
      >
        {isScheduled ? (
          <>
            <CalendarCheck className="h-4 w-4" />
            <span>{dictionary.schedule.inSchedule}</span>
          </>
        ) : (
          <>
            <CalendarPlus className="h-4 w-4" />
            <span>{dictionary.schedule.addToSchedule}</span>
          </>
        )}
      </Button>

      <GroupSelectorDialog
        open={open}
        onOpenChange={setOpen}
        courseName={name}
        courseId={fullId}
        groups={groups || []}
        initialSelectedGroupIds={existingEntry?.selectedGroups?.map(g => g.id)}
        isAlreadyScheduled={isScheduled}
        onConfirm={handleConfirm}
        onRemove={handleRemove}
        dictionary={dictionary}
        locale={locale}
      />
    </>
  );
}
