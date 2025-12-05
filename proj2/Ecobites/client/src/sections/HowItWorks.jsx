export default function HowItWorks() {
  const roles = [
    {
      title: 'Customers',
      description:
        'Track personal impact, choose sustainable packaging, and join eco challenges. Rewards and transparency keep greener habits sticky.'
    },
    {
      title: 'Restaurants',
      description:
        'Highlight seasonal, plant-forward menus and smart packaging. Showcase sustainability, reduce waste, and reach conscious diners.'
    },
    {
      title: 'Delivery Drivers',
      description:
        'Use low-emission transport, optimize clustered drops, and earn extra for greener routes that keep emissions low.'
    }
  ];

  return (
    <section id="how-it-works" className="container mx-auto py-16 md:py-24">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">How It Works</p>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900">Each role has simple, rewarding steps to lower impact.</h2>
        <p className="mt-4 text-lg text-gray-600">Customers, restaurants, and drivers share one platform, one incentive model, and one eco-conscious mission.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {roles.map((role) => (
          <div key={role.title} className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-900">{role.title}</h3>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">{role.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
