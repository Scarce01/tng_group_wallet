import { useState, useEffect, type FormEvent } from "react";
import { motion as Motion } from "motion/react";
import { Shield, Smartphone, AlertCircle } from "lucide-react";
import logoImg from "../imports/ChatGPT_Image_Apr_25,_2026,_12_20_26_PM.png";
import {
  useDeviceBindLogin,
  getOrCreateDeviceId,
  getDeviceLabel,
} from "../api/hooks";
import { api, tokens, type AuthResult } from "../api/client";

const DEV_SKIP_ENABLED = import.meta.env.DEV;

export function LoginPage() {
  const [phone, setPhone] = useState("");
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullSlogan = "Shared money, made simple";

  const deviceBind = useDeviceBindLogin();
  const [deviceId] = useState(() => getOrCreateDeviceId());
  const [deviceLabel] = useState(() => getDeviceLabel());
  const isAuthenticating = deviceBind.isPending;

  useEffect(() => {
    if (typedText.length < fullSlogan.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullSlogan.slice(0, typedText.length + 1));
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [typedText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const canSubmit = phone.length >= 9 && !isAuthenticating;

  const handleVerify = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    deviceBind.mutate({ phone: `+60${phone}` });
  };

  const [devLoggingIn, setDevLoggingIn] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const handleDevSkip = async () => {
    if (devLoggingIn) return;
    setDevLoggingIn(true);
    setDevError(null);
    try {
      const auth = await api<AuthResult>("/auth/login", {
        method: "POST",
        body: { phone: "+60112345001", pin: "123456" },
        noAuth: true,
      });
      tokens.setSession(auth.accessToken, auth.refreshToken, auth.user);
      window.location.reload();
    } catch (err) {
      setDevError((err as Error)?.message ?? "Dev login failed");
      setDevLoggingIn(false);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 30%, #005AFF 0%, #003BA3 40%, #001F5C 100%)",
      }}
    >
      {/* Animated particles */}
      {[...Array(12)].map((_, i) => (
        <Motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: "rgba(255,255,255,0.3)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Light bokeh effects */}
      {[...Array(8)].map((_, i) => (
        <Motion.div
          key={`bokeh-${i}`}
          className="absolute rounded-full blur-xl"
          style={{
            width: Math.random() * 120 + 60,
            height: Math.random() * 120 + 60,
            background: `radial-gradient(circle, rgba(255,255,255,${
              Math.random() * 0.15 + 0.05
            }) 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20],
            y: [0, Math.random() * 40 - 20],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div
        className="relative z-10 flex flex-col items-center justify-center px-6"
        style={{ minHeight: "100vh" }}
      >
        {/* Logo + Brand */}
        <Motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Motion.div
            className="relative mb-4"
            animate={{
              filter: [
                "drop-shadow(0 0 20px rgba(255,255,255,0.4))",
                "drop-shadow(0 0 30px rgba(255,255,255,0.6))",
                "drop-shadow(0 0 20px rgba(255,255,255,0.4))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <img
              src={logoImg}
              alt="KongsiGo Logo"
              className="w-36 h-36 object-contain"
            />
          </Motion.div>

          <Motion.div
            className="text-white text-lg min-h-[28px]"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {typedText}
            <span
              className="inline-block w-[2px] h-5 ml-0.5 align-middle"
              style={{
                background: "white",
                opacity:
                  showCursor && typedText.length === fullSlogan.length ? 1 : 0,
                transition: "opacity 0.1s",
              }}
            />
          </Motion.div>
        </Motion.div>

        {/* Particle stream */}
        {[...Array(6)].map((_, i) => (
          <Motion.div
            key={`stream-${i}`}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              background: "rgba(255,255,255,0.7)",
              left: "50%",
              top: "25%",
            }}
            animate={{
              y: [0, 200],
              x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Frosted Glass Login Card */}
        <Motion.form
          onSubmit={handleVerify}
          className="w-full max-w-sm rounded-[24px] p-6 relative"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }}
          />

          <h2
            className="text-xl font-bold text-white mb-2 text-center"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Sign in to KongsiGo
          </h2>
          <p
            className="text-sm text-white/80 mb-6 text-center"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            We'll send an approval request to your TNG app. No PIN, no SMS.
          </p>

          {/* Phone Input */}
          <div className="mb-4">
            <label
              className="block text-sm font-semibold text-white mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Phone
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0, 90, 255, 0.2)",
              }}
            >
              <span className="text-lg">🇲🇾</span>
              <span className="text-gray-700 font-medium">+60</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="19-2345678"
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                style={{ fontFamily: "Inter, sans-serif" }}
                disabled={isAuthenticating}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Device Info */}
          <div
            className="mb-6 p-3 rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0, 90, 255, 0.15)" }}
              >
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs text-white/60 mb-0.5"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  This device
                </p>
                <p
                  className="text-sm font-semibold text-white truncate"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  title={deviceLabel}
                >
                  {deviceLabel}
                </p>
                <p
                  className="text-[10px] text-white/50 font-mono mt-0.5 truncate"
                  title={deviceId}
                >
                  {deviceId}
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {deviceBind.isError && (
            <div
              className="mb-4 px-3 py-2 rounded-lg flex items-start gap-2"
              style={{
                background: "rgba(254, 226, 226, 0.95)",
                color: "#B42318",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: "Inter, sans-serif" }}>
                {(deviceBind.error as Error)?.message ?? "Login failed"}
              </span>
            </div>
          )}

          {/* Verify Button */}
          <Motion.button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 font-semibold text-white relative overflow-hidden"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #0055D6 0%, #2B7FE8 100%)"
                : "rgba(255, 255, 255, 0.2)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "all 0.3s",
              fontFamily: "Inter, sans-serif",
              border: "none",
            }}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
          >
            <Motion.div
              className="flex items-center justify-center gap-2"
              animate={{ opacity: isAuthenticating ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Shield className="w-5 h-5" />
              Verify with TNG
            </Motion.div>

            {isAuthenticating && (
              <Motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </Motion.div>
            )}
          </Motion.button>

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

          {DEV_SKIP_ENABLED && (
            <>
              {devError && (
                <div
                  className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: "rgba(254, 226, 226, 0.95)",
                    color: "#B42318",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {devError}
                </div>
              )}
              <button
                type="button"
                onClick={handleDevSkip}
                disabled={devLoggingIn}
                className="mt-3 w-full py-2 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "rgba(255, 255, 255, 0.85)",
                  border: "1px dashed rgba(255, 255, 255, 0.35)",
                  cursor: devLoggingIn ? "wait" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: 0.4,
                }}
              >
                {devLoggingIn ? "Signing in…" : "DEV: Skip login as Ahmad"}
              </button>
            </>
          )}
        </Motion.form>

        <div className="h-12" />
      </div>
    </div>
  );
}
