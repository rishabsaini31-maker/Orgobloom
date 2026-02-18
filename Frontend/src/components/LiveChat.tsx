"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Chat Button - Fixed Position */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center ${
          isOpen && !isMinimized ? "hidden" : ""
        }`}
        title="Live Chat"
      >
        <svg
          className="w-6 h-6"
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

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-lg shadow-2xl transition-all ${
            isMinimized
              ? "bottom-6 right-6 w-64 h-14"
              : "bottom-6 right-6 w-96 h-[500px] flex flex-col"
          }`}
        >
          {/* Header */}
          <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold">Live Chat Support</h3>
              <p className="text-xs text-primary-100">Coming Soon</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-primary-700 p-1 rounded"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMinimized
                        ? "M12 19V5m0 0l-7 7m7-7l7 7"
                        : "M12 5v14m0 0l-7-7m7 7l7-7"
                    }
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-primary-700 p-1 rounded"
                title="Close"
              >
                <svg
                  className="w-5 h-5"
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
          {!isMinimized && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
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
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Coming Soon!
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Our live chat support team is working to bring you the best
                customer support experience.
              </p>
              <p className="text-primary-600 text-xs font-medium">
                📧 Email us at support@orgobloom.com
              </p>
              <p className="text-gray-500 text-xs mt-3">
                We're available Monday - Friday, 9 AM - 6 PM IST
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
