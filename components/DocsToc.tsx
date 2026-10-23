"use client";

import { useEffect, useState } from "react";

export type Section = { id: string; n: string; title: string; children: { id: string; title: string }[] };

export function DocsToc({ sections, variant }: { sections: Section[]; variant: "desktop" | "mobile" }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = sections.flatMap((s) => [s.id, ...s.children.map((c) => c.id)]);
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const parentOf = (id: string) => sections.find((s) => s.id === id || s.children.some((c) => c.id === id));
  const activeParent = parentOf(active);
  const activeTitle = sections.flatMap((s) => [s, ...s.children]).find((x) => x.id === active)?.title ?? "";

  if (variant === "mobile") {
    return (
      <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-bg/90 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 xl:hidden">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-11 w-full cursor-pointer items-center justify-between text-[13px]">
          <span className="truncate">
            <span className="kicker mr-2">On this page</span>
            {activeTitle}
          </span>
          <span className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
        {open && (
          <ol className="max-h-[50vh] overflow-y-auto pb-3">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={() => setOpen(false)} className={`flex items-baseline gap-2.5 py-1 text-[13px] ${activeParent?.id === s.id ? "text-ink" : "text-ink-soft"}`}>
                  <span className="mono w-5 shrink-0 text-[10px] text-ink-faint">{s.n}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        )}
        <div className="h-px bg-line">
          <div className="h-px bg-ink" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  const idx = sections.findIndex((s) => s.id === activeParent?.id);
  const rowH = 30;
  return (
    <nav aria-label="On this page" className="text-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="kicker">On this page</span>
        <span className="mono text-[10.5px] text-ink-faint">12 min · {progress}%</span>
      </div>
      <div className="mb-4 h-px bg-line">
        <div className="h-px bg-ink transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-0 w-px bg-line" />
        <div
          className="absolute left-0 w-px bg-ink shadow-[0_0_8px_rgb(255_255_255/0.6)] transition-[top,height] duration-300 ease-out"
          style={{ top: Math.max(0, idx) * rowH + sections.slice(0, Math.max(0, idx)).reduce((a, s) => a + (s.id === activeParent?.id ? 0 : 0), 0), height: rowH }}
        />
        <ol className="space-y-0.5">
          {sections.map((s) => {
            const openSec = activeParent?.id === s.id;
            return (
              <li key={s.id}>
                <a
                  data-toc={s.id}
                  href={`#${s.id}`}
                  className={`flex cursor-pointer items-baseline gap-2.5 py-1 pl-4 transition-colors ${openSec ? "text-ink" : "text-ink-faint hover:text-ink-soft"}`}
                >
                  <span className="mono w-5 shrink-0 text-[10px] text-ink-faint">{s.n}</span>
                  <span>{s.title}</span>
                </a>
                {s.children.length > 0 && (
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: openSec ? "1fr" : "0fr" }}>
                    <ol className="overflow-hidden">
                      {s.children.map((c) => (
                        <li key={c.id}>
                          <a
                            data-toc={c.id}
                            href={`#${c.id}`}
                            className={`block cursor-pointer py-1 pl-[46px] text-[12.5px] transition-colors ${active === c.id ? "text-ink" : "text-ink-faint hover:text-ink-soft"}`}
                          >
                            {c.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
