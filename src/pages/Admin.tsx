import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, MessageSquare, AlertTriangle, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface BlockedWithProfile extends Tables<"blocked_messages"> {
  profiles?: { display_name: string } | null;
  topics?: { name: string } | null;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [blockedMessages, setBlockedMessages] = useState<BlockedWithProfile[]>([]);
  const [topics, setTopics] = useState<Tables<"topics">[]>([]);
  const [stats, setStats] = useState({ totalMessages: 0, blockedMessages: 0, totalTopics: 0 });

  useEffect(() => {
    if (!isAdmin) { navigate("/community"); return; }
    fetchData();
  }, [isAdmin]);

  async function fetchData() {
    const [blocked, topicsData, msgCount] = await Promise.all([
      supabase.from("blocked_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("topics").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);

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
      totalMessages: msgCount.count || 0,
      blockedMessages: blocked.data?.length || 0,
      totalTopics: topicsData.data?.length || 0,
    });
  }

  async function deleteTopic(id: string) {
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Topic deleted"); fetchData(); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent">
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{stats.totalMessages}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Messages</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{stats.blockedMessages}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Topics</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{stats.totalTopics}</p></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="blocked">
          <TabsList>
            <TabsTrigger value="blocked">Blocked Messages</TabsTrigger>
            <TabsTrigger value="topics">Manage Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="blocked" className="space-y-3 mt-4">
            {blockedMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No blocked messages yet</p>
            ) : (
              blockedMessages.map((msg) => (
                <Card key={msg.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{msg.profiles?.display_name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">in {msg.topics?.name || "Unknown"}</span>
                        </div>
                        <p className="text-sm text-foreground">{msg.content}</p>
                        <p className="text-xs text-destructive mt-1">Reason: {msg.reason}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-3 mt-4">
            {topics.map((topic) => (
              <Card key={topic.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{topic.name}</p>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTopic(topic.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
