import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Vendors from "@/components/Vendors";
import HeroSection from "@/components/HeroSection";
import DownloadApp from "@/components/DownloadApp";
import AnythingDelivered from "@/components/AnythingDelivered";
import LetDoItTogether from "@/components/LetDoItTogether";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <Header />
      <HeroSection />
      <AnythingDelivered />
      <Vendors />
      <DownloadApp />
      <LetDoItTogether />
      <Footer />
    </div>
  );
}
