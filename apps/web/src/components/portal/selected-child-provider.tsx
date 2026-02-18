"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
}

interface SelectedChildContextValue {
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string) => void;
  students: Student[];
  role: string | null;
  isLoading: boolean;
}

const SelectedChildContext = createContext<SelectedChildContextValue>({
  selectedStudentId: null,
  setSelectedStudentId: () => {},
  students: [],
  role: null,
  isLoading: true,
});

export function useSelectedChild() {
  return useContext(SelectedChildContext);
}

export function SelectedChildProvider({ children }: { children: ReactNode }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data, isLoading } = trpc.portal.getMyContext.useQuery();

  useEffect(() => {
    if (data?.students && data.students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(data.students[0]!.id);
    }
  }, [data, selectedStudentId]);

  return (
    <SelectedChildContext.Provider
      value={{
        selectedStudentId,
        setSelectedStudentId,
        students: (data?.students as Student[]) ?? [],
        role: data?.role ?? null,
        isLoading,
      }}
    >
      {children}
    </SelectedChildContext.Provider>
  );
}
