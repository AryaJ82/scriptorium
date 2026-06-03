export default function InfoPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.25),transparent_35%),linear-gradient(180deg,#020617,#0f172a_55%,#111827)] px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.55)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Project info
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Scriptorium information
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-200">
          This page is intentionally lightweight so the app can build cleanly while the auth flow and protected examples are being developed.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-100">
          <p className="font-semibold text-white">What is available</p>
          <ul className="mt-3 space-y-2 text-slate-200">
            <li>• Reusable login form component</li>
            <li>• React session context for shared auth state</li>
            <li>• Protected example page using authenticated fetch</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
