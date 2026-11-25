import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GoogleIcon from "@/components/GoogleIcon";
import { signInBloggerWithGoogle } from "@/lib/bloggerAuth";
import { useBloggerAuth, bloggerFullSignOut } from "@/features/blogger/useAuthGuard";

export const BloggerLogin = () => {
  const auth = useBloggerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.ready) return;
    if (auth.stage === 'ready') navigate('/blogger-admin', { replace: true });
    else if (auth.stage === 'setup_required') navigate('/blogger-admin/mfa/setup', { replace: true });
    else if (auth.stage === 'verify_required') navigate('/blogger-admin/mfa/verify', { replace: true });
  }, [auth.ready, auth.stage, navigate]);

  const handleSignIn = async () => {
    try {
      const result = await signInBloggerWithGoogle('/blogger-admin');
      if (result?.error) throw result.error;
    } catch (e) {
      toast({ title: "Sign-in failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const stillLoading = !auth.ready || auth.stage === 'loading';
  const notApproved = auth.stage === 'not_approved';

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">THRYLOS INDIA</p>
            <h1 className="text-2xl font-bold mt-1">Blogger Admin</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Secure editorial access. Google Sign-In + Authenticator required.
            </p>
          </div>
        </div>

        {notApproved && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {auth.email ?? 'This Google account'} is not approved for publishing. Contact your administrator.
          </div>
        )}

        {stillLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : notApproved ? (
          <Button variant="outline" className="w-full" onClick={() => bloggerFullSignOut()}>
            Sign out and try another account
          </Button>
        ) : (
          <Button className="w-full gap-2 h-11" onClick={handleSignIn}>
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </Button>
        )}

        <div className="mt-6 pt-6 border-t border-border/60 text-xs text-muted-foreground space-y-2">
          <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" />Two-factor authentication is required.</p>
          <p>Sessions expire after 30 minutes of inactivity.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default BloggerLogin;
