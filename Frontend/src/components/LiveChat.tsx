"use client";

import { useState } from "react";

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
      }}
    >
      {/* Chat Button */}
      {!isOpen || isMinimized ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
          }}
          title="Live Chat"
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#15803d")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#16a34a")
          }
        >
          <svg
            style={{ width: "28px", height: "28px" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      ) : null}

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div
          style={{
            width: "350px",
            height: "450px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                Live Chat Support
              </h3>
              <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>
                Coming Soon
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setIsMinimized(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "4px",
                }}
                title="Minimize"
              >
                <svg
                  style={{ width: "20px", height: "20px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v14m0 0l-7-7m7 7l7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "4px",
                }}
                title="Close"
              >
                <svg
                  style={{ width: "20px", height: "20px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg
                style={{ width: "32px", height: "32px", color: "#16a34a" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              Coming Soon!
            </h4>
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Our live chat support team is working to bring you the best
              customer support experience.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#16a34a",
                fontWeight: "500",
              }}
            >
              📧 Email us at support@orgobloom.com
            </p>
            <p
              style={{
                margin: "12px 0 0 0",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              We're available Monday - Friday, 9 AM - 6 PM IST
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
