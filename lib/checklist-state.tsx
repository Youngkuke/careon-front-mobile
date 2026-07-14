import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { SAVED_PROGRAMS } from './mock-data';

type ChecklistContextValue = {
  checkedDocuments: Record<string, boolean>;
  getDocumentKey: (programId: string, documentTitle: string) => string;
  toggleDocument: (key: string) => void;
};

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

const getDocumentKey = (programId: string, documentTitle: string) => `${programId}:${documentTitle}`;

export function ChecklistProvider({ children }: PropsWithChildren) {
  const initialCheckedState = useMemo(() => {
    return Object.fromEntries(
      SAVED_PROGRAMS.flatMap((program) =>
        program.documents.map((document) => [getDocumentKey(program.id, document.title), false]),
      ),
    );
  }, []);
  const [checkedDocuments, setCheckedDocuments] = useState<Record<string, boolean>>(initialCheckedState);

  const value = useMemo<ChecklistContextValue>(() => ({
    checkedDocuments,
    getDocumentKey,
    toggleDocument: (key: string) => {
      setCheckedDocuments((current) => ({ ...current, [key]: !current[key] }));
    },
  }), [checkedDocuments]);

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

export function useChecklist() {
  const context = useContext(ChecklistContext);

  if (!context) {
    throw new Error('useChecklist must be used inside ChecklistProvider');
  }

  return context;
}
