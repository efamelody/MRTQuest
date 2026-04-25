import { Ticket, MoveRight, Mail } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 p-6 flex flex-col items-center justify-center">
      
      {/* THE BOARDING PASS */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/60">
        
        {/* TOP SECTION: ROUTE */}
        <div className="bg-primary p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <Ticket className="w-8 h-8 opacity-80" />
            <span className="font-brand text-xs uppercase tracking-widest opacity-80">Official Boarding Pass</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase opacity-70">From</p>
              <h2 className="text-3xl font-brand">GUEST</h2>
            </div>
            <MoveRight className="w-8 h-8 text-accent animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] uppercase opacity-70">To</p>
              <h2 className="text-3xl font-brand">QUESTER</h2>
            </div>
          </div>
        </div>

        {/* THE PERFORATION LINE */}
        <div className="relative h-6 bg-white flex items-center justify-center">
          <div className="absolute -left-3 w-6 h-6 bg-purple-50 rounded-full shadow-inner" />
          <div className="w-full border-t-2 border-dashed border-slate-100 mx-4" />
          <div className="absolute -right-3 w-6 h-6 bg-purple-50 rounded-full shadow-inner" />
        </div>

        {/* MIDDLE SECTION: LOGIN OPTIONS */}
        <div className="p-8 pt-4">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-heading mb-2">Identify Yourself</h3>
            <p className="text-sm text-slate-500 font-sans">Every explorer needs a permit. Choose your method to begin the journey.</p>
          </div>

          <div className="space-y-3">
            {/* GOOGLE LOGIN */}
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
              Continue with Google
            </button>

            {/* EMAIL/MAGIC LINK */}
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95">
              <Mail className="w-5 h-5 text-primary" />
              Magic Link via Email
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: THE STUB */}
        <div className="bg-slate-50 p-6 flex flex-col items-center border-t border-slate-100">
          {/* Faux Barcode */}
          <div className="w-full h-12 flex gap-1 items-center justify-center opacity-40">
            {[1, 4, 2, 8, 1, 6, 3, 2, 5, 2, 8, 4, 1].map((h, i) => (
              <div key={i} className="bg-black w-1 rounded-full" style={{ height: `${h * 10}%` }} />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-tighter">
            MRTQ-7782-KL-2026
          </p>
        </div>

      </div>

      {/* BACK BUTTON */}
      <button className="mt-8 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
        Maybe later, I'm just looking
      </button>

    </div>
  );
}