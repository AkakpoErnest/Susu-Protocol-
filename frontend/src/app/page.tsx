import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingStats } from './LandingStats';
import { ArrowRight, Shield, Users, TrendingUp, MapPin, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Susu Protocol — Decentralized Rotating Savings on Polkadot',
  description:
    'Join the on-chain Susu movement. Trustless rotating savings inspired by West African tradition. Built on Polkadot Hub.',
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-surface to-card opacity-80" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #e8c547 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, #4ade80 0%, transparent 40%)`,
            }}
          />

          <div className="relative page-container py-24 md:py-32">
            <div className="max-w-4xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-sm font-medium px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse-slow" />
                Live on Polkadot Hub Westend Testnet
              </div>

              {/* Headline */}
              <h1 className="font-heading font-bold text-5xl md:text-7xl text-text-primary leading-tight mb-6">
                Your Community.{' '}
                <br />
                Your Capital.{' '}
                <br />
                <span className="gradient-text">On-Chain.</span>
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
                Susu Protocol brings the ancient rotating savings tradition of West Africa to
                Polkadot — trustless, transparent, and borderless. Every contribution builds
                your on-chain reputation.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-lg">
                  Launch App <ArrowRight size={20} />
                </Link>
                <a href="#how-it-works" className="btn-secondary flex items-center justify-center gap-2 text-lg">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Live Stats ───────────────────────────────────────── */}
        <LandingStats />

        {/* ─── How It Works ──────────────────────────────────────── */}
        <section id="how-it-works" className="page-container py-20">
          <div className="text-center mb-16">
            <h2 className="section-header gradient-text">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Three simple steps to join the on-chain savings revolution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-accent/30 via-accent to-accent/30" />

            {[
              {
                step: '01',
                icon: Users,
                title: 'Form Your Circle',
                description:
                  'Create or join a savings group. Set your contribution amount, cycle duration, and invite your circle.',
                color: 'text-accent',
                bg: 'bg-accent/10',
              },
              {
                step: '02',
                icon: TrendingUp,
                title: 'Contribute Each Cycle',
                description:
                  'Everyone puts in the agreed amount. One member receives the full pot — the pot rotates until everyone wins.',
                color: 'text-green-400',
                bg: 'bg-green-400/10',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Build Your Reputation',
                description:
                  'On-time contributions earn points. Your verifiable score unlocks higher-value pools and elite circles.',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
              },
            ].map(({ step, icon: Icon, title, description, color, bg }) => (
              <div key={step} className="card relative">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={24} className={color} />
                </div>
                <div className="text-xs font-mono text-gray-500 mb-2">{step}</div>
                <h3 className="font-heading font-semibold text-xl text-text-primary mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── What is Susu ──────────────────────────────────────── */}
        <section className="bg-surface border-y border-border py-20">
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 text-accent text-sm font-medium mb-4">
                  <MapPin size={16} />
                  West Africa & Beyond
                </div>
                <h2 className="section-header text-text-primary mb-6">What is Susu?</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Susu</strong> (Ghana), <strong className="text-text-primary">Ajo</strong> (Nigeria),{' '}
                    <strong className="text-text-primary">Tontine</strong> (Côte d&apos;Ivoire) — different names, same ancient wisdom.
                    A group of trusted community members pool their savings. Each cycle, one
                    member receives the entire pot. The rotation continues until everyone has
                    won once.
                  </p>
                  <p>
                    This tradition has been practiced for centuries and moves an estimated{' '}
                    <strong className="text-accent">$400 billion annually</strong> worldwide —
                    more than many formal banking systems. Yet it remains vulnerable: an
                    untrustworthy organizer can vanish with the funds. Diaspora members
                    can&apos;t participate. No credit history is built.
                  </p>
                  <p>
                    Susu Protocol fixes this. Smart contracts replace trust. Polkadot provides
                    the rails. Your contributions build a permanent, verifiable reputation.
                  </p>
                </div>
              </div>

              {/* Quote */}
              <div className="space-y-6">
                {/* Visual map representation */}
                <div className="card bg-card/50 p-8">
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    {[
                      { name: 'Susu', country: 'Ghana' },
                      { name: 'Ajo', country: 'Nigeria' },
                      { name: 'Tontine', country: 'Côte d\'Ivoire' },
                      { name: 'Djanggi', country: 'Cameroon' },
                      { name: 'Ekub', country: 'Ethiopia' },
                      { name: 'Paluwagan', country: 'Philippines' },
                    ].map(({ name, country }) => (
                      <div key={name} className="p-3 bg-surface rounded-lg">
                        <div className="text-accent font-heading font-semibold text-sm">{name}</div>
                        <div className="text-gray-400 text-xs mt-1">{country}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Rotating savings groups exist in over 50 countries worldwide
                  </p>
                </div>

                {/* Testimonial */}
                <div className="card border-accent/20">
                  <Quote size={24} className="text-accent mb-3 opacity-50" />
                  <p className="text-gray-300 italic leading-relaxed mb-4">
                    &ldquo;My grandmother ran a susu with 12 women in Accra for 30 years.
                    Everyone built their first house from it. Now her grandchildren can do
                    the same — with anyone, anywhere in the world.&rdquo;
                  </p>
                  <div className="text-sm text-gray-400">— Market trader, Accra, Ghana</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Why Polkadot ──────────────────────────────────────── */}
        <section className="page-container py-20">
          <div className="text-center mb-12">
            <h2 className="section-header text-text-primary">Why Polkadot Hub?</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              The perfect foundation for global community finance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'EVM Compatible',
                description: 'Full Solidity support. Deploy existing contracts or write new ones with familiar tooling.',
                icon: '⚡',
              },
              {
                title: 'XCM Native',
                description: 'Future: accept contributions from any parachain. Cross-chain savings become trivial.',
                icon: '🔗',
              },
              {
                title: 'Shared Security',
                description: 'Protected by Polkadot\'s entire validator set. Bank-grade security for community funds.',
                icon: '🛡️',
              },
              {
                title: 'Low Fees',
                description: 'Micro-contributions are economically viable. Everyone can participate, not just the wealthy.',
                icon: '💸',
              },
            ].map(({ title, description, icon }) => (
              <div key={title} className="card text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-heading font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA Banner ───────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-card via-surface to-card border-y border-border py-16">
          <div className="page-container text-center">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4">
              Ready to join your first circle?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your wallet, get test tokens, and start your savings journey on Polkadot.
            </p>
            <Link href="/dashboard" className="btn-primary text-lg inline-flex items-center gap-2">
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
