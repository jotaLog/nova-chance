import { createContext } from "react";

export type SessionStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface SessionContextValue {
  status: SessionStatus;
  retry: () => void;
  endSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
