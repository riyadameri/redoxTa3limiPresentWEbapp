import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { WhyUsSection } from './components/WhyUsSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/CheckoutModal';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { DemoRequestModal } from './components/DemoRequestModal';
import { RedoxAdminPage } from './components/RedoxAdminPage';
import { PLANS } from './data/plans';
import { BillingCycle, Plan, SchoolOrder } from './types';
import { getStoredOrders, syncOrdersWithBackend } from './utils/orderStorage';
import { LayoutDashboard } from 'lucide-react';

export default function App() {
  // Simple URL and Route Management for / and /redox-admin
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/redox-admin' || window.location.hash === '#/redox-admin') {
        return '/redox-admin';
      }
    }
    return '/';
  });

  const [orders, setOrders] = useState<SchoolOrder[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[2]); // Plan 3 popular
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly'); // Default to monthly
  
  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailOrder, setEmailOrder] = useState<SchoolOrder | null>(null);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/redox-admin' || window.location.hash === '#/redox-admin') {
        setCurrentRoute('/redox-admin');
      } else {
        setCurrentRoute('/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Load orders on startup
  useEffect(() => {
    refreshOrders();
  }, []);

  const refreshOrders = () => {
    setOrders(getStoredOrders());
    syncOrdersWithBackend().then(synced => {
      if (synced && synced.length > 0) {
        setOrders(synced);
      }
    });
  };

  const navigateToAdmin = () => {
    try {
      window.history.pushState({}, '', '/redox-admin');
    } catch {
      window.location.hash = '#/redox-admin';
    }
    setCurrentRoute('/redox-admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
    setCurrentRoute('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlan = (plan: Plan, cycle: BillingCycle) => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(cycle);
    setIsCheckoutOpen(true);
  };

  const handleOrderCreated = (newOrder: SchoolOrder) => {
    refreshOrders();
    setEmailOrder(newOrder);
  };

  const handleViewEmail = (order: SchoolOrder) => {
    setEmailOrder(order);
    setIsEmailPreviewOpen(true);
  };

  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsCheckoutOpen(true);
    }
  };

  // ---------------------------------------------------------------
  // Dedicated /redox-admin Route (Password Protected: riyad911)
  // ---------------------------------------------------------------
  if (currentRoute === '/redox-admin') {
    return (
      <div className="min-h-screen bg-slate-950 font-['Cairo',sans-serif]">
        <RedoxAdminPage
          onNavigateHome={navigateToHome}
          onViewEmail={handleViewEmail}
        />

        {/* Email Notification Preview Modal accessible from admin */}
        <EmailPreviewModal
          isOpen={isEmailPreviewOpen}
          onClose={() => setIsEmailPreviewOpen(false)}
          order={emailOrder}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Public SaaS Landing Page (/)
  // ---------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-orange-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenPricing={scrollToPricing}
        onOpenAdmin={navigateToAdmin}
        orders={orders}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section (Clean static preview, No RFID simulation) */}
        <HeroSection
          onOpenSubscribe={scrollToPricing}
          onOpenDemo={() => setIsDemoOpen(true)}
        />

        {/* 2. 10 Core Features Section */}
        <FeaturesSection />

        {/* 3. Why Us / Comparison Table Section */}
        <WhyUsSection />

        {/* 4. Pricing Plans Section (Monthly primary default, Yearly with discount) */}
        <PricingSection
          onSelectPlan={handleSelectPlan}
        />

        {/* 5. Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={navigateToAdmin}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      {/* Checkout / School Registration Modal */}
      <CheckoutModal
        plan={selectedPlan}
        initialBillingCycle={selectedBillingCycle}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCreated={handleOrderCreated}
        onViewEmail={handleViewEmail}
        onOpenAdmin={navigateToAdmin}
      />

      {/* Email Notification Preview Modal */}
      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        order={emailOrder}
      />

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />

    </div>
  );
}
