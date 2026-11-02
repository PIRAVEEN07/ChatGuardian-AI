-- Count blocked messages without exposing their contents to regular members.
CREATE INDEX IF NOT EXISTS blocked_messages_topic_created_at_idx
  ON public.blocked_messages (topic_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.count_blocked_messages(_topic_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)
  FROM public.blocked_messages AS blocked
  WHERE blocked.topic_id = _topic_id
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.count_blocked_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_blocked_messages(uuid) TO authenticated;
