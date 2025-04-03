import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Vendors from "@/components/Vendors";
import HeroSection from "@/components/HeroSection";
import DownloadApp from "@/components/DownloadApp";
import { AuthProvider } from "@/context/AuthContext";
import LetDoItTogether from "@/components/LetDoItTogether";
import AnythingDelivered from "@/components/AnythingDelivered";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Only wrap if your components need the auth context */}
      <AuthProvider>
        <Header />
        <HeroSection />
        <AnythingDelivered />
        <Vendors />
        <DownloadApp />
        <LetDoItTogether />
        <Footer />
      </AuthProvider>
    </div>
  );
}
