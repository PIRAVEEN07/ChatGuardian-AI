import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Zap, MessageSquare, Eye, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: Zap, title: "AI-Powered Moderation", desc: "Every message is evaluated by an LLM for context and relevance — no keyword lists." },
    { icon: MessageSquare, title: "Dynamic Topics", desc: "Create, edit, and manage discussion topics validated by AI before going live." },
    { icon: Eye, title: "Admin Dashboard", desc: "Monitor blocked messages, moderation stats, and manage community topics." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, hsl(160, 84%, 39%) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(262, 83%, 58%) 0%, transparent 50%)" }} />
        <div className="container relative py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm">
              <Shield className="h-4 w-4" />
              <span>AI-Powered Community Moderation</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              ChatGuardian AI
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              Smart AI moderator for real-time learning communities. Every message is contextually analyzed by an LLM — no banned keyword lists.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate(user ? "/community" : "/signup")} className="bg-primary hover:bg-primary/90">
                {user ? "Go to Community" : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="border-primary-foreground/30 text-foreground bg-card hover:bg-muted">
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Every message passes through contextual AI analysis before reaching the community.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <div className="rounded-xl border bg-card p-6 shadow-card h-full">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="container pb-20">
        <div className="rounded-2xl border bg-card p-8 md:p-12 shadow-card">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Moderation Flow</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            {["User sends message", "AI analyzes context", "ALLOW or BLOCK", "Chat stays clean"].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                  <span className="font-medium">{step}</span>
                </div>
                {i < 3 && <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
