"use client";

import { useState } from "react";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from "@/lib/auth";
import type { User } from "@/lib/auth";

export default function LoginButton({ user }: { user: User | null }) {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">
          {user.displayName || user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setIsLoading(true);
          signInWithGoogle()
            .catch((e) => setError(e.message))
            .finally(() => setIsLoading(false));
        }}
        disabled={isLoading}
        className="rounded bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Google 登入
      </button>
      <button
        onClick={() => setShowEmail(!showEmail)}
        disabled={isLoading}
        className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Email
      </button>
      {showEmail && (
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => {
              setIsLoading(true);
              const action = isSignUp
                ? signUpWithEmail(email, password)
                : signInWithEmail(email, password);
              action
                .catch((e) => setError(e.message))
                .finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            className="rounded bg-teal-600 px-3 py-1 text-sm text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "處理中..." : isSignUp ? "註冊" : "登入"}
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
            className="text-xs text-gray-400 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignUp ? "已有帳號？" : "新用戶註冊"}
          </button>
        </div>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
