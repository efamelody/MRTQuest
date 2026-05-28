import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-[#FFF9F0] border-b-2 border-[#E8E0D6]">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border-2 border-[#0D9488] bg-[#0D9488] shadow-sm flex items-center justify-center">
            <Image src="/logo.png" alt="MRTQuest Logo" fill className="object-cover" />
          </div>

          <div>
            <p className="font-fredoka text-xl leading-none text-[#0D9488]">MRTQuest</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B7E74] mt-0.5">Explore Kuala Lumpur</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
