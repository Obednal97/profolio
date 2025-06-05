import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth, useUser } from "@/hooks/useAuth";
import type { Auth, User as FirebaseUser } from "firebase/auth";

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/test-path",
}));

// Mock Firebase initialization
vi.mock("@/lib/firebase", () => ({
  getFirebase: vi.fn().mockResolvedValue({
    app: { name: "test-app" },
    auth: {
      currentUser: null,
    },
  }),
}));

// Mock demo data
vi.mock("@/lib/demoData", () => ({
  initializeDemoData: vi.fn().mockResolvedValue(undefined),
}));

// Mock demo session manager
vi.mock("@/lib/demoSession", () => ({
  DemoSessionManager: {
    startDemoSession: vi.fn().mockReturnValue(true),
    endDemoSession: vi.fn(),
    isDemoMode: vi.fn().mockReturnValue(false),
    checkDemoSession: vi.fn().mockReturnValue({
      isValid: false,
      remainingTime: 0,
    }),
  },
}));

// Mock global crypto
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn().mockReturnValue("test-uuid-123"),
  },
});

describe("useAuth Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it("provides authentication methods", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signUpWithCredentials).toBe("function");
    expect(typeof result.current.signInWithDemo).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.forceLogout).toBe("function");
  });

  it("handles demo sign in", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signInWithDemo({ redirect: false });
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("user");
    });
  });

  it("handles successful sign up", async () => {
    const mockUserCredential = {
      user: {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      },
    };

    const {
      createUserWithEmailAndPassword,
      updateProfile,
      onAuthStateChanged,
    } = await import("firebase/auth");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(
      mockUserCredential as any
    );
    vi.mocked(updateProfile).mockResolvedValue(undefined);
    vi.mocked(onAuthStateChanged).mockImplementation(() => {
      return vi.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUpWithCredentials({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );
  });

  it("handles sign out", async () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { replace: vi.fn() } as any;

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut({ redirect: false });
    });

    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(
      "demo-auth-token"
    );
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(
      "demo-user-data"
    );
  });

  it("handles force logout", async () => {
    const { getFirebase } = await import("@/lib/firebase");

    vi.mocked(getFirebase).mockResolvedValue({
      app: { name: "test-app" },
      auth: { signOut: vi.fn() },
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.forceLogout();
    });

    expect(window.sessionStorage.removeItem).toHaveBeenCalled();
  });
});

describe("useUser Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with loading state", () => {
    const { result } = renderHook(() => useUser());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
  });

  it("handles demo session", async () => {
    const { DemoSessionManager } = await import("@/lib/demoSession");
    vi.mocked(DemoSessionManager.checkDemoSession).mockReturnValue({
      isValid: true,
      remainingTime: 3600,
    });

    // Mock demo user data
    vi.mocked(window.sessionStorage.getItem).mockReturnValue(
      JSON.stringify({
        id: "demo-user-id",
        email: "demo@profolio.com",
        name: "Demo User",
      })
    );

    const { result } = renderHook(() => useUser());

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveProperty("email", "demo@profolio.com");
  });
});
