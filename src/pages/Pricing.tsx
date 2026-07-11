import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pricingPlans, faqs } from "@/lib/data/demo-data";

export default function Pricing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-void-900">
      <Nav />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto mb-4">Pricing</Badge>
          <h1 className="font-display text-4xl font-semibold text-white">Plans that scale with your team</h1>
          <p className="mt-4 text-void-300">Start free. Upgrade when your team needs AI notes, recording, and analytics.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingPlans.map((p) => (
            <Card key={p.id} className={`flex flex-col p-7 ${p.highlighted ? "border-signal-400 shadow-glow" : ""}`}>
              {p.highlighted && <Badge className="mb-4 w-fit">Most popular</Badge>}
              <h3 className="font-display text-xl font-semibold text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-void-300">{p.tagline}</p>
              <p className="mt-5 font-display text-4xl font-semibold text-white">${p.price}<span className="text-base font-normal text-void-400">/mo</span></p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-void-100"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pulse-400" /> {f}</li>
                ))}
              </ul>
              <Button className="mt-7" variant={p.highlighted ? "primary" : "secondary"} onClick={() => navigate("/signup")}>{p.cta}</Button>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="text-center font-display text-2xl font-semibold text-white">Pricing FAQ</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <Card key={f.q} className="p-5">
              <p className="font-medium text-white">{f.q}</p>
              <p className="mt-2 text-sm text-void-300">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
