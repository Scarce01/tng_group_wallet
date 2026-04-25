import { useEffect, useState, type FormEvent } from "react";
import { Wallet, AlertCircle, ShieldCheck, QrCode, Smartphone } from "lucide-react";
import {
  useDeviceBindLogin,
  useQrLogin,
  getOrCreateDeviceId,
  getDeviceLabel,
} from "../api/hooks";

const DEMO_USERS = [
  { phone: "+60112345001", name: "Ahmad", role: "Owner of both pools" },
  { phone: "+60112345002", name: "Siti", role: "Family member" },
  { phone: "+60112345003", name: "Raj", role: "Trip member" },
  { phone: "+60112345004", name: "Mei", role: "Trip member" },
];

export function LoginPage() {
  const [phone, setPhone] = useState("+60112345001");
  const deviceBind = useDeviceBindLogin();

  // QR sign-in still ships behind a disclosure since it needs the legacy
  // PIN-based issue endpoint. It's only shown if the user expands it.
  const [showQr, setShowQr] = useState(false);
  const [qrPin, setQrPin] = useState("123456");
  const qrLogin = useQrLogin();

  const [deviceId] = useState(() => getOrCreateDeviceId());
  const [deviceLabel] = useState(() => getDeviceLabel());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    deviceBind.mutate({ phone });
  };

  const anyError = deviceBind.error ?? qrLogin.error;
  const errorVisible = deviceBind.isError || qrLogin.isError;

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
        <p style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>
          Trip & Family pools, on TNG eWallet
        </p>
      </div>

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
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 4px" }}>
          Sign in with TNG
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
          We'll send an approval request to your TNG app. No PIN, no SMS.
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
            disabled={deviceBind.isPending}
          />

          <DeviceCard deviceLabel={deviceLabel} deviceId={deviceId} />

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

          {deviceBind.isPending ? (
            <WaitingApproval phone={phone} />
          ) : (
            <button
              type="submit"
              disabled={!phone}
              style={{
                marginTop: 16,
                width: "100%",
                height: 48,
                background: !phone ? "#A0AEC0" : "#0055D6",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: !phone ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ShieldCheck size={18} />
              Verify with TNG
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          style={{
            marginTop: 18,
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#0055D6",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {showQr ? "Hide QR sign-in" : "Or sign in with stega QR"}
        </button>

        {showQr && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
              Legacy demo path: PIN + steganographic QR. Real users should use
              the device-bind flow above.
            </div>
            <label style={labelStyle}>PIN</label>
            <input
              type="password"
              value={qrPin}
              onChange={(e) => setQrPin(e.target.value.trim())}
              placeholder="••••••"
              maxLength={6}
              inputMode="numeric"
              style={inputStyle}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => qrLogin.mutate({ phone, pin: qrPin })}
              disabled={qrLogin.isPending}
              style={{
                marginTop: 10,
                width: "100%",
                height: 40,
                background: "#fff",
                color: "#0055D6",
                border: "1px solid #0055D6",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: qrLogin.isPending ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <QrCode size={16} />
              {qrLogin.isPending ? "Verifying QR…" : "Sign in with QR"}
            </button>
          </div>
        )}
      </div>

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
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#0055D6",
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Demo accounts
        </div>
        {DEMO_USERS.map((u) => (
          <button
            key={u.phone}
            type="button"
            onClick={() => setPhone(u.phone)}
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

function DeviceCard({ deviceLabel, deviceId }: { deviceLabel: string; deviceId: string }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 12px",
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Smartphone size={18} color="#0055D6" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#475569" }}>This device</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0F172A",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={deviceId}
        >
          {deviceLabel}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#94A3B8",
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={deviceId}
        >
          {deviceId}
        </div>
      </div>
    </div>
  );
}

function WaitingApproval({ phone }: { phone: string }) {
  // Mirrors the backend default DEVICE_BIND_TTL_SECONDS=120 so the
  // user sees the same window the server is enforcing.
  const TTL_SECONDS = 120;
  const [secondsLeft, setSecondsLeft] = useState(TTL_SECONDS);
  useEffect(() => {
    const t = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        color: "#0F172A",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          margin: "0 auto 10px",
          border: "3px solid #BFDBFE",
          borderTopColor: "#0055D6",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        Open the TNG app to approve
      </div>
      <div style={{ fontSize: 12, color: "#475569" }}>
        We sent a request to <strong>{phone}</strong>.
      </div>
      <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
        Expires in <strong>{mm}:{ss}</strong>
      </div>
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
