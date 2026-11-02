import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Send, Loader2, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

interface MessageWithProfile extends Tables<"messages"> {
  profiles?: { display_name: string } | null;
}

export default function TopicChat() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Tables<"topics"> | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState({ checked: 0, blocked: 0, allowed: 0 });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topicId) return;
    fetchTopic();
    fetchMessages();
    fetchMetrics();

    const channel = supabase
      .channel(`messages-${topicId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `topic_id=eq.${topicId}` },
        async (payload) => {
          const newMsg = payload.new as Tables<"messages">;
          const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", newMsg.user_id).single();
          setMessages((prev) => [...prev, { ...newMsg, profiles: prof }]);
          void fetchMetrics();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [topicId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function fetchTopic() {
    const { data } = await supabase.from("topics").select("*").eq("id", topicId!).single();
    if (data) setTopic(data);
  }

  async function fetchMetrics() {
    if (!topicId) return;
    setMetricsLoading(true);
    try {
      const [msgCount, blockedResult] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("topic_id", topicId),
        supabase.rpc("count_blocked_messages", { _topic_id: topicId }),
      ]);
      if (msgCount.error) throw msgCount.error;
      if (blockedResult.error) throw blockedResult.error;
      const allowed = msgCount.count ?? 0;
      const blocked = blockedResult.data ?? 0;
      setMetrics({ checked: allowed + blocked, blocked, allowed });
    } catch {
      toast.error("Unable to load moderation metrics.");
    } finally {
      setMetricsLoading(false);
    }
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("topic_id", topicId!)
      .order("created_at", { ascending: true });
    if (!data) return;
    // Fetch profiles for all users
    const userIds = [...new Set(data.map((m) => m.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    setMessages(data.map((m) => ({ ...m, profiles: profileMap.get(m.user_id) || null })));
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !topic) return;
    setSending(true);
    setBlockMessage(null);

    try {
      // AI moderation
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate", {
        body: { type: "message", topic_name: topic.name, topic_description: topic.description, message: input },
      });

      if (modError) throw modError;

      if (modResult.decision === "BLOCK") {
        // Store blocked message
        const { error: blockedInsertError } = await supabase.from("blocked_messages").insert({
          topic_id: topic.id,
          user_id: user!.id,
          content: input,
          reason: modResult.reason || "Not relevant to community discussion",
        });
        if (blockedInsertError) throw blockedInsertError;
        setBlockMessage(modResult.reason || "This message is not relevant to the community discussion.");
        setInput("");
        setSending(false);
        fetchMetrics();
        setTimeout(() => setBlockMessage(null), 5000);
        return;
      }

      // Store allowed message
      const { error } = await supabase.from("messages").insert({
        topic_id: topic.id,
        user_id: user!.id,
        content: input,
      });

      if (error) throw error;
      setInput("");
      void fetchMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
    setSending(false);
  }

  if (!topic) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header with glassmorphism */}
      <header className="border-b border-white/10 glass sticky top-0 z-40 px-4 py-4">
        <div className="container flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/community")}
              className="hover:bg-white/10 transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary glow-primary shrink-0">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-bold text-foreground truncate">{topic.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 glass-sm px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
              <span className="text-xs font-medium text-accent">Moderation Active</span>
            </div>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setShowMetrics(!showMetrics)}
              className="hover:bg-white/10 transition-colors gap-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Metrics</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Moderation Metrics */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="container max-w-4xl px-4 py-6 mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display font-bold text-sm text-foreground">Moderation Metrics</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:bg-white/10" 
                  onClick={() => fetchMetrics()} 
                  disabled={metricsLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${metricsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                  <div className="glass glass-lg border-white/10 rounded-lg p-4 text-center hover-lift">
                    <p className="text-xs text-muted-foreground mb-2">Messages Checked</p>
                    <p className="text-3xl font-display font-bold gradient-text">{metrics.checked}</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="glass glass-lg border-white/10 rounded-lg p-4 text-center hover-lift">
                    <p className="text-xs text-muted-foreground mb-2">Messages Blocked</p>
                    <p className="text-3xl font-display font-bold text-destructive">{metrics.blocked}</p>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="glass glass-lg border-white/10 rounded-lg p-4 text-center hover-lift">
                    <p className="text-xs text-muted-foreground mb-2">Messages Allowed</p>
                    <p className="text-3xl font-display font-bold text-green-400">{metrics.allowed}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-accent/40" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">No messages yet</p>
              <p className="text-muted-foreground text-sm">Start the conversation! Every message is protected by AI moderation.</p>
            </motion.div>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl transition-all duration-300
                    ${isOwn 
                      ? "gradient-primary text-primary-foreground rounded-br-none shadow-elevated hover:shadow-elevated" 
                      : "glass glass-sm border-white/10 rounded-bl-none hover:border-accent/30 hover:bg-white/[0.12]"
                    } px-4 py-3`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold text-accent mb-1">
                        {msg.profiles?.display_name || "User"}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[11px] mt-2 opacity-70`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Block warning */}
      <AnimatePresence>
        {blockMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-destructive/30 bg-destructive/10 px-4 py-3 backdrop-blur-sm"
          >
            <div className="container max-w-4xl mx-auto flex items-center gap-3 text-sm text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Message not allowed</p>
                <p className="text-xs opacity-80">{blockMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-white/10 glass px-4 py-4">
        <form onSubmit={sendMessage} className="container max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Share your thoughts (Shift+Enter for new line)..."
                disabled={sending}
                className="glass-sm border-white/20 text-foreground placeholder:text-foreground/40 rounded-full px-5 py-3 focus:border-primary/50 focus:ring-primary/50 focus:ring-2 transition-all resize-none"
              />
            </div>
            <motion.button
              type="submit"
              disabled={sending || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="gradient-primary hover:shadow-elevated text-primary-foreground rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 h-10 w-10 flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-5">All messages are AI-moderated for community safety</p>
        </form>
      </div>
    </div>
  );
}
