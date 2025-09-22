"use client";

import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useEffect } from "react";
import PricingSection from "@/components/PricingSection";
import PlatformsSection from "@/components/PlatformsSection";
import ReviewsSection from "@/components/ReviewsSection";
import FaqSection from "@/components/FaqSection";

export default function Home() {
  useEffect(() => {
    const sections = document.querySelectorAll(
      "section, .hero-section-animate"
    );
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach((section) => {
      observer.observe(section);
    });
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="hero-section-animate">
          <HeroSection />
          <ReviewsSection />
          <PlatformsSection />
          <PricingSection />
          <FaqSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
