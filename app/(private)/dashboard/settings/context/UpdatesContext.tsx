"use client";

import { createContext, useContext, useState } from "react";

type UpdatesContextType = {
  bugReports: number;
  bugUpdates: number;
  suggestions: number;
  decrement: (key: "bugReports" | "bugUpdates" | "suggestions") => void;
  increment: (key: "bugReports" | "bugUpdates" | "suggestions") => void;
};

const UpdatesContext = createContext<UpdatesContextType | null>(null);

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState({
    bugReports: 2,
    bugUpdates: 1,
    suggestions: 3,
  });

  const increment = (key: keyof typeof counts) =>
    setCounts((c) => ({ ...c, [key]: c[key] + 1 }));

  const decrement = (key: keyof typeof counts) =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, c[key] - 1) }));

  return (
    <UpdatesContext.Provider
      value={{ ...counts, increment, decrement }}
    >
      {children}
    </UpdatesContext.Provider>
  );
}

export const useUpdates = () => {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error("useUpdates must be used inside UpdatesProvider");
  return ctx;
};
