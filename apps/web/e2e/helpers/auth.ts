import { setupClerkTestingToken } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

export async function authenticate(page: Page) {
  await setupClerkTestingToken({ page });
}
