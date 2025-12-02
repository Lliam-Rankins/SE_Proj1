export default function Hero() {
  return (
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
          Redefining food delivery with sustainability at its core. Make every meal an eco-conscious choice with transparent impact, rewarding green actions, and community-powered routes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#mission" className="w-full sm:w-auto">
            <button className="w-full rounded-full bg-gray-100 px-8 py-3 text-base font-semibold text-gray-900 shadow-sm transition hover:bg-gray-200">
              Our Mission
            </button>
          </a>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <button className="w-full rounded-full bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-700">
              How It Works
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
