import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-3xl border-2 border-slate-200 bg-slate-100">
            <Image src="/logo.png" alt="MRTQuest Logo" fill className="object-cover" />
          </div>

          <div>
            <p className="text-base font-semibold text-slate-900">MRTQuest</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Explore heritage lines</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
