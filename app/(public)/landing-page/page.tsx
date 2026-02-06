"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import HeroBanner from "@/components/features/marketing/HeroBanner";
import FeaturesSection from "@/components/features/marketing/FeaturesSection";
import GovernorMessage from "@/components/layout/GovernorMessage";
import AboutSection from "@/components/features/marketing/AboutSection";
import ActivitiesSection from "@/components/features/marketing/ActivitiesSection";
import { Footer } from "@/components/layout";
import FadeIn from "@/components/ui/FadeIn";

export default function Home() {
  const router = useRouter();
  const currentUser = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  // Prevent flash of landing page while redirecting
  if (currentUser) return null;

  return (
    <main className="min-h-screen w-full bg-[#f8f8f8] text-gray-900">
      <FadeIn>
        <Header />
      </FadeIn>

      <FadeIn>
        <Navbar />
      </FadeIn>

      <FadeIn>
        <HeroBanner />
      </FadeIn>

      <FadeIn delay={0.05}>
        <FeaturesSection />
      </FadeIn>

      <FadeIn delay={0.1}>
        <GovernorMessage />
      </FadeIn>

      <FadeIn delay={0.15}>
        <AboutSection />
      </FadeIn>

      <FadeIn delay={0.25}>
        <ActivitiesSection />
      </FadeIn>

      <FadeIn>
        <Footer />
      </FadeIn>
    </main>
  );
}