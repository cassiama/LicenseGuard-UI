import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/ui/header";

describe("Header Component", () => {
  describe("Logout Button Callback", () => {
    it("should fire onLogout callback when logout button is clicked", async () => {
      const user = userEvent.setup();
      const onLogoutMock = vi.fn();
      
      render(<Header onLogout={onLogoutMock} />);

      // find and click the logout button
      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      // verify onLogout was called exactly once
      expect(onLogoutMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Rendering Without Callback", () => {
    it("should render successfully when no onLogout callback is provided", () => {
      // should not throw error when onLogout is undefined
      expect(() => render(<Header />)).not.toThrow();

      // verify component renders with expected content
      expect(screen.getByText(/LicenseGuard/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /logout/i })).toBeDefined();
    });
  });
});
