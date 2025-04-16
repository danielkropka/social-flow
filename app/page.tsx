import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navigation />
      <HeroSection />
      <Footer />
    </main>
  );
}
