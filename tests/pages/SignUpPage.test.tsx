import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SignUpPage } from "@/pages/SignUpPage";
import * as api from "@/services/api";

// mock the API module
vi.mock("@/services/api", () => ({
  registerUser: vi.fn(),
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

// helper function to render SignUpPage with router
function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>
  );
}

// helper function to fill form fields
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
  confirmPassword: string
) {
  const emailInput = screen.getByPlaceholderText(/enter your email/i);
  const passwordInput = screen.getByPlaceholderText(/enter your password/i);
  const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);

  await user.clear(emailInput);
  if (email) await user.type(emailInput, email);
  
  await user.clear(passwordInput);
  if (password) await user.type(passwordInput, password);
  
  await user.clear(confirmPasswordInput);
  if (confirmPassword) await user.type(confirmPasswordInput, confirmPassword);
}

// helper function to submit form
async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  const submitButton = screen.getByRole("button", { name: /sign up/i });
  await user.click(submitButton);
}

describe("SignUpPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Mismatch Detection", () => {
    it("should detect when passwords are mismatched", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "differentPassword");
      await submitForm(user);

      // wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      });
    });

    it("should not submit form when passwords are mismatched", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password456");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      });

      // verify registerUser was not called
      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show password mismatch error even with valid email and password length", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "validuser@test.com", "validpass", "differentpass");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Empty Fields Validation", () => {
    it("should handle empty email field", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle empty password field", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "test@example.com", "", "");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle email that is too short", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "a@b", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle password that is too short", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "test@example.com", "abc", "abc");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle all fields empty", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "", "", "");
      await submitForm(user);

      await waitFor(() => {
        // should show the first validation error (username)
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      expect(api.registerUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should validate minimum length of 4 characters for email", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      // exactly 4 characters should pass email validation
      await fillForm(user, "abcd", "password123", "password123");
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
      renderSignUpPage();

      await fillForm(user, "a@b", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });
    });

    it("should clear error message when user corrects input and resubmits", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      // first submission with invalid data
      await fillForm(user, "a@b", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // correct the input and resubmit
      await fillForm(user, "validuser@test.com", "password123", "password123");
      await submitForm(user);

      // error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 4 characters/i)).toBeNull();
      });
    });

    it("should clear password mismatch error when passwords are corrected", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      // first submission with mismatched passwords
      await fillForm(user, "test@example.com", "password123", "password456");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      });

      // correct the passwords and resubmit
      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      // error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).toBeNull();
      });
    });

    it("should show only one error at a time", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      // submit with multiple validation errors
      await fillForm(user, "a@b", "pw", "different");
      await submitForm(user);

      await waitFor(() => {
        // should show first error (username too short)
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // should not show other errors simultaneously
      expect(screen.queryByText(/password must be at least 4 characters/i)).toBeNull();
      expect(screen.queryByText(/passwords do not match/i)).toBeNull();
    });

    it("should clear API error when resubmitting with valid data", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      // first submission fails with API error
      vi.mocked(api.registerUser).mockRejectedValueOnce(new Error("API Error"));
      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      });

      // second submission succeeds
      vi.mocked(api.registerUser).mockResolvedValueOnce({ success: true });
      await submitForm(user);

      // API error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/failed to create account/i)).toBeNull();
      });
    });
  });

  describe("Successful Form Submission", () => {
    it("should submit form successfully with valid data", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(api.registerUser).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should navigate to login page after successful registration", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      await fillForm(user, "newuser@test.com", "securepass", "securepass");
      await submitForm(user);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      // check for loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeDefined();
      });

      // wait for submission to complete
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");

      const submitButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(submitButton);

      // button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toHaveProperty("disabled", true);
      });
    });

    it("should accept email with minimum valid length", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      await fillForm(user, "a@bc", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(api.registerUser).toHaveBeenCalledWith("a@bc", "password123");
      });
    });

    it("should accept password with minimum valid length", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockResolvedValue({ success: true });
      renderSignUpPage();

      await fillForm(user, "test@example.com", "pass", "pass");
      await submitForm(user);

      await waitFor(() => {
        expect(api.registerUser).toHaveBeenCalledWith("test@example.com", "pass");
      });
    });
  });

  describe("Failed Form Submission", () => {
    it("should display error message when registration fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockRejectedValue(new Error("Registration failed"));
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      }, { timeout: 5000 });
    });

    it("should not navigate when registration fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockRejectedValue(new Error("Registration failed"));
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      }, { timeout: 5000 });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should clear loading state after registration fails", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockRejectedValue(new Error("Registration failed"));
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      // wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      }, { timeout: 5000 });

      // loading state should be cleared
      expect(screen.queryByText(/creating account/i)).toBeNull();

      // button should be enabled again
      const submitButton = screen.getByRole("button", { name: /sign up/i });
      expect(submitButton).toHaveProperty("disabled", false);
    });

    it("should allow retry after failed submission", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      // first attempt fails
      vi.mocked(api.registerUser).mockRejectedValueOnce(new Error("Registration failed"));
      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      });

      // second attempt succeeds
      vi.mocked(api.registerUser).mockResolvedValueOnce({ success: true });
      await submitForm(user);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });

    it("should show generic error message regardless of API error details", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockRejectedValue(new Error("Network error"));
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account\. email may already be in use\./i)).toBeDefined();
      }, { timeout: 5000 });
    });

    it("should handle API rejection without error object", async () => {
      const user = userEvent.setup();
      vi.mocked(api.registerUser).mockRejectedValue("String error");
      renderSignUpPage();

      await fillForm(user, "test@example.com", "password123", "password123");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeDefined();
      }, { timeout: 5000 });
    });
  });

  describe("Form Validation Priority", () => {
    it("should validate email length before password match", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "a@b", "password123", "password456");
      await submitForm(user);

      await waitFor(() => {
        // should show email error first
        expect(screen.getByText(/username must be at least 4 characters/i)).toBeDefined();
      });

      // should not show password mismatch error yet
      expect(screen.queryByText(/passwords do not match/i)).toBeNull();
    });

    it("should validate password length before password match", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "test@example.com", "ab", "cd");
      await submitForm(user);

      await waitFor(() => {
        // should show password length error first
        expect(screen.getByText(/password must be at least 4 characters/i)).toBeDefined();
      }, { timeout: 5000 });

      // should not show password mismatch error yet
      expect(screen.queryByText(/passwords do not match/i)).toBeNull();
    });

    it("should show password mismatch only after other validations pass", async () => {
      const user = userEvent.setup();
      renderSignUpPage();

      await fillForm(user, "validuser@test.com", "password123", "password456");
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      }, { timeout: 5000 });

      // should not show other validation errors
      expect(screen.queryByText(/username must be at least 4 characters/i)).toBeNull();
      expect(screen.queryByText(/password must be at least 4 characters/i)).toBeNull();
    });
  });
});
