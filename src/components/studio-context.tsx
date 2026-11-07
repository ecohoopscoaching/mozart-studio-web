"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Project } from "@/domain/types";
import { loadProjects, saveProjects } from "@/client/storage";
import { touch } from "@/domain/project";

interface StudioContextValue {
  ready: boolean;
  projects: Project[];
  save: (project: Project) => void;
  remove: (id: string) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProjects(projects);
  }, [projects, ready]);

  const value = useMemo<StudioContextValue>(
    () => ({
      ready,
      projects,
      save(project) {
        const next = touch(project);
        setProjects((current) => {
          const exists = current.some((item) => item.id === next.id);
          return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
        });
      },
      remove(id) {
        setProjects((current) => current.filter((item) => item.id !== id));
      },
    }),
    [projects, ready],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio is unavailable.");
  return value;
}
