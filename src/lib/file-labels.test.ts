import { describe, expect, it } from "vitest";

import {
  formatFileSize,
  getFileStatusLabel,
  getFileStatusTone,
  getFileTypeLabel,
} from "@/lib/file-labels";

describe("getFileTypeLabel", () => {
  it("maps the MIME types we accept to short labels", () => {
    expect(getFileTypeLabel("text/plain")).toBe("TXT");
    expect(getFileTypeLabel("application/pdf")).toBe("PDF");
    expect(getFileTypeLabel("image/svg+xml")).toBe("SVG");
  });

  it("normalizes case and strips MIME parameters", () => {
    expect(getFileTypeLabel("TEXT/PLAIN")).toBe("TXT");
    expect(getFileTypeLabel("  text/csv ")).toBe("CSV");
  });

  it("derives a label from the subtype of an unknown MIME type", () => {
    expect(getFileTypeLabel("application/vnd.custom.thing+xml; charset=utf-8")).toBe("THING");
    expect(getFileTypeLabel("application/x-custom!!")).toBe("X-CUSTOM");
  });

  it("falls back to FILE when the type is missing or unusable", () => {
    expect(getFileTypeLabel()).toBe("FILE");
    expect(getFileTypeLabel("   ")).toBe("FILE");
    expect(getFileTypeLabel("application/!!!")).toBe("FILE");
  });
});

describe("formatFileSize", () => {
  it("reports bytes below one kilobyte", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("switches unit at each kilobyte boundary", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });

  it("reports an unknown size for a null value", () => {
    expect(formatFileSize(null)).toBe("unknown size");
  });
});

describe("file status labels", () => {
  it("groups the in-flight statuses under the processing tone", () => {
    expect(getFileStatusTone("uploading")).toBe("processing");
    expect(getFileStatusTone("Processing")).toBe("processing");
    expect(getFileStatusTone("reprocessing")).toBe("processing");
  });

  it("groups the finished statuses under the success tone", () => {
    expect(getFileStatusTone("ready")).toBe("success");
    expect(getFileStatusTone(" PROCESSED ")).toBe("success");
  });

  it("falls back to the neutral tone for anything else", () => {
    expect(getFileStatusTone("failed")).toBe("neutral");
    expect(getFileStatusTone("")).toBe("neutral");
  });

  it("renames 'processed' to 'Ready' and capitalizes the rest", () => {
    expect(getFileStatusLabel("processed")).toBe("Ready");
    expect(getFileStatusLabel("uploading")).toBe("Uploading");
  });
});
