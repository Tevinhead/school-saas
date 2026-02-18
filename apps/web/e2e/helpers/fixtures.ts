import { test as base } from "@playwright/test";
import { authenticate } from "./auth";

export const test = base.extend({
  page: async ({ page }, use) => {
    await authenticate(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
