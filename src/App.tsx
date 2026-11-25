import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const PostOAuthRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const consume = () => {
      const target = sessionStorage.getItem('post_oauth_redirect');
      if (target && target.startsWith('/') && window.location.pathname !== target) {
        sessionStorage.removeItem('post_oauth_redirect');
        navigate(target, { replace: true });
      }
    };
    // Handle both fresh SIGNED_IN events and existing sessions after full-page OAuth redirect.
    supabase.auth.getSession().then(({ data }) => { if (data.session) consume(); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) consume();
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
};

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Auth from "./pages/Auth";
import GetStarted from "./pages/GetStarted";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDirectMail from "./pages/admin/DirectMail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PMLogin from "./pages/pm/PMLogin";
import PMDashboard from "./pages/pm/PMDashboard";
import NotFound from "./pages/NotFound";
import ChooseManager from "./pages/ChooseManager";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsandConditions from "./pages/TermsandConditions";
import PaymentPolicy from "./pages/PaymentPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ReviewsPage from "./pages/Reviews";
import VerificationPlans from "./pages/VerificationPlans";
import UserProfile from "./pages/UserProfile";
import SearchUsers from "./pages/SearchUsers";
import Contacts from "./pages/Contacts";
import Notifications from "./pages/Notifications";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import BloggerAdmin from "./pages/BloggerAdmin";
import BlogEditorPage from "./pages/BlogEditorPage";
import BloggerLogin from "./pages/blogger/BloggerLogin";
import BloggerMFASetup from "./pages/blogger/BloggerMFASetup";
import BloggerMFAVerify from "./pages/blogger/BloggerMFAVerify";
import Unsubscribe from "./pages/Unsubscribe";
import NewsletterPreferences from "./pages/NewsletterPreferences";
import VerifyInvoice from "./pages/VerifyInvoice";
import PublicIDCard from "./pages/PublicIDCard";
import AdminMFAGate from "./components/admin/AdminMFAGate";
import PublicDocs from "./pages/PublicDocs";
import CookiePolicy from "./pages/CookiePolicy";
import PrivateDocs from "./pages/admin/PrivateDocs";
import EventsHome from "./pages/events/EventsHome";
import EventDetail from "./pages/events/EventDetail";
import RouteTitle from "./components/seo/RouteTitle";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyTickets from "./pages/events/MyTickets";
import CookieConsent from "./components/CookieConsent";


const queryClient = new QueryClient();

const OAuthInitiateFallback = () => {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`https://thrylosindia-techsite.lovable.app/~oauth/initiate${query}`);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div className="glass-card p-6 rounded-xl max-w-sm">
        <p className="text-sm text-muted-foreground">Connecting Google sign-in securely…</p>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PostOAuthRedirect />
            <CookieConsent />
            <RouteTitle />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/choose-manager" element={<ChooseManager />} />
              <Route path="/search" element={<SearchUsers />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/analytics" element={<AdvancedAnalytics />} />
              <Route path="/coordinator-admin" element={<AdminLogin />} />
              <Route path="/coordinator-admin/dashboard" element={<AdminMFAGate><AdminDashboard /></AdminMFAGate>} />
              <Route path="/coordinator-admin/direct-mail" element={<AdminMFAGate><AdminDirectMail /></AdminMFAGate>} />
              <Route path="/coordinator-admin/docs" element={<AdminMFAGate><PrivateDocs /></AdminMFAGate>} />
              <Route path="/docs" element={<PublicDocs />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/pm/login" element={<PMLogin />} />
              <Route path="/pm/dashboard" element={<PMDashboard />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsandConditions />} />
              <Route path="/payment-policy" element={<PaymentPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/verification-plans" element={<VerificationPlans />} />
              <Route path="/events" element={<EventsHome />} />
              <Route path="/events/my-tickets" element={<MyTickets />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/blogger-admin" element={<BloggerAdmin />} />
              <Route path="/blogger-admin/login" element={<BloggerLogin />} />
              <Route path="/blogger-admin/mfa/setup" element={<BloggerMFASetup />} />
              <Route path="/blogger-admin/mfa/verify" element={<BloggerMFAVerify />} />
              <Route path="/blogger-admin/new" element={<BlogEditorPage />} />
              <Route path="/blogger-admin/edit/:id" element={<BlogEditorPage />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/newsletter-preferences" element={<NewsletterPreferences />} />
              <Route path="/verify" element={<VerifyInvoice />} />
              <Route path="/verify/:verificationId" element={<VerifyInvoice />} />
              <Route path="/id/:code" element={<PublicIDCard />} />

              <Route path="/~oauth/initiate" element={<OAuthInitiateFallback />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
