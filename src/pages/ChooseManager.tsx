import SEO from '@/components/seo/SEO';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, ChevronRight, X, CheckCircle, Loader2, GraduationCap,
  Sparkles, Crown, Star, Award, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProjectManager {
  id: string;
  name: string;
  specialization: string | null;
  is_available: boolean;
  project_count: number;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  portfolio_projects: string[];
}

const ChooseManager = () => {
  const [managers, setManagers] = useState<ProjectManager[]>([]);
  const [selectedPM, setSelectedPM] = useState<ProjectManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { void fetchManagers(); }, []);
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('is_verified, verification_type').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setIsVerified(!!data.is_verified); });
    }
  }, [user]);

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_project_managers');
      if (error) throw error;
      setManagers(((data || []) as any[]).map((pm) => ({
        id: pm.id,
        name: pm.name,
        specialization: pm.specialization,
        is_available: pm.is_available,
        project_count: Number(pm.project_count || 0),
        photo_url: pm.photo_url,
        bio: pm.bio,
        education: pm.education,
        portfolio_projects: Array.isArray(pm.portfolio_projects) ? pm.portfolio_projects : [],
      })));
    } catch (error) {
      console.error('Failed to load project managers:', error);
      toast({ title: 'Could not load project managers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPM = (pm: ProjectManager) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to select a project manager', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!isVerified) {
      toast({ title: 'Premium Required', description: 'Get verified to choose a dedicated Project Manager.', variant: 'destructive' });
      navigate('/verification-plans');
      return;
    }
    navigate(`/dashboard?pm=${pm.id}&pm_name=${encodeURIComponent(pm.name)}`);
  };

  return (
    <MainLayout>
      <SEO path="/choose-manager" title='Choose Your Project Manager | THRYLOS INDIA' description='Pick a dedicated project manager to lead your engagement with THRYLOS INDIA.' />
      <div className="relative min-h-[calc(100vh-4rem)] py-12 sm:py-20 overflow-hidden">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[520px] h-[520px] bg-primary/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 right-1/4 w-[420px] h-[420px] bg-accent/15 rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
          />
        </div>

        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-primary/10 border-primary/30 text-primary inline-flex items-center gap-1.5 px-3 py-1">
              <Crown className="w-3.5 h-3.5" /> Premium PM Selection
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-tight">
              Meet your <span className="gradient-text">Project Manager</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Hand-picked experts who own your delivery end-to-end. Click any card to expand their full profile, portfolio, and credentials.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : managers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No project managers available right now. Please check back soon.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {managers.map((pm, i) => {
                const isOpen = selectedPM?.id === pm.id;
                return (
                  <motion.div
                    key={pm.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={isOpen ? 'sm:col-span-2 lg:col-span-3' : ''}
                  >
                    <motion.div
                      layout
                      onClick={() => !isOpen && setSelectedPM(pm)}
                      whileHover={!isOpen ? { y: -6 } : undefined}
                      className={`group relative overflow-hidden rounded-2xl border bg-card/40 backdrop-blur transition-colors ${
                        isOpen ? 'border-primary/40 shadow-[0_0_60px_rgba(249,115,22,0.18)]' : 'border-border hover:border-primary/40 cursor-pointer'
                      }`}
                    >
                      {/* gradient sheen */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.06] opacity-0 group-hover:opacity-100 transition-opacity" />

                      {!isOpen ? (
                        /* Compact card */
                        <div className="relative p-6">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="relative flex-shrink-0">
                              {pm.photo_url ? (
                                <img src={pm.photo_url} alt={pm.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/30" />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                  {pm.name.charAt(0)}
                                </div>
                              )}
                              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-background ${pm.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg leading-tight truncate">{pm.name}</h3>
                              {pm.specialization && (
                                <p className="text-sm text-primary font-medium truncate">{pm.specialization}</p>
                              )}
                              <div className="flex items-center gap-1 mt-1.5">
                                {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3 h-3 fill-primary text-primary" />)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-5">
                            <div className="rounded-lg bg-muted/40 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Projects</div>
                              <div className="text-base font-bold flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-primary" />{pm.project_count}</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                              <div className="text-xs font-semibold flex items-center gap-1 mt-0.5">
                                {pm.is_available ? <><Clock className="w-3 h-3 text-emerald-500" />Available now</> : <><Clock className="w-3 h-3 text-amber-500" />Booked</>}
                              </div>
                            </div>
                          </div>

                          {pm.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-5">{pm.bio}</p>
                          )}

                          <Button
                            variant="outline"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                          >
                            View Profile <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      ) : (
                        /* Expanded full profile */
                        <div className="relative p-6 sm:p-8">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPM(null); }}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors z-10"
                            aria-label="Close profile"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="grid md:grid-cols-[auto,1fr] gap-6 mb-6">
                            <div className="flex md:block items-center gap-4">
                              {pm.photo_url ? (
                                <img src={pm.photo_url} alt={pm.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-primary/30" />
                              ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-4xl font-bold text-primary-foreground">
                                  {pm.name.charAt(0)}
                                </div>
                              )}
                              <div className="md:hidden">
                                <h2 className="text-2xl font-bold">{pm.name}</h2>
                                {pm.specialization && <p className="text-primary text-sm">{pm.specialization}</p>}
                              </div>
                            </div>
                            <div>
                              <div className="hidden md:block">
                                <h2 className="text-3xl font-bold mb-1">{pm.name}</h2>
                                {pm.specialization && <p className="text-primary font-medium mb-3">{pm.specialization}</p>}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className="bg-primary/10 text-primary border-primary/30">
                                  <Briefcase className="w-3 h-3 mr-1" />{pm.project_count} Projects Managed
                                </Badge>
                                <Badge variant={pm.is_available ? 'default' : 'secondary'} className={pm.is_available ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : ''}>
                                  <CheckCircle className="w-3 h-3 mr-1" />{pm.is_available ? 'Available' : 'Currently Busy'}
                                </Badge>
                                <Badge variant="outline">
                                  <Award className="w-3 h-3 mr-1" />Verified PM
                                </Badge>
                              </div>
                              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                                {pm.bio || 'Experienced manager focused on quality delivery and transparent communication.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Education</p>
                                <p className="text-sm font-medium">{pm.education || 'Details shared during onboarding.'}</p>
                              </div>
                            </div>
                            <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Specialty</p>
                                <p className="text-sm font-medium">{pm.specialization || 'Full-stack project delivery'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Portfolio Highlights</p>
                            {pm.portfolio_projects.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {pm.portfolio_projects.map((project, idx) => (
                                  <Badge key={`${project}-${idx}`} variant="outline" className="text-xs py-1 px-2.5">{project}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Portfolio shared after project kickoff.</p>
                            )}
                          </div>

                          <Button
                            className="w-full h-12 text-base font-semibold"
                            size="lg"
                            onClick={(e) => { e.stopPropagation(); handleSelectPM(pm); }}
                          >
                            {isVerified ? (
                              <><ChevronRight className="w-5 h-5 mr-2" />Select & Create Project Request</>
                            ) : (
                              <><Crown className="w-5 h-5 mr-2" />Get Verified to Select This PM</>
                            )}
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChooseManager;
