import { useState, type FormEvent } from "react";
import { Wallet, AlertCircle, QrCode } from "lucide-react";
import { useLogin, useQrLogin } from "../api/hooks";

const DEMO_USERS = [
  { phone: "+60112345001", name: "Ahmad", role: "Owner of both pools" },
  { phone: "+60112345002", name: "Siti", role: "Family member" },
  { phone: "+60112345003", name: "Raj", role: "Trip member" },
  { phone: "+60112345004", name: "Mei", role: "Trip member" },
];

export function LoginPage() {
  const [phone, setPhone] = useState("+60112345001");
  const [pin, setPin] = useState("123456");
  const login = useLogin();
  const qrLogin = useQrLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ phone, pin });
  };

  const handleQrLogin = () => {
    qrLogin.mutate({ phone, pin });
  };

  const anyError = login.error ?? qrLogin.error;
  const errorVisible = login.isError || qrLogin.isError;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F5F7FA 0%, #FFFFFF 100%)",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* TNG-style header */}
      <div
        style={{
          width: "100%",
          background:
            "linear-gradient(167.377deg, rgb(0, 89, 189) 28.712%, rgb(23, 123, 175) 91.772%)",
          padding: "60px 24px 80px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.16)",
            width: 64,
            height: 64,
            borderRadius: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Wallet size={30} strokeWidth={2} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>
          TNG! Group Wallet
        </h1>
        <p style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>Trip & Family pools, on TNG eWallet</p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          padding: 24,
          width: "calc(100% - 32px)",
          maxWidth: 400,
          marginTop: -40,
          position: "relative",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>Sign in</h2>
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>
          Use your TNG phone & PIN
        </p>

        <form onSubmit={submit}>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.trim())}
            placeholder="+60112345001"
            style={inputStyle}
            autoComplete="tel"
          />

          <label style={{ ...labelStyle, marginTop: 14 }}>6-digit PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.trim())}
            placeholder="••••••"
            maxLength={6}
            inputMode="numeric"
            style={inputStyle}
            autoComplete="current-password"
          />

          {errorVisible && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: "#FEECEC",
                color: "#B42318",
                borderRadius: 8,
                fontSize: 13,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{(anyError as Error)?.message ?? "Login failed"}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending || qrLogin.isPending}
            style={{
              marginTop: 20,
              width: "100%",
              height: 48,
              background: login.isPending ? "#A0AEC0" : "#0055D6",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: login.isPending ? "wait" : "pointer",
            }}
          >
            {login.isPending ? "Signing in…" : "Sign in"}
          </button>

          {/* QR steganographic sign-in (kiosk-style) */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span>or</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>
          <button
            type="button"
            onClick={handleQrLogin}
            disabled={login.isPending || qrLogin.isPending}
            style={{
              marginTop: 12,
              width: "100%",
              height: 44,
              background: "#fff",
              color: "#0055D6",
              border: "1px solid #0055D6",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: qrLogin.isPending ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <QrCode size={18} />
            {qrLogin.isPending ? "Generating + verifying QR…" : "Sign in with stega QR"}
          </button>

          {qrLogin.isSuccess && qrLogin.data && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                borderRadius: 10,
                fontSize: 12,
                color: "#075985",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                ✓ Verified via steganographic QR
              </div>
              <div>visible: <code>{qrLogin.data.issued.visiblePayload}</code></div>
              <div>hidden tag: <code>{qrLogin.data.issued.tag}</code> (HMAC-SHA256/4)</div>
              <img
                src={qrLogin.data.issued.image}
                alt="stega QR"
                style={{ width: 120, marginTop: 8, imageRendering: "pixelated" as const }}
              />
            </div>
          )}
        </form>
      </div>

      {/* Demo accounts */}
      <div
        style={{
          marginTop: 18,
          width: "calc(100% - 32px)",
          maxWidth: 400,
          background: "#ECF2FE",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0055D6", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
          Demo accounts (PIN 123456)
        </div>
        {DEMO_USERS.map((u) => (
          <button
            key={u.phone}
            type="button"
            onClick={() => {
              setPhone(u.phone);
              setPin("123456");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "8px 4px",
              background: "transparent",
              border: "none",
              borderTop: "1px solid rgba(0,85,214,0.12)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{u.role}</div>
            </div>
            <div style={{ fontSize: 11, color: "#0055D6", fontWeight: 600 }}>{u.phone}</div>
          </button>
        ))}
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
  letterSpacing: 0.3,
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #CBD5E1",
  fontSize: 15,
  fontFamily: "inherit",
  background: "#fff",
  color: "#0F172A",
  outline: "none",
  boxSizing: "border-box",
};
