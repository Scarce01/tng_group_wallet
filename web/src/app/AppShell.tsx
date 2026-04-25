import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMe } from "../api/hooks";
import { LoginPage } from "./LoginPage";
import { tokens } from "../api/client";
import App from "./App";

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Gate() {
  const me = useMe();

  // No token at all → straight to login
  if (!tokens.access) return <LoginPage />;

  // Have a token but it's invalid/expired and refresh failed → bounce to login
  if (me.isError) {
    tokens.clear();
    return <LoginPage />;
  }

  if (me.isLoading || !me.data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  return <App />;
}

export default function AppShell() {
  return (
    <QueryClientProvider client={qc}>
      <Gate />
    </QueryClientProvider>
  );
}
