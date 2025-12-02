export default function Mission() {
  return (
    <section id="mission" className="container mx-auto py-16 md:py-24 text-center">
      <div className="max-w-5xl mx-auto space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Mission Statement</p>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Empower every order to be eco-conscious.</h2>
        <p className="text-lg text-gray-600">
          EcoBites gives every role a clear path to reduce waste, emissions, and cost—without adding friction.
        </p>
      </div>
      <div className="mt-6 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 md:p-10 shadow-xl space-y-4">
          <p className="leading-relaxed text-xl text-gray-700">
            We’re redefining food delivery so sustainability becomes the seamless default. Customers choose reusable or compostable packaging, drivers earn for low-carbon routes, and restaurants highlight seasonal, planet-friendly menus. Shared neighborhood orders keep trips—and emissions—low.
          </p>
          <p className="leading-relaxed text-xl text-gray-700">
            Impact dashboards, gamified rewards, and transparent carbon stats make every decision feel meaningful. EcoBites turns good intentions into trackable action for people, communities, and the planet—one conscious meal at a time.
          </p>
        </div>
      </div>
    </section>
  );
}
