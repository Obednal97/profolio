// src/lib/user.ts

export function useUser() {
  return {
    data: {
      id: "demo-user-id", // or pull from context/session
      name: "Demo User",
      email: "demo@example.com",
    },
  };
}