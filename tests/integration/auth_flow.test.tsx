import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { LoginPage } from "@/pages/LoginPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { MainPage } from "@/pages/MainPage";

// mock the functions from the API service module
vi.mock("@/services/api", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getAnalysisStream: vi.fn(),
}));

// import the mocked functions from the API module
import { loginUser, registerUser } from "@/services/api";

describe("Auth Flow Integration Tests", () => {
  const mockToken = "mock-jwt-token-12345";
  const testEmail = "test@example.com";
  const testPassword = "Password123!";

  // helper function to create router with all routes
  const createTestRouter = (initialPath = "/") => {
    return createMemoryRouter(
      [
        {
          path: "/login",
          element: <LoginPage />,
        },
        {
          path: "/register",
          element: <SignUpPage />,
        },
        {
          path: "/",
          element: <ProtectedRoute />,
          children: [
            {
              path: "/",
              element: <MainPage />,
            },
          ],
        },
      ],
      {
        initialEntries: [initialPath],
        initialIndex: 0,
      }
    );
  };

  // helper function to render the app with router
  const renderApp = (initialPath = "/") => {
    const router = createTestRouter(initialPath);
    return render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    );
  };

  beforeEach(() => {
    // clear localStorage before each test
    localStorage.clear();
    
    // reset all mocks
    vi.clearAllMocks();
    
    // setup default mock implementations
    vi.mocked(loginUser).mockResolvedValue({ access_token: mockToken });
    vi.mocked(registerUser).mockResolvedValue({ message: "User created successfully" });
  });

  afterEach(() => {
    // clean up after each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initial State and Protected Routes", () => {
    it("should redirect unauthenticated user from protected route to login page", async () => {
      renderApp("/");

      // it should be redirected to login page
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify we're on the login page
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeDefined();
      
      // verify localStorage is empty
      expect(localStorage.getItem("authToken")).toBeNull();
    });

    it("should verify isAuthenticated is false when no token in localStorage", () => {
      renderApp("/login");

      // verify no token in localStorage
      expect(localStorage.getItem("authToken")).toBeNull();
      
      // user should see login page (not redirected away to main page)
      expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
    });
  });

  describe("Sign Up Flow", () => {
    it("should successfully sign up and redirect to login page", async () => {
      const user = userEvent.setup();
      renderApp("/register");

      // verify we're on the signup page
      expect(screen.getByText(/Create Your Account/i)).toBeDefined();

      // fill in the signup form
      const emailInput = screen.getByPlaceholderText(/Enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/^Enter your password$/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);

      await user.type(emailInput, testEmail);
      await user.type(passwordInput, testPassword);
      await user.type(confirmPasswordInput, testPassword);

      // submit the form by clicking the "Sign Up" button
      const signUpButton = screen.getByText(/Sign Up/i);
      await user.click(signUpButton);

      // wait for a response from the (mock) backend API
      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith(testEmail, testPassword);
      });

      // it should redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify token is NOT stored after signup (user must login)
      expect(localStorage.getItem("authToken")).toBeNull();
    });

    it("should not store token in localStorage after signup", async () => {
      const user = userEvent.setup();
      renderApp("/register");

      // fill and submit signup form
      await user.type(screen.getByPlaceholderText(/Enter your email/i), testEmail);
      await user.type(screen.getByPlaceholderText(/^Enter your password$/i), testPassword);
      await user.type(screen.getByPlaceholderText(/Confirm your password/i), testPassword);
      
      const signUpButton = screen.getByText(/Sign Up/i);
      await user.click(signUpButton);

      // wait for redirect to the main page
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify no token in localStorage
      expect(localStorage.getItem("authToken")).toBeNull();
    });
  });

  describe("Login Flow", () => {
    it("should successfully login, store token, and redirect to main page", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // fill in the login form
      const usernameInput = screen.getByPlaceholderText(/Enter your username/i);
      const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

      await user.type(usernameInput, testEmail);
      await user.type(passwordInput, testPassword);

      // verify token is not in localStorage before login
      expect(localStorage.getItem("authToken")).toBeNull();

      // submit the form by clicking the "Sign In" button
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for a response from the (mock) backend API
      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith(testEmail, testPassword);
      });

      // it should redirect to main page
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify token is stored in localStorage
      expect(localStorage.getItem("authToken")).toBe(mockToken);
    });

    it("should verify token in localStorage matches AuthContext state after login", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for redirect to main page
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify token in localStorage
      const storedToken = localStorage.getItem("authToken");
      expect(storedToken).toBe(mockToken);

      // verify user can access protected route (proves context has token)
      expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      expect(screen.getByText(/Start by entering your project details/i)).toBeDefined();
    });

    it("should update isAuthenticated flag correctly after login", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // before login, it should be on login page (not authenticated)
      expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // after login, it should be on main page (authenticated)
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify we can see protected content
      expect(screen.getByText(/Start by entering your project details/i)).toBeDefined();
    });

    it("should update AuthContext with token after login", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for successful login and redirect
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify AuthContext is updated by checking we can access protected route
      expect(screen.getByText(/Start by entering your project details/i)).toBeDefined();
      
      // verify localStorage has the token (auth context uses this)
      expect(localStorage.getItem("authToken")).toBe(mockToken);
    });
  });

  describe("Protected Route Behavior", () => {
    it("should allow access to main page after authentication", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // it should be able to access main page
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify main page content is visible
      expect(screen.getByText(/Start by entering your project details/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/MyReallyAwesomeApp/i)).toBeDefined();
    });

    it("should verify ProtectedRoute reacts to auth state change", async () => {
      const user = userEvent.setup();
      
      // start at protected route without auth token
      renderApp("/");

      // it should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // it should now access the protected route
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });
    });
  });

  describe("Logout Flow", () => {
    it("should clear token from localStorage and redirect to login on logout", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for redirect to main page
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify token is in localStorage
      expect(localStorage.getItem("authToken")).toBe(mockToken);

      // logout by clicking the "Logout" button
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      // it should redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify token is removed from localStorage
      expect(localStorage.getItem("authToken")).toBeNull();
    });

    it("should update isAuthenticated flag to false after logout", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for main page (authenticated)
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // logout
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      // should be back on login page (not authenticated)
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify we can't access protected content
      expect(screen.queryByText(/Analyze New Project/i)).toBeNull();
    });

    it("should clear all auth state everywhere on logout", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // wait for main page
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });

      // verify authenticated state
      expect(localStorage.getItem("authToken")).toBe(mockToken);
      expect(screen.getByText(/Analyze New Project/i)).toBeDefined();

      // logout
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      // wait for redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });

      // verify all state is cleared
      expect(localStorage.getItem("authToken")).toBeNull();
      expect(screen.queryByText(/Analyze New Project/i)).toBeNull();
      expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
    });
  });

  describe("Token and Context Synchronization", () => {
    it("should maintain token sync between localStorage and context throughout auth flow", async () => {
      const user = userEvent.setup();
      renderApp("/login");

      // in initial state, there should be no token
      expect(localStorage.getItem("authToken")).toBeNull();

      // login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // after login, the token should be in localStorage and auth context should be updated
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });
      expect(localStorage.getItem("authToken")).toBe(mockToken);

      // logout
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      // after logout, the token should be removed and auth context should be cleared
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });
      expect(localStorage.getItem("authToken")).toBeNull();
    });

    it("should verify context state matches localStorage at each step", async () => {
      const user = userEvent.setup();
      
      // 1. start in unauthenticated state
      renderApp("/");
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });
      expect(localStorage.getItem("authToken")).toBeNull();

      // 2. login
      await user.type(screen.getByPlaceholderText(/Enter your username/i), testEmail);
      await user.type(screen.getByPlaceholderText(/Enter your password/i), testPassword);
      
      const signInButton = screen.getByRole("button", { name: /Sign In/i });
      await user.click(signInButton);

      // 3. verify authenticated state
      await waitFor(() => {
        expect(screen.getByText(/Analyze New Project/i)).toBeDefined();
      });
      const storedToken = localStorage.getItem("authToken");
      expect(storedToken).toBe(mockToken);
      // if we passed the prev. steps, then the context is in sync because we can access protected route
      expect(screen.getByText(/Start by entering your project details/i)).toBeDefined();

      // 4. logout
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);

      // 5. verify unauthenticated state
      await waitFor(() => {
        expect(screen.getByText(/Welcome back! Please sign in to your account/i)).toBeDefined();
      });
      expect(localStorage.getItem("authToken")).toBeNull();
      // if we passed the prev. steps, then the context is in sync because we're redirected to login
      expect(screen.queryByText(/Analyze New Project/i)).toBeNull();
    });
  });
});
