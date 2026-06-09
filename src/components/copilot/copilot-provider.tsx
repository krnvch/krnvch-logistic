import { useMemo, useState } from "react";
import { CopilotContext } from "./copilot-context";

export function CopilotProvider({
  firstName,
  children,
}: {
  firstName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({ open, setOpen, firstName }),
    [open, firstName]
  );
  return (
    <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
  );
}
