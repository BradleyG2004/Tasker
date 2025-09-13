// src/context/userContext.ts
import { createContext } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
}

export const userContext = createContext<User | null>(null);
