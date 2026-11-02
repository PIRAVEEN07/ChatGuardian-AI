import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, MessageSquare, AlertTriangle, BarChart3, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

interface BlockedWithProfile extends Tables<"blocked_messages"> {
  profiles?: { display_name: string } | null;
  topics?: { name: string } | null;
}

export default function Admin() {
  const { isAdmin, adminLoading } = useAuth();
  const navigate = useNavigate();
  const [blockedMessages, setBlockedMessages] = useState<BlockedWithProfile[]>([]);
  const [topics, setTopics] = useState<Tables<"topics">[]>([]);
  const [stats, setStats] = useState({ allowedMessages: 0, blockedMessages: 0, totalTopics: 0 });

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/community"); return; }
    fetchData();
  }, [adminLoading, isAdmin, navigate]);

  async function fetchData() {
    const [blocked, topicsData, allowedCount, blockedCount] = await Promise.all([
      supabase.from("blocked_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("topics").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("blocked_messages").select("id", { count: "exact", head: true }),
    ]);

    if (blocked.error || topicsData.error || allowedCount.error || blockedCount.error) {
      toast.error("Could not load admin data. Please try again.");
      return;
    }

    if (blocked.data && topicsData.data) {
      // Manual join
      const userIds = [...new Set(blocked.data.map((b) => b.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const topicMap = new Map(topicsData.data.map((t) => [t.id, t]));
      setBlockedMessages(blocked.data.map((b) => ({
        ...b,
        profiles: profileMap.get(b.user_id) || null,
        topics: topicMap.get(b.topic_id) ? { name: topicMap.get(b.topic_id)!.name } : null,
      })));
    }
    if (topicsData.data) setTopics(topicsData.data);

    setStats({
      allowedMessages: allowedCount.count || 0,
      blockedMessages: blockedCount.count || 0,
      totalTopics: topicsData.data?.length || 0,
    });
  }

  async function deleteTopic(id: string) {
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Topic deleted"); fetchData(); }
  }

  const checkedMessages = stats.allowedMessages + stats.blockedMessages;
  const blockRate = checkedMessages > 0 ? ((stats.blockedMessages / checkedMessages) * 100).toFixed(1) : 0;

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Checking administrator access">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with glassmorphism */}
      <header className="border-b border-white/10 glass sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/community")}
              className="hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent glow-accent">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold gradient-text">Admin Panel</h1>
          </div>
          <div className="text-sm text-muted-foreground">Community Moderation Control</div>
        </div>
      </header>

      <main className="container py-12">
        {/* Stats */}
        <div className="mb-12 grid gap-6 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="glass glass-lg border border-white/10 rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <p className="text-foreground/70 text-sm mb-1">Allowed Messages</p>
              <p className="text-3xl font-display font-bold gradient-text">{stats.allowedMessages}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass glass-lg border border-white/10 rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-foreground/70 text-sm mb-1">Blocked Messages</p>
              <p className="text-3xl font-display font-bold text-destructive">{stats.blockedMessages}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass glass-lg border border-white/10 rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <p className="text-foreground/70 text-sm mb-1">Active Topics</p>
              <p className="text-3xl font-display font-bold text-accent">{stats.totalTopics}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass glass-lg border border-white/10 rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-foreground/70 text-sm mb-1">Block Rate</p>
              <p className="text-3xl font-display font-bold gradient-text">{blockRate}%</p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="blocked" className="w-full">
          <TabsList className="glass glass-sm border border-white/10 p-1 mb-8 w-full">
            <TabsTrigger value="blocked" className="flex-1 data-[state=active]:bg-white/10">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Blocked Messages
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex-1 data-[state=active]:bg-white/10">
              <BarChart3 className="h-4 w-4 mr-2" />
              Manage Topics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocked" className="space-y-4 mt-4">
            {blockedMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass glass-lg border border-white/10 rounded-xl p-12 text-center"
              >
                <p className="text-foreground/70 text-lg">No blocked messages yet</p>
                <p className="text-foreground/50 text-sm mt-2">All community content is in compliance</p>
              </motion.div>
            ) : (
              blockedMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="glass glass-sm border border-destructive/20 rounded-lg p-5 hover:border-destructive/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-foreground">{msg.profiles?.display_name || "Unknown"}</span>
                          <span className="text-xs px-2 py-1 rounded-full glass-sm text-accent">{msg.topics?.name || "Unknown"}</span>
                        </div>
                        <p className="text-sm text-foreground/80 mb-2">{msg.content}</p>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <p className="text-xs text-destructive">Reason: {msg.reason}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-4 mt-4">
            {topics.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass glass-lg border border-white/10 rounded-xl p-12 text-center"
              >
                <p className="text-foreground/70 text-lg">No topics yet</p>
              </motion.div>
            ) : (
              topics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="glass glass-sm border border-white/10 rounded-lg p-5 hover:border-primary/30 hover:bg-white/[0.12] transition-all flex items-center justify-between group">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground group-hover:gradient-text transition-all">{topic.name}</p>
                      <p className="text-sm text-foreground/60 truncate">{topic.description}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteTopic(topic.id)}
                      className="ml-4 p-2 hover:bg-destructive/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
