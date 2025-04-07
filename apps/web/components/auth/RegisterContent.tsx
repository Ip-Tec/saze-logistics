"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import AuthCard from "@/components/AuthCard";
import GoogleIcon from "@mui/icons-material/Google";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuthContext } from "@/context/AuthContext";

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

type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export default function RegisterContent() {
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

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>();

  const onSubmit = async (data: RegisterFormValues) => {
    if (!role) {
      toast.error("Please select a role.");
      return;
    }

    try {
      await registerUser(
        data.name,
        data.email,
        data.phone,
        data.password,
        role
      );
      toast.success(
        "Registration successful! Please check your email to confirm your account."
      );

      // Instead of sending the user to a dashboard immediately,
      // redirect them to a confirmation page.
      setTimeout(() => router.push("/auth/confirm-email"), 2000);
    } catch (error: any) {
      console.log({ error });
      toast.error(error.message || "Registration failed. Please try again.");
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
            <label className="block text-gray-700 font-semibold mb-2">
              Select Role:
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as keyof typeof roleDetails)
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
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
          <div className="space-y-2 relative">
            <button
              onClick={() => setRole("")}
              className="flex items-center cursor-pointer absolute -top-[12rem] left-0 text-blue-500 hover:text-blue-700"
              aria-label="Change Role"
            >
              <ArrowBackIcon className="mr-2" />
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2 text-white bg-red-500 px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition duration-300 mt-8 hover:cursor-pointer"
            >
              <GoogleIcon className="text-white w-6 h-6" />
              <span>Continue with Google</span>
            </button>

            <div className="relative p-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-500"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/40 rounded-full backdrop-blur-3xl px-2 text-sm">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="block">
                <span className="text-gray-700">Full Name:</span>
                <input
                  type="text"
                  {...register("name", { required: "Full Name is required." })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </label>

              <div className="flex gap-2">
                <label className="">
                  <span className="text-gray-700">Email Address:</span>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required.",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Invalid email format.",
                      },
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </label>
                <label className="">
                  <span className="text-gray-700">Phone Number:</span>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Phone Number is required.",
                      pattern: {
                        value: /^\d+$/,
                        message: "Phone number must contain only digits.",
                      },
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">
                      {errors.phone.message}
                    </p>
                  )}
                </label>
              </div>

              <label className="relative">
                <span className="text-gray-700">Password:</span>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required.",
                      minLength: {
                        value: 6,
                        message: "Must be at least 6 characters.",
                      },
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Must be at least 6 characters
                  </p>
                )}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:cursor-pointer hover:bg-gradient-to-r hover:from-blue-500 hover:to-yellow-500 transition duration-300 mt-2"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </form>
            <p>
              I have an account{" "}
              <Link href="/auth/login" className="text-blue-500">
                Login
              </Link>
            </p>
          </div>
        )}

        <ToastContainer />
      </AuthCard>
    </div>
  );
}
