import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@school-saas/api";

export const trpc = createTRPCReact<AppRouter>();
