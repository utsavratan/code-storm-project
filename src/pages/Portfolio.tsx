import SEO from '@/components/seo/SEO';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

// Define the PortfolioItem interface
interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  project_url: string;
  technologies: string[];
  category: string;
  is_featured: boolean;
}
const Portfolio = () => {
  // start with an empty list; we'll populate from Supabase
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(portfolio.map(item => item.category).filter(Boolean)))];

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('portfolio_items').select('*').order('is_featured', { ascending: false });
        if (error) {
          console.error('Error fetching portfolio items:', error);
          setPortfolio([]);
        } else if (data && data.length > 0) {
          setPortfolio(data.map((p: any) => ({ ...p, technologies: p.technologies || [] })));
        } else {
          setPortfolio([]);
        }
      } catch (err) {
        console.error('Unexpected error fetching portfolio items:', err);
        setPortfolio([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const filteredPortfolio = selectedCategory === 'All' ? portfolio : portfolio.filter(item => item.category === selectedCategory);

  return (
    <MainLayout>
      <SEO path="/portfolio" title='Portfolio & Case Studies | THRYLOS INDIA' description='Selected projects, case studies and product launches shipped by THRYLOS INDIA.' />
      <section className="py-12 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-1/4 right-1/3 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold">
              Our <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              Showcasing our best work and successful projects
            </p>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-4 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(category)} className="text-xs sm:text-sm">
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading projects...</div>
          ) : portfolio.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <h2 className="text-lg font-semibold">We're building</h2>
              <p className="text-sm text-muted-foreground">Please wait — our projects will go live soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {filteredPortfolio.map((item) => (
                <div key={item.id} className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group flex flex-col">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    {item.is_featured && <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-xs">Featured</Badge>}
                  </div>
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex flex-col flex-1">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold">{item.title}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {item.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">{tech}</Badge>
                      ))}
                    </div>
                    <div className="pt-2 mt-auto">
                      {item.project_url && item.project_url !== '#' ? (
                        <Button
                          asChild
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group/btn"
                        >
                          <a
                            href={/^https?:\/\//i.test(item.project_url) ? item.project_url : `https://${item.project_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Live
                          </a>
                        </Button>
                      ) : (
                        <Button size="lg" variant="outline" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Portfolio;
