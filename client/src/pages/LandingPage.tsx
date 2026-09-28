import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/30 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/30 blur-[120px] animate-pulse [animation-delay:1s]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[100px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-4 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs text-accent-light">
          Real-time · AI-native · Open source
        </span>
        <h1 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent-light via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          LiveCollab AI
        </h1>
        <p className="mt-4 max-w-xl text-neutral-400">
          Real-time collaborative docs with an AI copilot built in — summarize, ask
          questions with citations, and autocomplete as you write.
        </p>
        <Link
          to="/login"
          className="mt-8 rounded-xl bg-accent px-6 py-3 font-medium shadow-lg shadow-accent/30 hover:bg-accent-light hover:shadow-accent-light/40 transition"
        >
          Try Live Demo
        </Link>
      </div>
    </div>
  );
}
