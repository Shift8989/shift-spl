"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeIcon, TokensIcon, ShiftsIcon, LaunchIcon, DocsIcon, XIcon, CollapseIcon, ExpandIcon, MenuIcon, SearchIcon } from "./Icons";
import { CaChip } from "./CaChip";
import { ConnectButton } from "./ConnectButton";
import { SearchModal } from "./SearchModal";
import { CHAIN, CHAIN_KEY } from "@/lib/chain-config";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Tokens", Icon: TokensIcon },
  { href: "/shifts", label: "Shifts", Icon: ShiftsIcon },
  { href: "/lab", label: "Launch", Icon: LaunchIcon },
  { href: "/docs", label: "Documentation", Icon: DocsIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/explore" && pathname.startsWith("/specimen")));

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-bg-2 transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          collapsed ? "lg:w-[68px]" : "lg:w-[236px]"
        } w-[236px] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex h-[68px] items-center ${collapsed ? "justify-center px-0 lg:flex-col lg:gap-2 lg:h-auto lg:py-4" : "justify-between px-4"}`}>
          <Link className="group flex cursor-pointer items-center gap-3" aria-label="Shift home" href="/">
            <span className="rounded-[30%] ring-1 ring-line-strong transition-[box-shadow] group-hover:ring-ink-faint">
              <Image alt="" width={38} height={38} className="shrink-0 rounded-[28%] object-cover" style={{ width: 38, height: 38 }} src="/logo.png" priority />
            </span>
            {!collapsed && (
              <span className="leading-none">
                <span className="brand block text-[21px] text-ink transition-opacity group-hover:opacity-85">shift</span>
                <span className="mono mt-1 block text-[9.5px] tracking-[0.18em] text-ink-faint uppercase">shiftable spl</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
            className="hidden size-7 cursor-pointer items-center justify-center rounded-full border border-line text-ink-faint transition-colors hover:border-line-strong hover:text-ink lg:flex"
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>
        <nav className="mt-2 flex flex-col gap-0.5 px-2.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] transition-colors ${
                  active ? "border border-line-strong bg-card-2 text-ink" : "border border-transparent text-ink-soft hover:bg-card hover:text-ink"
                } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
              >
                <Icon className={active ? "text-green" : ""} />
                {!collapsed && label}
                {collapsed && <span className="lg:hidden">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-4 pb-4">
          {!collapsed && <CaChip size="sm" label="$SHIFT" className="mb-2 w-full" />}
          <a
            href="https://x.com/shiftspl"
            target="_blank"
            rel="noreferrer"
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-ink-faint transition-colors hover:bg-card hover:text-ink ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <XIcon />
            {!collapsed && <span className="mono text-[12px]">@shiftspl</span>}
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-xl">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-line text-ink-soft hover:text-ink lg:hidden"
          >
            <MenuIcon />
          </button>
          <div className="mx-auto w-full max-w-[460px]">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-full cursor-text items-center gap-2.5 rounded-lg border border-line bg-card px-3 text-left transition-colors hover:border-line-strong"
                aria-label="Search tokens by name, ticker or mint"
              >
                <SearchIcon className="shrink-0 text-ink-faint" />
                <span className="min-w-0 flex-1 text-[13px] text-ink-faint">Search tokens</span>
                <kbd className="mono hidden shrink-0 items-center gap-0.5 rounded-md border border-line-strong bg-card-2 px-1.5 py-0.5 text-[10.5px] text-ink-soft sm:flex">⌘ K</kbd>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CaChip size="sm" className="hidden xl:inline-flex" />
            <span className="chip hidden md:inline-flex">{CHAIN_KEY === "robinhood" ? "robinhood chain" : CHAIN.name.toLowerCase()}</span>
            <Link className="btn btn-sm btn-ink hidden sm:inline-flex" href="/lab">
              Launch
            </Link>
            <ConnectButton size="sm" />
          </div>
        </header>
        <main className="flex-1 pb-24">{children}</main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
