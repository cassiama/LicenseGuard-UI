import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import * as api from "@/services/api";
import { AuthProvider } from "@/contexts/auth-context";

// mock the API module
vi.mock("@/services/api", () => ({
  loginUser: vi.fn(),
}));

// mock 'useNavigate'
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// helper function to render LoginPage with router and auth context
function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// helper function to fill form fields
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  username: string,
  password: string
) {
  const usernameInput = screen.getByPlaceholderText(/enter your username/i);
  const passwordInput = screen.getByPlaceholderText(/enter your password/i);

  await user.clear(usernameInput);
  if (username) await user.type(usernameInput, username);

  await user.clear(passwordInput);
  if (password) await user.type(passwordInput, password);
}

// helper function to submit form
async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  const submitButton = screen.getByRole("button", { name: /sign in/i });
  await user.click(submitButton);
}

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Empty Fields Validation", () => {
    it("should handle empty username field", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.loginUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle empty password field", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "testuser", "");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.loginUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle username that is too short", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "abc", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.loginUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle password that is too short", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "testuser", "abc");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.loginUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle all fields empty", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "", "");
      await submitForm(user);

      await waitFor(() => {
        // should show the first validation error (username)
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.loginUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should validate minimum length of 4 characters for username", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      // exactly 4 characters should pass username validation
      await fillForm(user, "abcd", "password123");
      await submitForm(user);

      // should not show username error, but may proceed to API call
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 4 characters/i)).toBeNull();
      });
    });
  });

  describe("Error Message Display and Clearing", () => {
    it("should display error message when validation fails", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "abc", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });
    });

    it("should clear error message when user corrects input and resubmits", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      // first submission with invalid data
      await fillForm(user, "abc", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // correct the input and resubmit
      await fillForm(user, "validuser", "password123");
      await submitForm(user);

      // error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 4 characters/i)).toBeNull();
      });
    });

    it("should show only one error at a time", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // submit with multiple validation errors
      await fillForm(user, "abc", "pw");
      await submitForm(user);

      await waitFor(() => {
        // should show first error (username too short)
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // should not show other errors at the same time
      expect(screen.queryByText(/password must be at least 4 characters/i)).toBeNull();
    });

    it("should clear API error when resubmitting with valid data", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // first submission fails with API error
      vi.mocked(api.loginUser).mockRejectedValueOnce(new Error("API Error"));
      await fillForm(user, "testuser", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeDefined();
      });

      // second submission succeeds
      vi.mocked(api.loginUser).mockResolvedValueOnce({ access_token: "test-token" });
      await submitForm(user);

      // API error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid username or password/i)).toBeNull();
      });
    });
  });

  describe("Successful Form Submission", () => {
    it("should submit form successfully with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      await fillForm(user, "testuser", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(api.loginUser).toHaveBeenCalledWith("testuser", "password123");
      });
    });

    it("should navigate to home page after successful login", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      await fillForm(user, "validuser", "securepass");
      await submitForm(user);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ access_token: "test-token" }), 100))
      );
      renderLoginPage();

      await fillForm(user, "testuser", "password123");
      await submitForm(user);

      // check for loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in\.\.\./i)).toBeDefined();
      });

      // wait for submission to complete
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ access_token: "test-token" }), 100))
      );
      renderLoginPage();

      await fillForm(user, "testuser", "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toHaveProperty("disabled", true);
      });
    });

    it("should accept username with minimum valid length", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      await fillForm(user, "abcd", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(api.loginUser).toHaveBeenCalledWith("abcd", "password123");
      });
    });

    it("should accept password with minimum valid length", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      await fillForm(user, "testuser", "pass");
      await submitForm(user);

      await waitFor(() => {
        expect(api.loginUser).toHaveBeenCalledWith("testuser", "pass");
      });
    });
  });

  describe("Failed Form Submission", () => {
    it("should display error message when login fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockRejectedValue(new Error("Login failed"));
      renderLoginPage();

      await fillForm(user, "testuser", "wrongpassword");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password\. please try again\./i)).toBeDefined();
      }, { timeout: 5000 });
    });

    it("should not navigate when login fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockRejectedValue(new Error("Login failed"));
      renderLoginPage();

      await fillForm(user, "testuser", "wrongpassword");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeDefined();
      }, { timeout: 5000 });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should clear loading state after login fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockRejectedValue(new Error("Login failed"));
      renderLoginPage();

      await fillForm(user, "testuser", "wrongpassword");
      await submitForm(user);

      // wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeDefined();
      }, { timeout: 5000 });

      // loading state should be cleared
      expect(screen.queryByText(/signing in\.\.\./i)).toBeNull();

      // button should be enabled again
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toHaveProperty("disabled", false);
    });

    it("should allow retry after failed submission", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // first attempt fails
      vi.mocked(api.loginUser).mockRejectedValueOnce(new Error("Login failed"));
      await fillForm(user, "testuser", "wrongpassword");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeDefined();
      });

      // second attempt succeeds
      vi.mocked(api.loginUser).mockResolvedValueOnce({ access_token: "test-token" });
      await submitForm(user);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should show generic error message regardless of API error details", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockRejectedValue(new Error("Network error"));
      renderLoginPage();

      await fillForm(user, "testuser", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password\. please try again\./i)).toBeDefined();
      }, { timeout: 5000 });
    });

    it("should handle API rejection without error object", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockRejectedValue("String error");
      renderLoginPage();

      await fillForm(user, "testuser", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeDefined();
      }, { timeout: 5000 });
    });
  });

  describe("Form Validation Priority", () => {
    it("should validate username length before attempting login", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "abc", "password123");
      await submitForm(user);

      await waitFor(() => {
        // should show username error first
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // should not attempt API call
      expect(api.loginUser).not.toHaveBeenCalled();
    });

    it("should validate password length before attempting login", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await fillForm(user, "testuser", "abc");
      await submitForm(user);

      await waitFor(() => {
        // should show password length error first
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      }, { timeout: 5000 });

      // should not attempt API call
      expect(api.loginUser).not.toHaveBeenCalled();
    });

    it("should only attempt login after all validations pass", async () => {
      const user = userEvent.setup();
      vi.mocked(api.loginUser).mockResolvedValue({ access_token: "test-token" });
      renderLoginPage();

      await fillForm(user, "validuser", "validpass");
      await submitForm(user);

      await waitFor(() => {
        expect(api.loginUser).toHaveBeenCalledWith("validuser", "validpass");
      });

      // should not show validation errors
      expect(screen.queryByText(/username must be at least 4 characters/i)).toBeNull();
      expect(screen.queryByText(/password must be at least 4 characters/i)).toBeNull();
    });
  });
});
