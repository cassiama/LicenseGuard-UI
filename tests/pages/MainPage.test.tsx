import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MainPage } from "@/pages/MainPage";
import * as api from "@/services/api";
import { AuthProvider } from "@/contexts/auth-context";

// mock 'getAnalysisStream' from the API module
vi.mock("@/services/api", () => ({
  getAnalysisStream: vi.fn(),
}));

// mock 'useAuth' from the auth context
const mockLogout = vi.fn();
vi.mock("@/contexts/auth-context", async () => {
  const actual = await vi.importActual("@/contexts/auth-context");
  return {
    ...actual,
    useAuth: () => ({
      logout: mockLogout,
      token: "test-token",
      login: vi.fn(),
      isAuthenticated: true,
    }),
  };
});

// helper function to render MainPage with router and auth context
function renderMainPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MainPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// helper function to fill project name
async function fillProjectName(
  user: ReturnType<typeof userEvent.setup>,
  projectName: string
) {
  const textboxInput = screen.getByPlaceholderText(/myreallyawesomeapp/i);
  await user.clear(textboxInput);
  if (projectName) await user.type(textboxInput, projectName);
}

// helper function to select a file
async function selectFile(
  user: ReturnType<typeof userEvent.setup>,
  fileName: string = "requirements.txt"
) {
  const file = new File(["flask==2.0.1\ndjango==3.2.0"], fileName, { type: "text/plain" });
  
  // if a file is already uploaded, click the remove button first
  const removeButton = screen.queryByRole("button", { name: /remove file/i });
  if (removeButton) {
    await user.click(removeButton);
    // wait for the file to be removed
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /remove file/i })).toBeNull();
    });
  }
  
  // in a lot of UI frameworks, the file inputs aren't 
  // directly interactive due to styling
  const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;

  if (hiddenInput) {
    await user.upload(hiddenInput, file);
  }
}

// helper function to click analyze button
async function clickAnalyzeButton(user: ReturnType<typeof userEvent.setup>) {
  const analyzeButton = screen.getByRole("button", { name: /analyze/i });
  await user.click(analyzeButton);
}

describe("MainPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("authToken", "test-token");
  });

  describe("Submit Button State", () => {
    it("should disable submit button when file is missing", async () => {
      const user = userEvent.setup();
      renderMainPage();

      await fillProjectName(user, "TestProject");

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", true);
    });

    it("should disable submit button when project name is missing", async () => {
      const user = userEvent.setup();
      renderMainPage();

      await selectFile(user);

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", true);
    });

    it("should disable submit button when both file and project name are missing", async () => {
      renderMainPage();

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", true);
    });

    it("should enable submit button when both file and project name are present", async () => {
      const user = userEvent.setup();
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", false);
    });

    it("should disable button during loading", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", false);

      await clickAnalyzeButton(user);

      // button becomes hidden during loading (has "hidden" class)
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /analyze/i })).toBeNull();
      });
    });
  });

  describe("Form Validation", () => {
    it("should show error when API call fails", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to fail
      vi.mocked(api.getAnalysisStream).mockRejectedValue(
        new Error("Analysis request failed: Server error")
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis request failed/i)).toBeDefined();
      });

      expect(api.getAnalysisStream).toHaveBeenCalled();
    });

    it("should clear error when form is resubmitted successfully", async () => {
      const user = userEvent.setup();
      renderMainPage();

      // first submission fails
      vi.mocked(api.getAnalysisStream).mockRejectedValueOnce(
        new Error("Network error")
      );

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeDefined();
      });

      // second submission succeeds
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Complete");
        }
      );
      await clickAnalyzeButton(user);

      // error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).toBeNull();
        expect(screen.getByText(/analysis complete/i)).toBeDefined();
      });
    });
  });

  describe("File Change Behavior", () => {
    it("should clear previous analysis when file is changed", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## First Analysis Result\n\nSome content here");
        }
      );
      renderMainPage();

      // perform first analysis
      await fillProjectName(user, "TestProject");
      await selectFile(user, "requirements1.txt");
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/first analysis result/i)).toBeDefined();
      });

      // change file, which should clear analysis
      await selectFile(user, "requirements2.txt");

      // first, wait for the new filename to appear 
      // (which should confirm the "FileUpload" component 
      // updated)
      await waitFor(() => {
        expect(screen.getByText("requirements2.txt")).toBeDefined();
      });

      // then, wait for the analysis section to disappear 
      // (which confirms the main page's state cleared)
      await waitFor(() => {
        expect(screen.queryByText(/first analysis result/i)).toBeNull();
        expect(screen.queryByText(/some content here/i)).toBeNull();
      }, { timeout: 5000 });
    });

    it("should clear previous error when file is changed", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to fail
      vi.mocked(api.getAnalysisStream).mockRejectedValue(
        new Error("Analysis failed")
      );
      renderMainPage();

      // trigger error
      await fillProjectName(user, "TestProject");
      await selectFile(user, "requirements1.txt");
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis failed/i)).toBeDefined();
      });

      // change file, which should clear error
      await selectFile(user, "requirements2.txt");

      // first, wait for the new filename to appear
      // (which should confirm the "FileUpload" component 
      // updated)
      await waitFor(() => {
        expect(screen.getByText("requirements2.txt")).toBeDefined();
      });

      // then, wait for the error to disappear
      // (which confirms the main page's state cleared)
      await waitFor(() => {
        expect(screen.queryByText(/analysis failed/i)).toBeNull();
        expect(screen.queryByText(/error:/i)).toBeNull();
      }, { timeout: 5000 });
    });

    it("should reset analysis result to empty string when file changes", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Content");
        }
      );
      renderMainPage();

      // send a project for analysis
      await fillProjectName(user, "TestProject");
      await selectFile(user, "requirements1.txt");
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis content/i)).toBeDefined();
      });

      // change the file
      await selectFile(user, "requirements2.txt");

      // first, wait for the new filename to appear 
      // (which should confirm the "FileUpload" component 
      // updated)
      await waitFor(() => {
        expect(screen.getByText("requirements2.txt")).toBeDefined();
      });

      // then wait for analysis result section to 
      // disappear (which confirms the main page's state 
      // cleared)
      await waitFor(() => {
        expect(screen.queryByText(/analysis result/i)).toBeNull();
        expect(screen.queryByText(/analysis content/i)).toBeNull();
      }, { timeout: 5000 });
    });
  });

  describe("Loading Indicators", () => {
    it("should show loading indicator when starting analysis", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analyzing dependencies/i)).toBeDefined();
      });
    });

    it("should hide loading indicator when analysis completes", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Complete");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.queryByText(/analyzing dependencies/i)).toBeNull();
      });
    });

    it("should hide loading indicator on error", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to fail
      vi.mocked(api.getAnalysisStream).mockRejectedValue(
        new Error("Analysis failed")
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis failed/i)).toBeDefined();
      });

      expect(screen.queryByText(/analyzing dependencies/i)).toBeNull();
    });

    it("should show analyzing dependencies message before first chunk", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analyzing dependencies/i)).toBeDefined();
        expect(screen.getByText(/checking licenses and verifying conflicts/i)).toBeDefined();
      });
    });

    it("should show generating report badge during streaming", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis\n\n");
          await new Promise((resolve) => setTimeout(resolve, 100));
          onChunk("More content...");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeDefined();
      });
    });
  });

  describe("Streaming Analysis", () => {
    it("should append chunks in correct order", async () => {
      const user = userEvent.setup();
      const chunks = [
        "## 🛡️ LicenseGuard Report\n\n",
        "`flask`: **BSD-3-Clause**\n",
        "`requests`: **Apache-2.0**\n",
      ];
      
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          for (const chunk of chunks) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            onChunk(chunk);
          }
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/licenseguard report/i)).toBeDefined();
        expect(screen.getByText(/flask/i)).toBeDefined();
        expect(screen.getByText(/bsd-3-clause/i)).toBeDefined();
        expect(screen.getByText(/requests/i)).toBeDefined();
        expect(screen.getByText(/apache-2\.0/i)).toBeDefined();
      });
    });

    it("should accumulate chunks, not replace them", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("First chunk. ");
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("Second chunk. ");
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("Third chunk.");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        const content = screen.getByText(/first chunk.*second chunk.*third chunk/i);
        expect(content).toBeDefined();
      });
    });

    it("should handle multiple chunks with markdown content", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Dependencies\n\n");
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("- flask==2.0.1\n");
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("- django==3.2.0\n");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/dependencies/i)).toBeDefined();
        expect(screen.getByText(/flask.*2\.0\.1/i)).toBeDefined();
        expect(screen.getByText(/django.*3\.2\.0/i)).toBeDefined();
      });
    });

    it("should call getAnalysisStream with correct parameters", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Complete");
        }
      );
      renderMainPage();

      await fillProjectName(user, "MyProject");
      await selectFile(user, "requirements.txt");
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(api.getAnalysisStream).toHaveBeenCalledWith(
          "MyProject",
          expect.any(File),
          expect.any(Function)
        );
      });
    });
  });

  describe("Error Handling During Streaming", () => {
    it("should handle error thrown mid-stream after some chunks", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to ultimately fail
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Started\n\n");
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("First chunk received. ");
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error("Streaming interrupted");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/streaming interrupted/i)).toBeDefined();
      });
    });

    it("should display error message correctly during streaming", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to ultimately fail
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("Partial content...");
          throw new Error("Network error occurred");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeDefined();
      });
    });

    it("should clear loading state on error", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to ultimately fail
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("Some content");
          throw new Error("Error occurred");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeDefined();
      });

      expect(screen.queryByText(/generating report/i)).toBeNull();
    });

    it("should preserve partial analysis result when error occurs", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to ultimately fail
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Partial Analysis\n\n");
          onChunk("This content was received before error.");
          throw new Error("Error after partial content");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/error after partial content/i)).toBeDefined();
      });

      // partial content should still be visible
      expect(screen.getByText(/partial analysis/i)).toBeDefined();
      expect(screen.getByText(/this content was received before error/i)).toBeDefined();
    });

    it("should re-enable button after error", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function to ultimately fail
      vi.mocked(api.getAnalysisStream).mockRejectedValue(
        new Error("Analysis failed")
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis failed/i)).toBeDefined();
      });

      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", false);
    });
  });

  describe("UI State During Streaming", () => {
    it("should show analyzing dependencies before first chunk", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analyzing dependencies/i)).toBeDefined();
      });

      // analysis result section should not be visible yet
      expect(screen.queryByText(/analysis result/i)).toBeNull();
    });

    it("should show analysis result section once first chunk arrives", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          onChunk("## First Chunk");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis result/i)).toBeDefined();
      });
    });

    it("should show generating report badge during streaming", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis\n\n");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeDefined();
      });
    });

    it("should show markdown rendering area during streaming", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Header\n\n");
          await new Promise((resolve) => setTimeout(resolve, 100));
          onChunk("Content is streaming...");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis header/i)).toBeDefined();
        expect(screen.getByText(/content is streaming/i)).toBeDefined();
      });
    });

    it("should keep button disabled during streaming", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("Streaming content...");
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      // check button state immediately after first chunk arrives (while still streaming)
      await waitFor(() => {
        expect(screen.getByText(/streaming content/i)).toBeDefined();
        // button should be hidden during loading (not just disabled)
        expect(screen.queryByRole("button", { name: /analyze/i })).toBeNull();
      });
    });
  });

  describe("UI State When Complete", () => {
    it("should hide loading indicators when complete", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Complete Analysis\n\nAll done!");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/complete analysis/i)).toBeDefined();
      });

      expect(screen.queryByText(/analyzing dependencies/i)).toBeNull();
      expect(screen.queryByText(/generating report/i)).toBeNull();
    });

    it("should display full analysis result when complete", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Complete\n\n");
          onChunk("Summary: All packages analyzed successfully.\n\n");
          onChunk("Total Packages: 5\n");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeDefined();
        expect(screen.getByText(/summary/i)).toBeDefined();
        expect(screen.getByText(/all packages analyzed successfully/i)).toBeDefined();
        expect(screen.getByText(/total packages/i)).toBeDefined();
        expect(screen.getByText(/5/)).toBeDefined();
      });
    });

    it("should re-enable button when complete", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Analysis Complete");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeDefined();
      });

      // button should be visible and enabled again
      const analyzeButton = screen.getByRole("button", { name: /analyze/i });
      expect(analyzeButton).toHaveProperty("disabled", false);
    });

    it("should not show error message on success", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Completed Successfully\n\nAnalysis finished.");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/completed successfully/i)).toBeDefined();
      });

      // check that error alert is not present
      expect(screen.queryByText(/error:/i)).toBeNull();
    });

    it("should render markdown content properly when complete", async () => {
      const user = userEvent.setup();
      // mock the 'getAnalysisStream' function
      vi.mocked(api.getAnalysisStream).mockImplementation(
        async (projectName, file, onChunk) => {
          onChunk("## Dependencies Analysis\n\n");
          onChunk("### Package Details\n\n");
          onChunk("- flask: BSD License\n");
          onChunk("- django: MIT License\n");
        }
      );
      renderMainPage();

      await fillProjectName(user, "TestProject");
      await selectFile(user);
      await clickAnalyzeButton(user);

      await waitFor(() => {
        expect(screen.getByText(/dependencies analysis/i)).toBeDefined();
        expect(screen.getByText(/package details/i)).toBeDefined();
        expect(screen.getByText(/flask/i)).toBeDefined();
        expect(screen.getByText(/bsd license/i)).toBeDefined();
        expect(screen.getByText(/django/i)).toBeDefined();
        expect(screen.getByText(/mit license/i)).toBeDefined();
      });
    });
  });
});
