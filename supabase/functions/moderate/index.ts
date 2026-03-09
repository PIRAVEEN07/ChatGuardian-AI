import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, topic_name, topic_description, message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "topic") {
      systemPrompt = `You are an AI moderator for an educational community platform called ChatGuardian AI. Your job is to evaluate whether a proposed discussion topic is appropriate for a learning community.

A valid topic must be:
- Meaningful and clear
- Relevant to learning, education, technology, science, creativity, or professional development
- Appropriately described

Invalid topics include:
- Spam or advertisements
- Offensive or abusive content
- Completely irrelevant to a learning community (e.g. celebrity gossip, gambling)
- Vague or nonsensical topics

Respond ONLY with a JSON object: {"decision": "ALLOW"} or {"decision": "BLOCK", "reason": "brief reason"}`;

      userPrompt = `Topic Name: ${topic_name}\nTopic Description: ${topic_description}\n\nIs this topic appropriate for a learning community?`;
    } else {
      systemPrompt = `You are an AI moderator for an educational community platform called ChatGuardian AI.

Your job is to determine whether a user's message is relevant to the discussion topic and follows respectful community guidelines.

You should BLOCK messages that are:
- Spam or self-promotion
- Advertisements
- Completely off-topic (unrelated to the discussion topic)
- Abusive, hateful, or harassing
- Political discussions unrelated to the topic
- Nonsensical or gibberish

You should ALLOW messages that are:
- On-topic discussions, questions, or ideas
- Friendly greetings or encouragement within context
- Follow-up questions or clarifications
- Constructive feedback or suggestions

Be reasonably lenient - casual conversation that relates to the topic is fine. Only block clearly irrelevant or harmful messages.

Respond ONLY with a JSON object: {"decision": "ALLOW"} or {"decision": "BLOCK", "reason": "brief reason"}`;

      userPrompt = `Topic: ${topic_name}\nTopic Description: ${topic_description}\n\nMessage: ${message}\n\nIs this message relevant and appropriate?`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // On AI failure, default to ALLOW to not block users
      return new Response(JSON.stringify({ decision: "ALLOW" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response from the AI
    let decision = { decision: "ALLOW", reason: "" };
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      // Default to ALLOW if parsing fails
      decision = { decision: "ALLOW", reason: "" };
    }

    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    // Default to ALLOW on error
    return new Response(JSON.stringify({ decision: "ALLOW", reason: "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
