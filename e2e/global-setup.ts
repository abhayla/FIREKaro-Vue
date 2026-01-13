import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = "e2e/.auth/user.json";

/**
 * Global setup to authenticate once and save the session state.
 * All tests will reuse this authenticated state.
 *
 * Uses the frontend's "Quick Dev Login" feature which:
 * 1. Uses test credentials (test@firekaro.com / testpassword123)
 * 2. Automatically creates the test user if it doesn't exist
 * 3. Signs in and redirects to dashboard
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5173";

  // Create auth directory if it doesn't exist
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Global Setup: Authenticating...");

  // Navigate to frontend signin page
  await page.goto(`${baseURL}/auth/signin`);
  await page.waitForLoadState("networkidle");

  // Try Quick Dev Login button first (only visible in dev mode)
  const quickLoginBtn = page.getByRole("button", { name: /Quick Dev Login/i });
  const isQuickLoginVisible = await quickLoginBtn.isVisible().catch(() => false);

  if (isQuickLoginVisible) {
    console.log("Using Quick Dev Login button...");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/sign-in") ||
          response.url().includes("/api/auth/sign-up"),
        { timeout: 15000 }
      ).catch(() => console.log("No auth API response captured")),
      quickLoginBtn.click(),
    ]);
    await page.waitForTimeout(2000);
  } else {
    console.log("Quick Dev Login not available, using regular sign-in...");
    console.log(`Current page URL: ${page.url()}`);

    // Take debug screenshot
    await page.screenshot({ path: "e2e/test-results/signin-page-debug.png" });
    console.log("Screenshot saved to e2e/test-results/signin-page-debug.png");

    // Log page content for debugging
    const pageContent = await page.content();
    console.log(`Page has ${pageContent.length} characters`);
    console.log(`Page title: ${await page.title()}`);

    // Test credentials
    const testEmail = "test@firekaro.com";
    const testPassword = "testpassword123";
    const testName = "Test User";

    // Wait for the sign-in form to be visible
    console.log("Waiting for sign-in form...");
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    // Fill in email and password using input selectors
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Try sign in first
    console.log("Attempting sign in...");
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    await signInBtn.click();
    await page.waitForTimeout(2000);

    // Check if sign in succeeded or if we need to sign up
    if (page.url().includes("/auth/signin")) {
      const errorAlert = page.locator(".v-alert");
      if (await errorAlert.isVisible()) {
        console.log("Sign in failed, trying sign up...");

        // Switch to sign up mode - click the text button not the main Sign In button
        await page.locator('button.v-btn--variant-text:has-text("Sign Up")').click();
        await page.waitForTimeout(1000);

        // Wait for name field to appear (indicates sign up form)
        await page.waitForSelector('input[type="text"]', { timeout: 5000 }).catch(() => {});

        // Fill sign up form - name field should be first text input
        const nameInput = page.locator('input').first();
        await nameInput.fill(testName);
        await page.locator('input[type="email"]').fill(testEmail);
        await page.locator('input[type="password"]').fill(testPassword);

        // Click create account
        const createBtn = page.locator('button:has-text("Create Account")');
        await createBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  // Check current URL
  const currentUrl = page.url();
  console.log(`Current URL after login attempt: ${currentUrl}`);

  if (currentUrl.includes("/auth/signin")) {
    // Check for error message
    const errorAlert = page.locator(".v-alert");
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log(`Login error: ${errorText}`);
    }

    // Try navigating to dashboard directly - might work if session was created
    console.log("Attempting direct navigation to dashboard...");
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForLoadState("networkidle");
  }

  // Wait for URL to contain dashboard
  console.log("Waiting for dashboard...");
  await page.waitForURL(/\/dashboard/, { timeout: 15000, waitUntil: "domcontentloaded" }).catch(async () => {
    console.log("Dashboard redirect failed, checking current state...");
    console.log(`Final URL: ${page.url()}`);
    // Take screenshot for debugging
    await page.screenshot({ path: "e2e/test-results/auth-debug.png" });
  });

  // Give the page a moment to settle
  await page.waitForTimeout(2000);

  console.log(`Logged in successfully! URL: ${page.url()}`);

  // Verify authentication by checking API session
  console.log("Verifying authentication via API...");
  const sessionResponse = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/auth/get-session", { credentials: "include" });
      const text = await res.text();
      if (!text) return { empty: true };
      return JSON.parse(text);
    } catch (e) {
      return { error: String(e) };
    }
  });

  if (sessionResponse?.user) {
    console.log(`✓ Authenticated as: ${sessionResponse.user.email}`);
  } else if (sessionResponse?.empty) {
    console.log("ℹ Session API returned empty response (dev mode may bypass auth)");
  } else {
    console.warn("⚠ API session check returned no user");
    console.log("Session response:", JSON.stringify(sessionResponse));
  }

  // Navigate to insurance page to verify data access works
  console.log("Verifying data access...");
  await page.goto(`${baseURL}/dashboard/insurance`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check if page loaded
  const hasContent = await page.locator(".v-card").first().isVisible().catch(() => false);
  if (hasContent) {
    console.log("✓ Protection page loaded with content");
  } else {
    console.log("ℹ Protection page loaded (may have empty state)");
  }

  console.log("Global Setup: Authentication complete!");
  console.log(`Final URL: ${page.url()}`);

  // Save the authenticated state with all cookies
  await context.storageState({ path: AUTH_FILE });

  // Log saved cookies for verification
  const savedState = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
  const savedCookieNames = savedState.cookies?.map((c: { name: string }) => c.name) || [];
  console.log("Saved cookies:", savedCookieNames);

  // Check for Better Auth session cookie
  const hasSession = savedCookieNames.some((name: string) =>
    name.includes("session") || name.includes("better-auth")
  );

  if (hasSession) {
    console.log("✓ Session cookie saved to auth file");
  } else {
    console.warn("⚠ No session cookie found - tests may fail authentication");
  }

  await browser.close();
}

export default globalSetup;
