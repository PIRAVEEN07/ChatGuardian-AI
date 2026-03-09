import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Plus, MessageSquare, Users, LogOut, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

export default function Community() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Tables<"topics">[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    const { data } = await supabase.from("topics").select("*").order("created_at", { ascending: false });
    if (data) setTopics(data);
    setLoading(false);
  }

  async function createTopic() {
    if (!newTopicName.trim() || !newTopicDesc.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    setCreating(true);

    try {
      // AI validation
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate", {
        body: { type: "topic", topic_name: newTopicName, topic_description: newTopicDesc },
      });

      if (modError) throw modError;

      if (modResult.decision === "BLOCK") {
        toast.error(modResult.reason || "This topic does not meet the community discussion guidelines.");
        setCreating(false);
        return;
      }

      const { error } = await supabase.from("topics").insert({
        name: newTopicName,
        description: newTopicDesc,
        created_by: user!.id,
      });

      if (error) throw error;
      toast.success("Topic created!");
      setNewTopicName("");
      setNewTopicDesc("");
      setDialogOpen(false);
      fetchTopics();
    } catch (err: any) {
      toast.error(err.message || "Failed to create topic");
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with glassmorphism */}
      <header className="border-b border-white/10 glass sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary glow-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold gradient-text">ChatGuardian AI</h1>
              <p className="text-xs text-accent">AI Community Moderator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 glass-sm px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
              <span className="text-xs font-medium text-accent">AI Moderation Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{profile?.display_name}</span>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="hover:bg-white/10 transition-colors">
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="hover:bg-white/10 transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Title Section */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="font-display text-4xl font-bold mb-2 gradient-text">Community Topics</h2>
            <p className="text-foreground/70">Join discussions or create a new topic</p>
          </motion.div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="gradient-primary hover:shadow-elevated transition-shadow gap-2 h-11">
                  <Plus className="h-5 w-5" /> New Topic
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle className="text-xl">Create a New Topic</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Topic Name</Label>
                  <Input 
                    value={newTopicName} 
                    onChange={(e) => setNewTopicName(e.target.value)} 
                    placeholder="e.g., Hackathon Ideas"
                    className="glass-sm border-white/10 text-foreground placeholder:text-foreground/40 focus:border-primary focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea 
                    value={newTopicDesc} 
                    onChange={(e) => setNewTopicDesc(e.target.value)} 
                    placeholder="Describe what this topic is about..."
                    rows={3}
                    className="glass-sm border-white/10 text-foreground placeholder:text-foreground/40 focus:border-primary focus:ring-primary/50 resize-none"
                  />
                </div>
                <Button 
                  onClick={createTopic} 
                  disabled={creating}
                  className="w-full gradient-primary hover:shadow-elevated transition-all h-10"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating with AI...
                    </>
                  ) : (
                    "Create Topic"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading topics...</p>
            </div>
          </div>
        ) : topics.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card className="glass border-white/10 text-center py-16">
              <CardContent>
                <MessageSquare className="mx-auto h-16 w-16 text-primary/50 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">No topics yet</p>
                <p className="text-muted-foreground mb-6">Be the first to start a discussion!</p>
                <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Topic
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, i) => (
              <motion.div 
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/topic/${topic.id}`)}
              >
                <div className="glass glass-lg border-white/10 rounded-xl p-6 h-full hover:border-primary/30 hover:bg-white/[0.12] transition-all duration-300 hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-foreground group-hover:gradient-text transition-all">{topic.name}</h3>
                    </div>
                    <MessageSquare className="h-5 w-5 text-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{topic.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-4 w-4 text-accent/60" />
                      <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full glass-sm text-accent">
                      Join →
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
