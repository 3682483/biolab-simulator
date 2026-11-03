import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/labs", label: "实验" },
  { to: "/map", label: "知识地图" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="size-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
            <ellipse cx="12" cy="12" rx="9" ry="7" />
            <circle cx="10" cy="11" r="2.5" fill="currentColor" />
          </svg>
          <span className="font-serif text-[15px] font-semibold tracking-wide">生命实验室</span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
