import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "@/components/ui/file-upload";

// helper function to create a mock File object
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const file = new File(["a".repeat(size)], name, { type });
  return file;
}

// helper function to upload file via click (input change)
async function uploadFileViaClick(file: File) {
  // use 'applyAccept: false' to bypass the accept attribute for testing validation logic
  const user = userEvent.setup({ applyAccept: false });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
}

describe("FileUpload Component", () => {
  describe("Basic File Upload (Click)", () => {
    it("should upload and display a valid .txt file", async () => {
      render(<FileUpload />);

      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // verify filename is displayed
      expect(screen.getByText(/test.txt/i)).toBeDefined();
      expect(screen.getByText(/Filename:/i)).toBeDefined();
    });

    it("should reject a non-.txt file (PDF)", async () => {
      render(<FileUpload />);

      const invalidFile = createMockFile("document.pdf", 500, "application/pdf");
      await uploadFileViaClick(invalidFile);

      // verify error message is displayed
      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();

      // verify filename is NOT displayed
      expect(screen.queryByText(/document.pdf/i)).toBeNull();
    });

    it("should reject a file with wrong MIME type even with .txt extension", async () => {
      render(<FileUpload />);

      const invalidFile = createMockFile("fake.txt", 500, "text/html");
      await uploadFileViaClick(invalidFile);

      // verify error message is displayed
      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();

      // verify filename is NOT displayed
      expect(screen.queryByText(/fake.txt/i)).toBeNull();
    });

    it("should call onChange callback with correct File object on valid upload", async () => {
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // verify onChange was called with the File object
      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(validFile);
    });

    it("should call onChange callback with null on invalid upload", async () => {
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      const invalidFile = createMockFile("document.pdf", 500, "application/pdf");
      await uploadFileViaClick(invalidFile);

      // verify onChange was called with null
      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(null);
    });
  });

  // TODO: drag-and-drop testing will come later

  describe("File Removal", () => {
    it("should remove file and clear state when remove button is clicked", async () => {
      const user = userEvent.setup();
      render(<FileUpload />);

      // upload a valid file
      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // verify file is displayed
      expect(screen.getByText(/test.txt/i)).toBeDefined();

      // click remove button
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // verify UI returns to upload state
      expect(screen.queryByText(/test.txt/i)).toBeNull();
      expect(screen.getByText(/Upload your file/i)).toBeDefined();
      expect(screen.getByText(/Browse Files/i)).toBeDefined();
    });

    it("should call onChange callback with null on file removal", async () => {
      const user = userEvent.setup();
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      // upload a valid file
      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // clear the mock to reset call count
      onChangeMock.mockClear();

      // click remove button
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // verify onChange was called with null
      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(null);
    });

    it("should clear error message when file is removed", async () => {
      const user = userEvent.setup();
      render(<FileUpload />);

      // upload an invalid file to trigger error
      const invalidFile = createMockFile("document.pdf", 500, "application/pdf");
      await uploadFileViaClick(invalidFile);

      // verify error is displayed
      expect(screen.getByText(/Only text files are allowed/i)).toBeDefined();

      // upload a valid file
      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // remove the file
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // verify error is cleared
      expect(screen.queryByText(/Only text files are allowed/i)).toBeNull();
    });
  });

  describe("File Replacement", () => {
    it("should replace old file with new file when uploading again", async () => {
      const user = userEvent.setup();
      render(<FileUpload />);

      // upload first file
      const firstFile = createMockFile("first.txt", 500, "text/plain");
      await uploadFileViaClick(firstFile);

      // verify first file is displayed
      expect(screen.getByText(/first.txt/i)).toBeDefined();

      // remove first file
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // upload second file
      const secondFile = createMockFile("second.txt", 600, "text/plain");
      await uploadFileViaClick(secondFile);

      // verify second file is displayed and first is not
      expect(screen.getByText(/second.txt/i)).toBeDefined();
      expect(screen.queryByText(/first.txt/i)).toBeNull();
    });

    it("should call onChange with new file when replacing", async () => {
      const user = userEvent.setup();
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      // upload first file
      const firstFile = createMockFile("first.txt", 500, "text/plain");
      await uploadFileViaClick(firstFile);

      expect(onChangeMock).toHaveBeenCalledWith(firstFile);

      // remove first file
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // upload second file
      const secondFile = createMockFile("second.txt", 600, "text/plain");
      await uploadFileViaClick(secondFile);

      // verify onChange was called with second file
      expect(onChangeMock).toHaveBeenLastCalledWith(secondFile);
    });
  });

  describe("Edge Cases - File Extensions", () => {
    it("should reject file with no extension", async () => {
      render(<FileUpload />);

      const noExtFile = createMockFile("document", 500, "text/plain");
      await uploadFileViaClick(noExtFile);

      // verify error message
      expect(screen.getByText(/Only \.txt files are allowed/i)).toBeDefined();
      expect(screen.queryByText(/document/i)).toBeNull();
    });

    it("should reject file with .exe.txt extension and wrong MIME type", async () => {
      render(<FileUpload />);

      const maliciousFile = createMockFile("virus.exe.txt", 500, "application/x-msdownload");
      await uploadFileViaClick(maliciousFile);

      // should be rejected due to wrong MIME type
      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();
      expect(screen.queryByText(/virus.exe.txt/i)).toBeNull();
    });

    it("should accept file with multiple extensions if MIME is correct (.backup.txt)", async () => {
      render(<FileUpload />);

      const multiExtFile = createMockFile("file.backup.txt", 500, "text/plain");
      await uploadFileViaClick(multiExtFile);

      // should be accepted since it ends with .txt and has correct MIME
      expect(screen.getByText(/file.backup.txt/i)).toBeDefined();
      expect(screen.queryByText(/Only/i)).toBeNull();
    });

    it("should upload the same file twice successfully", async () => {
      const user = userEvent.setup();
      render(<FileUpload />);

      const file = createMockFile("same.txt", 500, "text/plain");

      // first upload
      await uploadFileViaClick(file);
      expect(screen.getByText(/same.txt/i)).toBeDefined();

      // remove file
      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      // second upload of same file
      await uploadFileViaClick(file);
      expect(screen.getByText(/same.txt/i)).toBeDefined();
    });
  });

  describe("Edge Cases - File Size", () => {
    it("should reject file larger than 1 MB", async () => {
      render(<FileUpload />);

      const largeFile = createMockFile("large.txt", 1024 * 1024 + 1, "text/plain");
      await uploadFileViaClick(largeFile);

      // verify size error message
      expect(screen.getByText(/File size must not exceed 1 MB/i)).toBeDefined();
      expect(screen.queryByText(/large.txt/i)).toBeNull();
    });

    it("should accept file exactly at 1 MB limit", async () => {
      render(<FileUpload />);

      const exactFile = createMockFile("exact.txt", 1024 * 1024, "text/plain");
      await uploadFileViaClick(exactFile);

      // should be accepted
      expect(screen.getByText(/exact.txt/i)).toBeDefined();
      expect(screen.queryByText(/File size must not exceed/i)).toBeNull();
    });

    it("should accept file just under 1 MB", async () => {
      render(<FileUpload />);

      const underSizedFile = createMockFile("under.txt", 1024 * 1024 - 1, "text/plain");
      await uploadFileViaClick(underSizedFile);

      // should be accepted
      expect(screen.getByText(/under.txt/i)).toBeDefined();
      expect(screen.queryByText(/File size must not exceed/i)).toBeNull();
    });

    it("should reject large file even with correct extension and MIME", async () => {
      render(<FileUpload />);

      const largeValidFile = createMockFile("huge.txt", 5 * 1024 * 1024, "text/plain");
      await uploadFileViaClick(largeValidFile);

      // should be rejected due to size
      expect(screen.getByText(/File size must not exceed 1 MB/i)).toBeDefined();
      expect(screen.queryByText(/huge.txt/i)).toBeNull();
    });
  });

  describe("MIME Type Validation", () => {
    it("should reject file with .txt extension but text/html MIME type", async () => {
      render(<FileUpload />);

      const htmlFile = createMockFile("fake.txt", 500, "text/html");
      await uploadFileViaClick(htmlFile);

      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();
      expect(screen.queryByText(/fake.txt/i)).toBeNull();
    });

    it("should reject file with .txt extension but application/json MIME type", async () => {
      render(<FileUpload />);

      const jsonFile = createMockFile("data.txt", 500, "application/json");
      await uploadFileViaClick(jsonFile);

      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();
      expect(screen.queryByText(/data.txt/i)).toBeNull();
    });

    it("should only accept text/plain MIME type", async () => {
      render(<FileUpload />);

      const validFile = createMockFile("valid.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      expect(screen.getByText(/valid.txt/i)).toBeDefined();
      expect(screen.queryByText(/Only text files are allowed/i)).toBeNull();
    });
  });

  describe("Extension Validation", () => {
    it("should reject file without .txt extension even with correct MIME", async () => {
      render(<FileUpload />);

      const noTxtFile = createMockFile("document.text", 500, "text/plain");
      await uploadFileViaClick(noTxtFile);

      expect(screen.getByText(/Only \.txt files are allowed/i)).toBeDefined();
      expect(screen.queryByText(/document.text/i)).toBeNull();
    });

    it("should reject .doc file", async () => {
      render(<FileUpload />);

      const docFile = createMockFile("document.doc", 500, "application/msword");
      await uploadFileViaClick(docFile);

      expect(screen.getByText(/Only text files are allowed/i)).toBeDefined();
      expect(screen.queryByText(/document.doc/i)).toBeNull();
    });

    it("should reject .csv file even though it might be text", async () => {
      render(<FileUpload />);

      const csvFile = createMockFile("data.csv", 500, "text/csv");
      await uploadFileViaClick(csvFile);

      expect(screen.getByText(/Only text files are allowed/i)).toBeDefined();
      expect(screen.queryByText(/data.csv/i)).toBeNull();
    });
  });

  describe("Custom Props Display", () => {
    it("should display custom uploadText", () => {
      const customUploadText = "Upload your custom file here";
      render(<FileUpload uploadText={customUploadText} />);

      expect(screen.getByText(customUploadText)).toBeDefined();
    });

    it("should display custom hintText", () => {
      const customHintText = "Custom hint: Only .txt files allowed";
      render(<FileUpload hintText={customHintText} />);

      expect(screen.getByText(customHintText)).toBeDefined();
    });

    it("should display both custom uploadText and hintText", () => {
      const customUploadText = "Custom Upload Title";
      const customHintText = "Custom hint message";
      render(<FileUpload uploadText={customUploadText} hintText={customHintText} />);

      expect(screen.getByText(customUploadText)).toBeDefined();
      expect(screen.getByText(customHintText)).toBeDefined();
    });

    it("should display default uploadText when not provided", () => {
      render(<FileUpload />);

      expect(screen.getByText(/Upload your file/i)).toBeDefined();
    });

    it("should display default hintText when not provided", () => {
      render(<FileUpload />);

      expect(screen.getByText(/Drag & drop your file, or click to browse/i)).toBeDefined();
    });

    it("should not display custom text after file is uploaded", async () => {
      const customUploadText = "Upload your custom file here";
      render(<FileUpload uploadText={customUploadText} />);

      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      // custom text should not be visible after upload
      expect(screen.queryByText(customUploadText)).toBeNull();
      // filename should be visible instead
      expect(screen.getByText(/test.txt/i)).toBeDefined();
    });
  });

  describe("onChange Callback Behavior", () => {
    it("should fire onChange with File object on successful upload", async () => {
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      const validFile = createMockFile("callback.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(validFile);
      expect(onChangeMock.mock.calls[0][0]).toBeInstanceOf(File);
    });

    it("should fire onChange with null on file removal", async () => {
      const user = userEvent.setup();
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      const validFile = createMockFile("test.txt", 500, "text/plain");
      await uploadFileViaClick(validFile);

      onChangeMock.mockClear();

      const removeButton = screen.getByRole("button", { name: /remove file/i });
      await user.click(removeButton);

      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(null);
    });

    it("should fire onChange with null on validation failure", async () => {
      const onChangeMock = vi.fn();
      render(<FileUpload onChange={onChangeMock} />);

      const invalidFile = createMockFile("invalid.pdf", 500, "application/pdf");
      await uploadFileViaClick(invalidFile);

      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith(null);
    });

    it("should not fire onChange when onChange prop is not provided", async () => {
      // this test ensures the component doesn't crash when onChange is undefined
      render(<FileUpload />);

      const validFile = createMockFile("test.txt", 500, "text/plain");

      // should not throw error
      await expect(uploadFileViaClick(validFile)).resolves.not.toThrow();

      // file should still be displayed
      expect(screen.getByText(/test.txt/i)).toBeDefined();
    });
  });

  describe("Combined Validation Scenarios", () => {
    it("should validate MIME type before extension", async () => {
      render(<FileUpload />);

      // file with wrong MIME but correct extension
      const file = createMockFile("test.txt", 500, "application/octet-stream");
      await uploadFileViaClick(file);

      // should show MIME type error (checked first)
      expect(screen.getByText(/Only text files are allowed \(MIME type: text\/plain\)/i)).toBeDefined();
    });

    it("should validate extension after MIME type passes", async () => {
      render(<FileUpload />);

      // file with correct MIME but wrong extension
      const file = createMockFile("test.text", 500, "text/plain");
      await uploadFileViaClick(file);

      // should show extension error
      expect(screen.getByText(/Only \.txt files are allowed/i)).toBeDefined();
    });

    it("should validate size after MIME and extension pass", async () => {
      render(<FileUpload />);

      // file with correct MIME and extension but too large
      const file = createMockFile("large.txt", 2 * 1024 * 1024, "text/plain");
      await uploadFileViaClick(file);

      // should show size error
      expect(screen.getByText(/File size must not exceed 1 MB/i)).toBeDefined();
    });

    it("should accept file only when all validations pass", async () => {
      render(<FileUpload />);

      // file that passes all validations
      const file = createMockFile("perfect.txt", 500, "text/plain");
      await uploadFileViaClick(file);

      // should be accepted with no errors
      expect(screen.getByText(/perfect.txt/i)).toBeDefined();
      expect(screen.queryByText(/Only text files are allowed/i)).toBeNull();
      expect(screen.queryByText(/Only \.txt files are allowed/i)).toBeNull();
      expect(screen.queryByText(/File size must not exceed/i)).toBeNull();
    });
  });
});
