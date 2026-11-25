import SEO from '@/components/seo/SEO';
import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import ServicesShowcase from '@/components/ServicesShowcase';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  price_range: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchServices = async () => {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('order_index', { ascending: true });
      setLoadError(Boolean(error));
      if (data) {
        setServices(data.map(s => ({ ...s, features: s.features || [], price_range: s.price_range || '' })));
      }
      setLoading(false);
    };
  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceClick = (serviceId: string) => {
    if (user) {
      navigate(`/dashboard?service=${serviceId}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <MainLayout>
      <SEO path="/services" title='Services — Web, Mobile, Cloud & AI | THRYLOS INDIA' description='Web development, mobile apps, cloud, AI integration and cybersecurity services from THRYLOS INDIA.' />
      <section className="border-b border-border pt-16 pb-12 sm:pt-20 sm:pb-16 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="space-y-5">
            <p className="text-sm text-primary">THRYLOS INDIA / Expertise</p>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold">
              Our Services
            </h1>
            </div>
            <p className="max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
              The building blocks of your next digital product. Find the right expertise, explore the details, and start a conversation about what comes next.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          {loadError ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">Services couldn't be loaded. Please try again.</p>
              <Button variant="outline" onClick={fetchServices}><RefreshCw />Retry</Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services available at the moment.</p>
            </div>
          ) : (
            <ServicesShowcase services={services} onSelect={handleServiceClick} />
          )}
        </div>
      </section>

    </MainLayout>
  );
};

export default Services;
