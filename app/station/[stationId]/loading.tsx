import { Loader2 } from 'lucide-react';

export default function StationLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto pb-20 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading station...</p>
      </div>
    </div>
  );
}
