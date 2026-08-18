import React, { useState } from "react";
import api, { setAuthToken } from "../api";
import { Eye, EyeOff, Activity, AlertCircle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: {
    id: number;
    nombre: string;
    usuario: string;
    rol: "ADMINISTRADOR" | "RECEPCIONISTA";
  }) => void;
}

/* Estilos inline para bypassear el CSS global que fuerza bg-white en inputs */
const inputStyle: React.CSSProperties = {
  height: "42px",
  width: "100%",
  padding: "0 12px",
  borderRadius: "8px",
  border: "1px solid #3f3f46",
  backgroundColor: "#27272a",
  color: "#f4f4f5",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const inputPasswordStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: "40px",
};

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Ingresa tu usuario y contraseña");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await api.login<any>(username.trim(), password);
      setAuthToken(response.access_token);
      localStorage.setItem("currentUser", JSON.stringify(response.usuario));
      onLoginSuccess(response.usuario);
    } catch {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #09090b 0%, #18181b 60%, #09090b 100%)",
        padding: "16px",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Glow decorativo */}
      <div
        style={{
          position: "fixed",
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Card */}
        <div
          style={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Barra superior verde */}
          <div
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #059669, #10b981, #059669)",
            }}
          />

          <div
            style={{
              padding: "36px 32px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(5,150,105,0.3)",
                }}
              >
                <Activity
                  style={{ width: "28px", height: "28px", color: "#fff" }}
                />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#f4f4f5",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Caja Clínica
                </h1>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#10b981",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  Centro Médico Medic
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Error */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertCircle
                    style={{
                      width: "15px",
                      height: "15px",
                      color: "#f87171",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#f87171",
                      lineHeight: "1.4",
                    }}
                  >
                    {error}
                  </span>
                </div>
              )}

              {/* Usuario */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#71717a",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Usuario
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                  onBlur={(e) => (e.target.style.borderColor = "#3f3f46")}
                />
              </div>

              {/* Contraseña */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#71717a",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    style={inputPasswordStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                    onBlur={(e) => (e.target.style.borderColor = "#3f3f46")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#71717a",
                      padding: 0,
                    }}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: "42px",
                  width: "100%",
                  marginTop: "4px",
                  borderRadius: "8px",
                  background: loading ? "#047857" : "#10b981",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{ padding: "0 32px 20px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#3f3f46" }}>
              Sistema de gestión interno · Medic {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe animation para el spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
