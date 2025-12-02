import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";

// mock the auth context module
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

// import the mocked useAuth hook
import { useAuth } from "@/contexts/auth-context";

describe("ProtectedRoute Component", () => {
  // test child component to verify rendering
  const TestChildComponent = () => <div>Protected Content</div>;
  const LoginPage = () => <div>Login Page</div>;

  // helper function to create router with protected route
  const createTestRouter = (initialPath = "/") => {
    return createMemoryRouter(
      [
        {
          path: "/login",
          element: <LoginPage />,
        },
        {
          path: "/",
          element: <ProtectedRoute />,
          children: [
            {
              path: "/",
              element: <TestChildComponent />,
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

  // helper function to render the router
  const renderRouter = (initialPath = "/") => {
    const router = createTestRouter(initialPath);
    return render(<RouterProvider router={router} />);
  };

  beforeEach(() => {
    // reset all mocks before each test
    vi.clearAllMocks();
  });

  describe("Unauthenticated User", () => {
    it("should redirect to /login when user is not authenticated", () => {
      // mock 'useAuth' to return unauthenticated state
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderRouter("/");

      // verify redirect to login page occurred
      expect(screen.getByText("Login Page")).toBeDefined();
      
      // verify protected content is NOT rendered
      expect(screen.queryByText("Protected Content")).toBeNull();
    });
  });

  describe("Authenticated User", () => {
    it("should render child routes when user is authenticated", () => {
      // mock useAuth to return authenticated state
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        token: "mock-token-123",
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderRouter("/");

      // verify child component is rendered
      expect(screen.getByText("Protected Content")).toBeDefined();
      
      // verify NOT redirected to login page
      expect(screen.queryByText("Login Page")).toBeNull();
    });
  });
});
