"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import AuthCard from "@/components/AuthCard";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuthContext } from "@/context/AuthContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const roleDetails = {
  user: {
    title: "User Registration",
    description: "Create an account to order food.",
  },
  vendor: {
    title: "Vendor Registration",
    description: "Register to sell your food online.",
  },
  rider: {
    title: "Rider Registration",
    description: "Sign up to deliver food and earn money.",
  },
};

const Register: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { registerUser } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<keyof typeof roleDetails | "">("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && roleDetails[roleParam as keyof typeof roleDetails]) {
      setRole(roleParam as keyof typeof roleDetails);
    } else {
      setRole(""); // Default to empty if not valid
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      alert("Please select a role.");
      return;
    }
    try {
      await registerUser(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        role
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <AuthCard title={role ? roleDetails[role].title : "Select a Role"}>
        <p className="text-gray-600 text-justify mb-2">
          {role
            ? roleDetails[role].description
            : "Please select your role before continuing."}
        </p>

        {!role && (
          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-gray-700 font-semibold mb-2"
            >
              Select Role:
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as keyof typeof roleDetails)
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Choose Role --</option>
              {Object.keys(roleDetails).map((key) => (
                <option key={key} value={key}>
                  {roleDetails[key as keyof typeof roleDetails].title}
                </option>
              ))}
            </select>
          </div>
        )}

        {role && (
          <div className="space-y-4">
            <button
              onClick={() => setRole("")}
              className="flex items-center absolute top-10 text-blue-500 hover:text-blue-700 mb-4"
            >
              <ArrowBackIcon className="mr-2" /> Change Role
            </button>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2 text-white cursor-pointer bg-gray-500 px-6 py-3 rounded-lg shadow-md group hover:bg-red-600 transition duration-300 mt-2"
            >
              <GoogleIcon className="text-white w-6 h-6 transition-colors duration-300 group-hover:text-white" />
              <span>Continue with Google</span>
            </button>
            <div className="relative p-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/40 rounded-full backdrop-blur-3xl px-2 text-sm">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-500 text-sm pt-2 font-semibold"
                >
                  {" "}
                  <span className="text-gray-700 after:ml-0.5 after:text-red-500 after:content-['*'] ...">
                    Full Name:
                  </span>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <div className="w-full">
                  <label
                    htmlFor="email"
                    className="block text-gray-500 text-sm pt-2 font-semibold"
                  >
                    <span className="text-gray-700 after:ml-0.5 after:text-red-500 after:content-['*'] ...">
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
                </div>

                <div className="w-full">
                  <label
                    htmlFor="phone"
                    className="block text-gray-500 text-sm pt-2 font-semibold"
                  >
                    <span className="text-gray-700 after:ml-0.5 after:text-red-500 after:content-['*'] ...">
                      Phone Number:
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                </div>
              </div>

              <div>
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
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-500 transition duration-300 mt-2"
              >
                Register
              </button>
            </form>
          </div>
        )}

        <div className="text-justify text-gray-500 mt-4">
          <p>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-500">
              Login
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
};

export default Register;
