'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, CalendarCheck } from 'lucide-react';
import { CourseGroup } from '@/types/course';
import {
  loadScheduledCourses,
  upsertScheduledCourse,
  removeScheduledCourse,
  saveActiveTerm,
  SCHEDULE_EVENT,
  SCHEDULE_CLOUD_HYDRATED_EVENT,
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
      setExistingEntry(
        list.find(
          c =>
            c.id === fullId &&
            String(c.year) === String(year) &&
            String(c.semester) === String(semester)
        )
      );
    };
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener(SCHEDULE_CLOUD_HYDRATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener(SCHEDULE_CLOUD_HYDRATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [fullId, year, semester]);

  const handleClick = () => {
    if (!existingEntry && (!groups || groups.length <= 1)) {
      saveActiveTerm({ year, semester });
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
    saveActiveTerm({ year, semester });
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
    removeScheduledCourse(fullId, year, semester);
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
          'font-medium gap-1.5 transition-all cursor-pointer',
          isScheduled && variant === 'outline' && 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
          isScheduled && variant !== 'outline' && 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
          className
        )}
      >
        {isScheduled ? (
          <>
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>{dictionary.schedule.inSchedule}</span>
          </>
        ) : (
          <>
            <CalendarPlus className="h-3.5 w-3.5" />
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
