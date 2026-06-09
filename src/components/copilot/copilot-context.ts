import { createContext, useContext } from "react";

export interface CopilotContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  firstName?: string;
}

export const CopilotContext = createContext<CopilotContextValue | null>(null);

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}
