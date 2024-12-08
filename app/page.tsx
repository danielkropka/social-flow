import HeroSection from "@/components/HeroSection";
import Navigation from "../components/Navigation";

export default function Home() {
  return (
    <main className="flex-1">
      <Navigation />
      <HeroSection />
    </main>
  );
}
