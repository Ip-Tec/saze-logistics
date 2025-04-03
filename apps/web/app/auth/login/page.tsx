"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useAuthContext } from "@/context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login: React.FC = () => {
  const { loginUser } = useAuthContext();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginUser(formData.email, formData.password);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <AuthCard title="Login">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="email"
            className="block text-gray-500 text-sm pt-2 font-semibold"
          >
            <span className="text-gray-700 after:ml-0.5 after:text-red-500 after:content-['*']">
              Email Address
            </span>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <label
            htmlFor="password"
            className="block text-gray-500 text-sm pt-2 font-semibold"
          >
            <span className="text-gray-700 after:ml-0.5 after:text-red-500 after:content-['*']">
              Password
            </span>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg"
          >
            Login
          </button>
        </form>

        <div className="flex justify-between items-center mt-4">
          <Link href="/auth/forgot-password" className="text-blue-500">
            Forgot Password?
          </Link>
          <p className="text-gray-800">
            I want to{" "}
            <Link href="/auth/register" className="text-blue-500">
              Register!
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
};

export default Login;
