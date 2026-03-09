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
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold">ChatGuardian AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile?.display_name}</span>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Settings className="mr-1 h-4 w-4" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Community Topics</h2>
            <p className="text-muted-foreground">Join a discussion or start a new topic</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Topic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Topic</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Topic Name</Label>
                  <Input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="e.g., Hackathon Ideas" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newTopicDesc} onChange={(e) => setNewTopicDesc(e.target.value)} placeholder="Describe what this topic is about..." rows={3} />
                </div>
                <Button onClick={createTopic} disabled={creating} className="w-full">
                  {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating with AI...</> : "Create Topic"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : topics.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No topics yet</p>
              <p className="text-muted-foreground">Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, i) => (
              <motion.div key={topic.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate(`/topic/${topic.id}`)}>
                  <CardHeader>
                    <CardTitle className="font-display text-lg">{topic.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
