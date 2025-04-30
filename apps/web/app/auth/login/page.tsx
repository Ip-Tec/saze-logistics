"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { supabase } from "@shared/supabaseClient";
import React, { useState, useEffect, useMemo } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import { toast, ToastContainer } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const { loginUser } = useAuthContext();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Loading flags
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    try {
      const profile = await loginUser(formData.email, formData.password);
      toast.success("Logged in successfully!");
      router.push(`/${profile.role}`);
    } catch (err: any) {
      toast.error(err.message || "Invalid login credentials");
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Kick off Google OAuth
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });
    // Redirect happens, listener will handle the rest
  };

  // Listen for OAuth callback and call loginUser (which will setUser)
  useMemo(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user && session.provider_token) {
          setIsGoogleLoading(true);
          try {
            // loginUser will detect existing session, fetch profile, setUser, and return it
            const profile = await loginUser(session.user.email!, "");
            toast.success("Logged in with Google!");
            router.push(`/${profile.role}`);
          } catch (err: any) {
            toast.error(err.message || "OAuth login failed");
          } finally {
            setIsGoogleLoading(false);
          }
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [loginUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <AuthCard title="Login">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <label className="block">
            <span className="text-gray-700">Email Address</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isEmailLoading}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
            />
          </label>

          {/* Password */}
          <label className="block relative">
            <span className="text-gray-700">Password</span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={isEmailLoading}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/3 inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isEmailLoading}
            className={`w-full flex items-center justify-center space-x-2 ${
              isEmailLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
            } text-white px-6 py-3 rounded-lg`}
          >
            {isEmailLoading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            <span>{isEmailLoading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        {/* Divider */}
        {/* <div className="relative p-2 my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-500" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-200 px-2">or</span>
          </div>
        </div> */}

        {/* Login with Google */}
        {/* <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className={`w-full flex items-center justify-center space-x-2 ${
            isGoogleLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          } text-white px-6 py-3 rounded-lg`}
        >
          {isGoogleLoading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          <GoogleIcon className="w-5 h-5" />
          <span>
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </span>
        </button> */}

        {/* Links */}
        <div className="flex justify-between items-center mt-4">
          <Link href="/auth/forgot-password" className="text-blue-500">
            Forgot Password?
          </Link>
          <Link href="/auth/register" className="text-blue-500">
            Register
          </Link>
        </div>

        <ToastContainer position="top-center" />
      </AuthCard>
    </div>
  );
}
