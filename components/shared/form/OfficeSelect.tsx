"use client";

import { useEffect, useMemo, useState } from "react";

interface OfficeSelectProps {
  offices: string[];
  value?: string | null;
  onChange?: (office: string | null) => void;
  label?: string;
}

const RECENT_KEY = "recent-offices";

export function OfficeSelect({ offices, value = null, onChange, label = "Offices" }: OfficeSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(value);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const base = normalizedQuery
      ? offices.filter((o) => o.toLowerCase().includes(normalizedQuery))
      : offices;

    // Deduplicate while keeping recent (that match filters) at top
    const recentFiltered = recent.filter((r) => base.includes(r));
    const rest = base.filter((o) => !recentFiltered.includes(o));
    return [...recentFiltered, ...rest];
  }, [offices, recent, normalizedQuery]);

  const handleSelect = (office: string) => {
    setSelected(office);
    setOpen(false);
    onChange?.(office);

    // update recent list (front of list, max 5)
    try {
      const next = [office, ...recent.filter((r) => r !== office)].slice(0, 5);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleClear = () => {
    setSelected(null);
    onChange?.(null);
  };

  return (
    <div className="bg-[#f8f8f8] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        {label}
      </label>

      {/* Combobox input */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search office..."
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-400/40 dark:focus:ring-zinc-600/40"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="absolute right-1.5 top-1.5 px-2 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white/60 dark:bg-zinc-800/60"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white/60 dark:bg-zinc-800/60"
        >
          Clear
        </button>
      </div>

      {/* Selected pill */}
      {selected && (
        <div className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">
          Selected: <span className="font-semibold">{selected}</span>
        </div>
      )}

      {/* Options list */}
      {open && (
        <div className="max-h-64 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <li className="p-3 text-sm text-zinc-500 dark:text-zinc-400">No results</li>
            ) : (
              filtered.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => handleSelect(o)}
                    className={`w-full text-left px-3 py-2 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      selected === o ? "bg-zinc-100/70 dark:bg-zinc-800/70 font-medium" : ""
                    }`}
                  >
                    {o}
                    {recent.includes(o) && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">recent</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}



