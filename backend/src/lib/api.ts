export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json();
    const errMsg = typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : "API request failed";
    throw new Error(errMsg);  }

  return res.json() as Promise<T>;
}