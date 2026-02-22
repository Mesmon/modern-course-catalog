import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 backdrop-blur-md shadow-sm" dir="rtl">
      <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:inline-block text-slate-900">
            קטלוג<span className="text-primary gap-1"> .</span>קורסים
          </span>
        </Link>
        <div className="flex-1 flex justify-center max-w-2xl mx-auto px-2">
          <GlobalSearch />
        </div>
      </div>
    </header>
  );
}
