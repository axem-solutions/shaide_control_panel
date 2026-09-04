import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FileUploadDialog from "@/app/components/client/FileUploadDialog";

function makeFile(name: string, sizeBytes: number, type = "text/plain") {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

async function openDialog(
  props: Partial<Parameters<typeof FileUploadDialog>[0]> = {},
  setupOptions?: Parameters<typeof userEvent.setup>[0],
) {
  const user = userEvent.setup(setupOptions);
  const onUpload = vi.fn().mockResolvedValue({ ok: true });
  render(
    <FileUploadDialog triggerLabel="Upload File" onUpload={onUpload} {...props} />,
  );
  await user.click(screen.getByRole("button", { name: "Upload File" }));
  const fileInput = screen
    .getByRole("dialog")
    .querySelector<HTMLInputElement>('input[type="file"]')!;
  return { user, onUpload, fileInput };
}

describe("FileUploadDialog file validation", () => {
  it("renders nothing when canOpen is false", () => {
    const { container } = render(
      <FileUploadDialog canOpen={false} triggerLabel="Upload File" onUpload={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("rejects files with a disallowed extension", async () => {
    const { user, fileInput } = await openDialog(
      {
        acceptExtensions: ["txt"],
        invalidFileErrorText: "Only .txt files are allowed.",
      },
      // Let the disallowed file through the accept attribute so the
      // component's own validation is what rejects it.
      { applyAccept: false },
    );

    await user.upload(fileInput, makeFile("notes.pdf", 10, "application/pdf"));

    expect(screen.getByText("Only .txt files are allowed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("rejects files above the size limit", async () => {
    const { user, fileInput } = await openDialog({
      maxFileSize: 100,
      maxFileSizeErrorText: "File size must not exceed 100 bytes.",
    });

    await user.upload(fileInput, makeFile("big.txt", 101));

    expect(screen.getByText("File size must not exceed 100 bytes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("accepts a valid file and clears a previous error", async () => {
    const { user, fileInput } = await openDialog({ maxFileSize: 100 });

    await user.upload(fileInput, makeFile("big.txt", 101));
    expect(screen.getByText("File is too large.")).toBeInTheDocument();

    await user.upload(fileInput, makeFile("ok.txt", 10));

    expect(screen.getByText("ok.txt")).toBeInTheDocument();
    expect(screen.getByText("TXT • 10 B")).toBeInTheDocument();
    expect(screen.getByText("File ready for upload")).toBeInTheDocument();
    expect(screen.queryByText("File is too large.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled();
  });

  it("uploads the selected file and closes the dialog on success", async () => {
    const onUploaded = vi.fn();
    const { user, onUpload, fileInput } = await openDialog({ onUploaded });

    await user.upload(fileInput, makeFile("ok.txt", 10));
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
    expect(onUpload).toHaveBeenCalledTimes(1);
    expect((onUpload.mock.calls[0][0] as File).name).toBe("ok.txt");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("shows the upload error and keeps the dialog open on failure", async () => {
    const onUploaded = vi.fn();
    const { user, onUpload, fileInput } = await openDialog({ onUploaded });
    onUpload.mockResolvedValueOnce({ ok: false, error: "Invalid license file." });

    await user.upload(fileInput, makeFile("ok.txt", 10));
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(await screen.findByText("Invalid license file.")).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
