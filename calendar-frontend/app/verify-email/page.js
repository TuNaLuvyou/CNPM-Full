"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";

/**
 * Trang xác nhận email từ link gửi về hộp thư.
 * GET /verify-email?token=<uuid>
 * Gọi API backend để kích hoạt tài khoản, sau đó hiển thị kết quả.
 * Người dùng tự quay lại trang chính để đăng nhập.
 */
export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}

function LoadingScreen() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.spinnerWrapper}>
          <div style={styles.spinner} />
        </div>
        <p style={styles.loadingText}>Đang xác thực email...</p>
      </div>
    </div>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState("loading"); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Link xác thực không hợp lệ (thiếu token).");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setData(res);
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(err.message || "Link xác thực không hợp lệ hoặc đã hết hạn.");
        setState("error");
      });
  }, [token]);

  if (state === "loading") return <LoadingScreen />;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {state === "success" ? (
          <SuccessView data={data} />
        ) : (
          <ErrorView message={errorMsg} />
        )}
      </div>
    </div>
  );
}

function SuccessView({ data }) {
  return (
    <>
      {/* Icon check */}
      <div style={styles.iconWrapper}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 style={styles.appName}>Lịch Cá Nhân</h1>
      <h2 style={styles.title}>Email đã xác nhận thành công!</h2>

      <div style={styles.emailBadge}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span style={styles.emailText}>{data?.email}</span>
      </div>

      <p style={styles.description}>
        Tài khoản của bạn đã được kích hoạt. Quay lại ứng dụng để đăng nhập và bắt đầu sử dụng.
      </p>

      <a href="http://localhost:3000" style={styles.button}>
        Quay lại ứng dụng để đăng nhập
      </a>

      <p style={styles.hint}>
        Nếu trang không tự chuyển, hãy nhấn vào nút phía trên.
      </p>
    </>
  );
}

function ErrorView({ message }) {
  return (
    <>
      {/* Icon X */}
      <div style={{ ...styles.iconWrapper, background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>

      <h1 style={styles.appName}>Lịch Cá Nhân</h1>
      <h2 style={{ ...styles.title, color: "#dc2626" }}>Xác thực thất bại</h2>

      <div style={styles.errorBox}>
        <p style={styles.errorText}>{message}</p>
      </div>

      <p style={styles.description}>
        Nếu link đã hết hạn, hãy quay lại ứng dụng và đăng nhập để yêu cầu gửi lại email xác nhận.
      </p>

      <a href="http://localhost:3000" style={{ ...styles.button, background: "linear-gradient(135deg, #64748b, #475569)" }}>
        Quay lại ứng dụng
      </a>
    </>
  );
}

// ─── Inline styles ─────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #ede9fe 100%)",
    padding: "20px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "48px 40px",
    maxWidth: "460px",
    width: "100%",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(37,99,235,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0px",
  },
  spinnerWrapper: {
    marginBottom: "24px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#64748b",
    fontSize: "16px",
    fontWeight: 500,
  },
  iconWrapper: {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
  },
  appName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#2563eb",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "20px",
    lineHeight: 1.3,
  },
  emailBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "100px",
    padding: "8px 16px",
    marginBottom: "20px",
  },
  emailText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2563eb",
  },
  description: {
    fontSize: "15px",
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "28px",
    padding: "0 8px",
  },
  button: {
    display: "inline-block",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "15px",
    padding: "14px 28px",
    borderRadius: "12px",
    textDecoration: "none",
    marginBottom: "16px",
    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
    transition: "opacity 0.2s",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
  },
  hint: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "20px",
    width: "100%",
    boxSizing: "border-box",
  },
  errorText: {
    fontSize: "14px",
    color: "#dc2626",
    lineHeight: 1.5,
    margin: 0,
  },
};
