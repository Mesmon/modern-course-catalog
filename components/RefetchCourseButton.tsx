'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RefetchCourseButtonProps {
  courseId: string;
  dept: string;
  degree: string;
  year: string;
  semester: string;
  label: string;
  loadingLabel: string;
  successMessage: string;
  errorMessage: string;
}

export function RefetchCourseButton({
  courseId,
  dept,
  degree,
  year,
  semester,
  label,
  loadingLabel,
  successMessage,
  errorMessage,
}: RefetchCourseButtonProps) {
  const router = useRouter();
  const [isRefetching, setIsRefetching] = useState(false);

  async function handleRefetch() {
    setIsRefetching(true);
    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(courseId)}?dept=${encodeURIComponent(dept)}&degree=${encodeURIComponent(degree)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(`Course refetch failed with status ${response.status}`);
      }

      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      console.error('Failed to refetch course:', error);
      toast.error(errorMessage);
    } finally {
      setIsRefetching(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRefetch}
      disabled={isRefetching}
      className="rounded-lg h-9 px-3.5 text-xs font-medium gap-1.5 border-slate-200 dark:border-slate-800"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
      <span>{isRefetching ? loadingLabel : label}</span>
    </Button>
  );
}
