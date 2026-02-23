"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDictionary } from "@/components/providers/DictionaryProvider";

interface CopyCourseIdProps {
  id: string;
  className?: string;
  iconClassName?: string;
}

export function CopyCourseId({ id, className, iconClassName }: CopyCourseIdProps) {
  const [copied, setCopied] = useState(false);
  const { dictionary } = useDictionary();

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success(dictionary.course.copiedToClipboard);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 cursor-pointer transition-colors",
        className
      )}
      title="Copy course ID"
    >
      <span>{id}</span>
      {copied ? (
        <Check className={cn("h-3 w-3 text-emerald-500", iconClassName)} />
      ) : (
        <Copy className={cn("h-3 w-3 opacity-70", iconClassName)} />
      )}
    </span>
  );
}
