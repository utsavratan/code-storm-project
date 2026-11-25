import { useEffect } from "react";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { Helmet } from "react-helmet-async";
import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { CAREERS_URL, openCareers } from "@/lib/careers";

export default function Careers() {
  useEffect(() => { openCareers(); }, []);
  return <MainLayout>
    <SEO path="/careers" title="Careers | THRYLOS INDIA" description="Visit the official THRYLOS careers website for opportunities and applications." />
    <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
    <section className="container mx-auto px-4 py-24">
      <BriefcaseBusiness className="mb-8 h-12 w-12 text-primary" strokeWidth={1.2} />
      <p className="mb-4 text-sm text-primary">THRYLOS INDIA / Careers</p>
      <h1 className="text-4xl font-semibold sm:text-6xl">Your next chapter.</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Taking you to our careers website.</p>
      <Button asChild className="mt-8"><a href={CAREERS_URL}>Continue to Careers<ArrowUpRight /></a></Button>
    </section>
  </MainLayout>;
}