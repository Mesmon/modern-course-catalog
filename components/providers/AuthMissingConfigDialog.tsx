'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDictionary } from './DictionaryProvider';

export function AuthMissingConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isRtl ? 'text-right' : 'text-left'} dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <DialogTitle>{dictionary.auth.missingConfigTitle}</DialogTitle>
          <DialogDescription>{dictionary.auth.missingConfigDesc}</DialogDescription>
        </DialogHeader>
        <div
          className="space-y-3 text-xs font-mono bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto"
          dir="ltr"
        >
          <div>GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com</div>
          <div>GOOGLE_CLIENT_SECRET=your_google_client_secret</div>
          <div>AUTH_SECRET=your_random_secret_string</div>
        </div>
        <p className="text-xs text-muted-foreground" dir="ltr">
          Authorized Redirect URI:{' '}
          <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono">
            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
            /api/auth/callback/google
          </code>
        </p>
      </DialogContent>
    </Dialog>
  );
}
