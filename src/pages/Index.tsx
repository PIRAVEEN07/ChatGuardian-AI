import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Zap, MessageSquare, Eye, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: Zap, title: "AI-Powered Moderation", desc: "Every message is evaluated by an LLM for context and relevance — no keyword lists.", color: "from-primary/50 to-transparent" },
    { icon: MessageSquare, title: "Dynamic Topics", desc: "Create, edit, and manage discussion topics validated by AI before going live.", color: "from-accent/50 to-transparent" },
    { icon: Eye, title: "Admin Dashboard", desc: "Monitor blocked messages, moderation stats, and manage community topics.", color: "from-secondary/50 to-transparent" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-20 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-20 -translate-x-1/2" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 md:pt-32 pb-20 md:pb-40">
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-2 border border-primary/30"
            >
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium gradient-text">AI-Powered Community Moderation</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 gradient-text"
            >
              ChatGuardian AI
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed max-w-xl"
            >
              Smart AI moderator for real-time learning communities. Every message is contextually analyzed by an LLM — no banned keyword lists.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(user ? "/community" : "/signup")}
                className="gradient-primary text-primary-foreground font-semibold py-3 px-8 rounded-full glow-primary inline-flex items-center justify-center gap-2 transition-all"
              >
                {user ? "Go to Community" : "Get Started"} <ArrowRight className="h-5 w-5" />
              </motion.button>
              {!user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/login")}
                  className="glass border border-primary/30 text-foreground font-semibold py-3 px-8 rounded-full inline-flex items-center justify-center gap-2 hover:border-primary/50 transition-all"
                >
                  Sign In
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 md:py-32">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">How It Works</h2>
            <p className="text-foreground/70 max-w-xl mx-auto text-lg">
              Every message passes through contextual AI analysis before reaching the community.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className={`glass glass-lg border border-white/10 rounded-2xl p-8 h-full hover:border-primary/30 hover:bg-white/[0.12] transition-all duration-300 hover-lift relative overflow-hidden`}>
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none ${f.color}`} />
                  
                  <div className="relative z-10">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary glow-primary">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3 text-foreground">{f.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="relative py-20 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="glass glass-lg border border-primary/20 rounded-3xl p-8 md:p-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-12 text-center gradient-text">Moderation Flow</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
              {["User sends message", "AI analyzes context", "ALLOW or BLOCK", "Chat stays clean"].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 md:gap-4 w-full md:w-auto"
                >
                  <div className="flex items-center gap-3 glass-sm border border-white/10 rounded-full px-4 md:px-5 py-2.5 md:py-3 flex-1 md:flex-none whitespace-nowrap">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-primary-foreground text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <span className="font-semibold text-foreground text-sm">{step}</span>
                  </div>
                  {i < 3 && <ArrowRight className="hidden md:block h-5 w-5 text-primary/40 flex-shrink-0" />}
                  {i < 3 && <ArrowRight className="md:hidden h-4 w-4 text-primary/40 flex-shrink-0 rotate-90" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="glass glass-lg border border-accent/20 rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 gradient-text">Ready to Join?</h2>
            <p className="text-foreground/70 mb-8 text-lg max-w-xl mx-auto">
              Create safe, AI-moderated communities for real-time discussions.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(user ? "/community" : "/signup")}
              className="gradient-primary text-primary-foreground font-semibold py-3 px-8 rounded-full glow-primary inline-flex items-center gap-2 transition-all"
            >
              {user ? "Return to Community" : "Get Started Today"} <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
