import { test, expect } from "@playwright/test";

/**
 * E2E Test: Complete Auth Flow
 * 
 * This test verifies the complete authentication journey:
 * 1. sign up for a new account
 * 2. verify redirect to login page
 * 3. login with credentials
 * 4. verify token storage and access to protected route
 * 5. logout and verify token removal
 */

test.describe("Complete Auth Flow End-to-End", () => {
  const testEmail = "e2e-test@example.com";
  const testPassword = "E2EPassword123!";

  test.beforeEach(async ({ page }) => {
    // clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should complete full flow: signup -> login -> access main page -> logout", async ({ page }) => {
    // 1. mock the registration API endpoint
    await page.route("**/users", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "User created successfully"
          })
        });
      }
    });

    // 2. navigate to signup page
    await page.goto("/register");
    
    // verify we're on the signup page
    await expect(page.locator("text=Create Your Account")).toBeVisible();

    // fill in the signup form
    await page.fill('input[placeholder*="Enter your email"]', testEmail);
    await page.locator('input[placeholder*="Enter your password"]').first().fill(testPassword);
    await page.fill('input[placeholder*="Confirm your password"]', testPassword);

    await page.screenshot();

    // submit the form by clicking the "Sign Up" button
    await page.click('button:has-text("Sign Up")');

    // 3. it should redirect to login page after signup
    await expect(page.locator("text=Welcome back! Please sign in to your account")).toBeVisible({ timeout: 10000 });
    
    // verify no token in localStorage after signup
    const tokenAfterSignup = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(tokenAfterSignup).toBeNull();

    // 4. mock the login API endpoint
    await page.route("**/users/token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-jwt-token-12345",
          token_type: "bearer"
        })
      });
    });

    // 5. login with the newly created account
    await page.fill('input[placeholder*="Enter your username"]', testEmail);
    await page.fill('input[placeholder*="Enter your password"]', testPassword);
    await page.click('button:has-text("Sign In")');

    // 6. it should redirect to main page with token stored
    await expect(page.locator("text=Analyze New Project")).toBeVisible();
    
    // verify token is stored in localStorage
    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(tokenAfterLogin).not.toBeNull();
    expect(tokenAfterLogin).toBe("mock-jwt-token-12345");

    // 7. verify main page is accessible and content is visible
    await expect(page.locator("text=Start by entering your project details")).toBeVisible();
    await expect(page.locator('input[placeholder="MyReallyAwesomeApp"]')).toBeVisible();

    // 8. logout by clicking the "Logout" button
    await page.click('button:has-text("Logout")');

    // 9. it should redirect to login page after logout
    await expect(page.locator("text=Welcome back! Please sign in to your account")).toBeVisible();
    
    // verify token is removed from localStorage
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(tokenAfterLogout).toBeNull();

    // verify we can't access protected content
    await expect(page.locator("text=Analyze New Project")).not.toBeVisible();
  });
});
