import Link from "next/link";
import React from "react";

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={"/auth/login"}
        className="mr-2 cursor-pointer w-1/2 h-auto p-10 text-2xl bg-gray-50 rounded-2xl shadow-2xl transform hover:scale-120"
      >
        Login
      </Link>
      <Link
        href={"/auth/register"}
        className="ml-2 cursor-pointer w-1/2 h-auto p-10 text-2xl bg-gray-50 rounded-2xl shadow-2xl transform hover:scale-120"
      >
        Register
      </Link>
    </div>
  );
}
