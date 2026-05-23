import Link from "next/link";
import {
  Wrench,
  MapPin,
  Star,
  Shield,
  Clock,
  MessageCircle,
  ChevronRight,
  Phone,
  Zap,
  Car,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              MechanicFinder
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="#services"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Services
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAzIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02aC00djJoNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                Serving Accra, Kumasi & All Major Cities
              </div>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Find Trusted{" "}
                <span className="text-primary">Mechanics</span> in Ghana
              </h1>
              <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
                Connect instantly with verified mechanics near you. Get help
                with engine repairs, tire services, electrical work, and towing
                - all at your fingertips.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/auth/signup?role=client">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Find a Mechanic
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signup?role=mechanic">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 sm:w-auto"
                  >
                    <Wrench className="h-4 w-4" />
                    Join as Mechanic
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">
                    Verified Mechanics
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    10,000+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Happy Customers
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1 text-2xl font-bold text-foreground">
                    4.8 <Star className="h-5 w-5 fill-warning text-warning" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto h-[500px] w-[320px]">
                {/* Phone mockup */}
                <div className="absolute inset-0 rounded-[3rem] bg-foreground/90 p-3 shadow-2xl">
                  <div className="h-full overflow-hidden rounded-[2.5rem] bg-card">
                    <div className="flex h-full flex-col">
                      <div className="border-b border-border bg-primary px-4 py-4">
                        <div className="text-center text-lg font-semibold text-primary-foreground">
                          MechanicFinder
                        </div>
                      </div>
                      <div className="flex-1 space-y-3 p-4">
                        {[
                          {
                            name: "Kofi Auto Works",
                            location: "East Legon, Accra",
                            rating: 4.9,
                            specialty: "Engine Expert",
                          },
                          {
                            name: "Kwame Tires Plus",
                            location: "Osu, Accra",
                            rating: 4.8,
                            specialty: "Tire Specialist",
                          },
                          {
                            name: "Ama Electric Auto",
                            location: "Tema, Accra",
                            rating: 4.7,
                            specialty: "Electrical",
                          },
                        ].map((mechanic, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-border bg-card p-3 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Wrench className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-card-foreground">
                                  {mechanic.name}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {mechanic.location}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="flex items-center gap-1 text-xs font-medium">
                                    <Star className="h-3 w-3 fill-warning text-warning" />
                                    {mechanic.rating}
                                  </span>
                                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                    {mechanic.specialty}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Getting help from a trusted mechanic has never been easier
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "1. Search Nearby",
                description:
                  "Enter your location to find verified mechanics in your area with real-time availability.",
              },
              {
                icon: MessageCircle,
                title: "2. Connect & Chat",
                description:
                  "Send a request and chat directly with the mechanic. Share photos and your location.",
              },
              {
                icon: Wrench,
                title: "3. Get Service",
                description:
                  "The mechanic comes to you or you visit their workshop. Pay securely after service.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-border bg-background p-8 text-center transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Services Available
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Our network of mechanics covers all your automotive needs
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Settings,
                title: "Engine Repair",
                description: "Diagnostics, repairs & overhauls",
              },
              {
                icon: Car,
                title: "Tire Services",
                description: "Replacement, balancing & alignment",
              },
              {
                icon: Zap,
                title: "Electrical Systems",
                description: "Battery, wiring & electronics",
              },
              {
                icon: Phone,
                title: "Towing Service",
                description: "24/7 emergency roadside help",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
              Why Choose MechanicFinder?
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Verified Mechanics",
                description:
                  "Every mechanic is background-checked and verified for quality service.",
              },
              {
                icon: Clock,
                title: "Fast Response",
                description:
                  "Get connected with available mechanics in minutes, not hours.",
              },
              {
                icon: Star,
                title: "Rated & Reviewed",
                description:
                  "Read real reviews from customers to choose the best mechanic for you.",
              },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-primary-foreground">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              What Our Users Say
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Akosua M.",
                location: "Accra",
                text: "Found a great mechanic in 10 minutes when my car broke down in East Legon. The chat feature made communication so easy!",
                rating: 5,
              },
              {
                name: "Yaw K.",
                location: "Kumasi",
                text: "As a mechanic, this app has helped me reach more customers. The booking system is smooth and professional.",
                rating: 5,
              },
              {
                name: "Esi A.",
                location: "Tema",
                text: "The location sharing feature saved me so much time. The mechanic came right to me. Highly recommend!",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-5 w-5 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  {`"${testimonial.text}"`}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of Ghanaians who trust MechanicFinder for their
            automotive needs.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup?role=client">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                Find a Mechanic
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signup?role=mechanic">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 sm:w-auto"
              >
                <Wrench className="h-4 w-4" />
                Register as Mechanic
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                MechanicFinder
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact Us
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              2026 MechanicFinder Ghana. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
