import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserPlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! You can now sign in.");
      navigate("/community");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-20 -translate-x-1/2" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 translate-x-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass glass-lg border border-white/10 rounded-2xl shadow-elevated overflow-hidden">
          <CardHeader className="text-center pt-8 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary glow-primary"
            >
              <Shield className="h-7 w-7 text-primary-foreground" />
            </motion.div>
            <CardTitle className="font-display text-3xl font-bold gradient-text">Join Community</CardTitle>
            <CardDescription className="text-foreground/60 mt-2">Create your ChatGuardian AI account</CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-foreground font-medium">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="glass-sm border-white/20 text-foreground placeholder:text-foreground/40 focus:border-primary/50 focus:ring-primary/50"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="glass-sm border-white/20 text-foreground placeholder:text-foreground/40 focus:border-primary/50 focus:ring-primary/50"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="glass-sm border-white/20 text-foreground placeholder:text-foreground/40 focus:border-primary/50 focus:ring-primary/50"
                />
                <p className="text-xs text-foreground/50">Minimum 6 characters</p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl glow-primary hover:shadow-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="h-5 w-5" />
                {loading ? "Creating account..." : "Create account"}
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 text-center text-sm text-foreground/70"
            >
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 hover:underline font-semibold inline-flex items-center gap-1 transition-colors">
                Sign in <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.p>
          </CardContent>
        </div>
      </motion.div>
    </div>
  );
}
