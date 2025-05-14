// app/(root)/admin/layout.tsx

import Sidebar from "@/components/admin/Sidebar";
import { AuthProvider } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex flex-col md:flex-row min-h-screen w-full">
        <div className="w-full md:w-64 md:fixed md:h-screen top-0 left-0">
          <Sidebar />
        </div>
        <main className="flex-1 w-full md:ml-64">{children}</main>
      </div>
    </AuthProvider>
  );
}
