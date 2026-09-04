import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Auto-cleanup only runs when vitest globals are enabled; register it manually.
afterEach(() => {
  cleanup();
});
