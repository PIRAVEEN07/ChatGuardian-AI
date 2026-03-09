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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topicId) return;
    fetchTopic();
    fetchMessages();

    const channel = supabase
      .channel(`messages-${topicId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `topic_id=eq.${topicId}` },
        async (payload) => {
          const newMsg = payload.new as Tables<"messages">;
          const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", newMsg.user_id).single();
          setMessages((prev) => [...prev, { ...newMsg, profiles: prof }]);
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
        await supabase.from("blocked_messages").insert({
          topic_id: topic.id,
          user_id: user!.id,
          content: input,
          reason: modResult.reason || "Not relevant to community discussion",
        });
        setBlockMessage(modResult.reason || "This message is not relevant to the community discussion.");
        setInput("");
        setSending(false);
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
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="container flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold truncate">{topic.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="container max-w-3xl space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No messages yet</p>
              <p>Start the conversation!</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border rounded-bl-md shadow-card"}`}>
                    {!isOwn && (
                      <p className="text-xs font-semibold text-primary mb-0.5">
                        {msg.profiles?.display_name || "User"}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t bg-destructive/10 px-4 py-3"
          >
            <div className="container max-w-3xl flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{blockMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t bg-card px-4 py-3">
        <form onSubmit={sendMessage} className="container max-w-3xl flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !input.trim()} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
