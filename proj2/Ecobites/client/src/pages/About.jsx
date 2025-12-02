import React from 'react';

const featureHighlights = [
  {
    title: 'Impact Transparency',
    description: 'See estimated impact per order and make informed choices.',
    icon: '📊'
  },
  {
    title: 'Eco Rewards',
    description: 'Earn points for sustainable actions—from packaging to EV deliveries.',
    icon: '🌎'
  },
  {
    title: 'Community Orders',
    description: 'Reduce trips and costs by grouping orders within neighborhoods.',
    icon: '🤝'
  }
];

const visionList = [
  'Show transparent carbon and impact indicators per order',
  'Reward greener choices for customers and drivers',
  'Support restaurants with sustainable menu and packaging options',
  'Encourage shared/community orders to reduce trips'
];

export default function About() {
  return (
    <div className="pt-20">{/* account for fixed header */}
      {/* Hero/Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-b from-emerald-50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_-10%,hsl(142.1_76.2%_36.3%/0.28),transparent_65%)]" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 tracking-[0.2em]">
            EcoBites • Group 26
          </span>
          <h1 className="mt-8 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900">
            Helping You Help the Planet
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl md:text-2xl text-gray-600 leading-relaxed">
            EcoBites is redefining food delivery with sustainability at its core. We empower customers, restaurants, and drivers to make greener choices through transparency, incentives, and delightful design.
          </p>
        </div>
      </section>
      {/* Mission and What We Do */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="rounded-[32px] border border-emerald-100 bg-white/95 shadow-xl px-6 py-10 lg:px-16">
          <div className="max-w-5xl mx-auto space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Our Mission</p>
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">Make every meal an eco‑conscious choice.</h2>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              We align incentives across customers, restaurants, and drivers so green decisions become the simple, rewarding default. Compostable packaging, shared routes, and EV-friendly deliveries are all just a tap away.
            </p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-emerald-900">What We Do</h3>
                <ul className="mt-4 space-y-4 text-lg text-gray-700">
                  {visionList.map((item) => (
                    <li key={item} className="flex items-center justify-center gap-3">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-semibold">How It Works</h3>
                <p className="mt-4 text-lg leading-relaxed text-white/90">
                  Customers choose planet-friendly options, restaurants showcase sustainability, and drivers optimize eco-routes and delivery methods. Everyone earns rewards; the planet benefits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="mb-10 max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Key Features</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">Tools that make sustainable choices effortless.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureHighlights.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold text-gray-900">{feature.title}</h4>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="rounded-[32px] border border-emerald-100 bg-white/95 shadow-xl px-6 py-12 lg:px-16">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">The Team</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight whitespace-nowrap">Team behind the EcoBites mission.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {["Griffin Pitts", "Madison Book", "Alice Guth", "Cynthia Espinoza-Arredondo"].map((name) => (
              <div key={name} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {name.split(' ').map((n) => n[0]).join('')}
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-900">{name}</p>
                <p className="text-sm text-emerald-700/80">EcoBites • Group 26</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Technology</h2>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-700">
            Frontend: React + Vite + Tailwind • Routing via React Router • Testing with Vitest/RTL
          </p>
          <p className="text-gray-700 mt-2">
            Backend: Express + Mongoose • JWT Auth • Testing with Jest + Supertest
          </p>
        </div>
      </section>
    </div>
  );
}
