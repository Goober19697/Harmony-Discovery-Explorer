import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9 5.3 9 5.3a14.7 14.7 0 0 1-2.1 2.6" />
      <path d="M6.6 6.6A15.5 15.5 0 0 0 3 9.3S6.5 14.7 12 14.7a9.8 9.8 0 0 0 3.4-.6" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12s3.5-5.3 9-5.3 9 5.3 9 5.3-3.5 5.3-9 5.3S3 12 3 12z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function PasswordInput({
  id,
  label,
  name,
  value,
  onChange,
  autoComplete,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="auth-password-control">
        <input
          className="auth-input auth-password-input"
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={8}
          required
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setIsVisible(current => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={isVisible}
        >
          <PasswordVisibilityIcon visible={isVisible} />
        </button>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const { authNotice, clearAuthNotice, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError(null);
    clearAuthNotice();
    setForm(current => ({ ...current, password: "", confirmPassword: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    clearAuthNotice();

    const email = form.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email, password: form.password });
      } else {
        await register({
          email,
          password: form.password,
          display_name: form.displayName.trim() || undefined,
        });
      }
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isRegistering = mode === "register";

  return (
    <main className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .auth-root {
          --bg: #1B1D2A; --panel: #232640; --ink: #EDE6D6;
          --ink-dim: #9C97AE; --brass: #C98A3A; --rust: #C9634A;
          min-height: 100vh; padding: 32px 20px; background: var(--bg);
          color: var(--ink); font-family: 'Inter', sans-serif;
          display: grid; place-items: center; box-sizing: border-box;
        }
        .auth-card {
          width: min(100%, 420px); padding: 34px 32px 32px; background: var(--panel);
          border: 1px solid rgba(237,230,214,0.10); border-radius: 12px;
          box-sizing: border-box;
        }
        .auth-title {
          margin: 4px 0 10px; font-size: 32px; font-weight: 600;
          line-height: 1.25; letter-spacing: -0.01em; text-align: center;
          text-wrap: balance;
        }
        .auth-subtitle {
          margin: 0 auto 28px; color: var(--ink-dim); font-size: 14px;
          line-height: 1.5; text-align: center; text-wrap: balance;
        }
        .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 24px; }
        .auth-tab {
          padding: 9px; border: 1px solid rgba(237,230,214,0.14);
          background: transparent; color: var(--ink-dim); cursor: pointer;
          font: 500 11px 'JetBrains Mono', monospace;
        }
        .auth-tab:first-child { border-radius: 8px 0 0 8px; }
        .auth-tab:last-child { border-radius: 0 8px 8px 0; border-left: 0; }
        .auth-tab.active { color: var(--brass); background: rgba(201,138,58,0.10); }
        .auth-form { display: grid; gap: 14px; }
        .auth-field { display: grid; gap: 6px; }
        .auth-label { color: var(--ink-dim); font: 500 10px 'JetBrains Mono', monospace; }
        .auth-input {
          width: 100%; padding: 11px 12px; border: 1px solid rgba(237,230,214,0.14);
          border-radius: 7px; background: var(--bg); color: var(--ink);
          font: 16px 'Inter', sans-serif; box-sizing: border-box; outline: none;
        }
        .auth-input:focus { border-color: var(--brass); }
        .auth-password-control { position: relative; }
        .auth-password-input { padding-right: 44px; }
        .auth-password-toggle {
          position: absolute; top: 50%; right: 8px; transform: translateY(-50%);
          width: 32px; height: 32px; padding: 0; border: 0; border-radius: 6px;
          display: grid; place-items: center; background: transparent;
          color: var(--ink-dim); cursor: pointer;
        }
        .auth-password-toggle:hover { color: var(--ink); background: rgba(237,230,214,0.07); }
        .auth-password-toggle:focus-visible {
          color: var(--brass); outline: 2px solid var(--brass); outline-offset: 1px;
        }
        .auth-submit {
          margin-top: 4px; padding: 11px 16px; border: 1px solid var(--brass);
          border-radius: 7px; background: rgba(201,138,58,0.14); color: var(--ink);
          font: 600 13px 'Inter', sans-serif; cursor: pointer;
        }
        .auth-submit:disabled { cursor: wait; opacity: 0.6; }
        .auth-error { margin: 0; color: #E48972; font-size: 12px; line-height: 1.4; }
        .auth-loading { color: var(--ink-dim); font: 500 12px 'JetBrains Mono', monospace; }
        @media (max-width: 480px) {
          .auth-root { padding: max(16px, env(safe-area-inset-top)) 12px; }
          .auth-card { padding: 26px 20px 24px; }
          .auth-title { margin-top: 2px; font-size: clamp(27px, 8.5vw, 32px); line-height: 1.3; }
          .auth-subtitle { margin-bottom: 24px; }
        }
      `}</style>
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 className="auth-title display-title" id="auth-title">Harmony Discovery Explorer</h1>
        <p className="auth-subtitle">
          {isRegistering ? "Create an account to begin exploring." : "Log in to continue your harmonic journey."}
        </p>
        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <button
            type="button"
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => changeMode("login")}
            role="tab"
            aria-selected={mode === "login"}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab${isRegistering ? " active" : ""}`}
            onClick={() => changeMode("register")}
            role="tab"
            aria-selected={isRegistering}
          >
            Create Account
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {isRegistering && (
            <label className="auth-field">
              <span className="auth-label">Display name (optional)</span>
              <input
                className="auth-input"
                name="displayName"
                value={form.displayName}
                onChange={updateField}
                autoComplete="name"
                maxLength={100}
              />
            </label>
          )}
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>
          <PasswordInput
            key={mode}
            id={`${mode}-password`}
            label="Password"
            name="password"
            value={form.password}
            onChange={updateField}
            autoComplete={isRegistering ? "new-password" : "current-password"}
          />
          {isRegistering && (
            <PasswordInput
              id="register-confirm-password"
              label="Confirm password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              autoComplete="new-password"
            />
          )}
          {(error || authNotice) && (
            <p className="auth-error" role="alert">{error || authNotice}</p>
          )}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? (isRegistering ? "Creating account…" : "Logging in…")
              : (isRegistering ? "Create Account" : "Login")}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AuthLoadingScreen() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#1B1D2A",
    }}>
      <span style={{
        color: "#9C97AE",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
      }}>
        Checking your session…
      </span>
    </main>
  );
}
