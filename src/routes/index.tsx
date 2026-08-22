import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuthSession } from "@/lib/auth-session";
import { takePostAuthRedirect } from "@/lib/post-auth-redirect";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Proof } from "@/components/landing/proof";
import { Features } from "@/components/landing/features";
import { Guided } from "@/components/landing/guided";
import { Colleges } from "@/components/landing/colleges";

import { Faq } from "@/components/landing/faq";
import { FinalCta, Footer } from "@/components/landing/footer";

const title = "LanternSAT: The #1 Personalized Digital SAT Prep Platform";
const description =
  "Light up the Digital SAT with LanternSAT — personalized study plans, 4,000+ practice questions, full-length mocks, live seminars, and 1-on-1 tutoring from top 1% scorers.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LanternSAT",
          description,
        }),
      },
    ],
  }),
});

function Index() {
  const { session, loaded } = useAuthSession();
  const navigate = useNavigate();

  // Google OAuth returns to the site origin; forward to the intended page.
  useEffect(() => {
    if (!loaded || !session) return;
    const target = takePostAuthRedirect();
    if (target) navigate({ to: target, replace: true });
  }, [loaded, session, navigate]);

  return (
    <main className="bg-cream">
      <Nav />
      <Hero />
      <Proof />
      <Features />
      <Guided />
      <Colleges />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
