import Link from "next/link";

type DrNavProps = {
  active?: "dashboard" | "simulation";
};

export function DrNav({ active = "dashboard" }: DrNavProps) {
  return (
    <header className="dr-nav">
      <div>
        <span className="dr-brand">NOVUA DECISION ROOM</span>
      </div>
      <nav>
        <Link className={active === "dashboard" ? "active" : undefined} href="/dashboard">
          Workspace
        </Link>
        <Link className={active === "simulation" ? "active" : undefined} href="/simulation">
          Simulation
        </Link>
      </nav>
    </header>
  );
}
