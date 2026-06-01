CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total',           (SELECT COUNT(*)::int FROM ticket),
    'open',            (SELECT COUNT(*)::int FROM ticket WHERE status = 'open'),
    'aiResolved',      (
                         SELECT COUNT(*)::int FROM ticket t
                         WHERE t.status = 'resolved'
                           AND EXISTS (
                             SELECT 1 FROM reply r
                             WHERE r."ticketId" = t.id AND r."senderType" = 'ai'
                           )
                       ),
    'avgResolutionMs', (
                         SELECT COALESCE(
                           AVG(
                             EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000
                           )::bigint,
                           0
                         )
                         FROM ticket
                         WHERE status IN ('resolved', 'closed')
                       ),
    'byStatus',        (
                         SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
                         FROM (
                           SELECT status, COUNT(*)::int AS cnt
                           FROM ticket
                           WHERE status NOT IN ('new', 'processing')
                           GROUP BY status
                         ) s
                       ),
    'byCategory',      (
                         SELECT COALESCE(jsonb_object_agg(category, cnt), '{}'::jsonb)
                         FROM (
                           SELECT category, COUNT(*)::int AS cnt
                           FROM ticket
                           WHERE category IS NOT NULL
                           GROUP BY category
                         ) c
                       ),
    'dailyVolume',     (
                         SELECT COALESCE(jsonb_agg(
                           jsonb_build_object('date', date, 'count', cnt)
                           ORDER BY date
                         ), '[]'::jsonb)
                         FROM (
                           SELECT DATE("createdAt") AS date, COUNT(*)::int AS cnt
                           FROM ticket
                           WHERE "createdAt" >= NOW() - INTERVAL '30 days'
                           GROUP BY DATE("createdAt")
                         ) d
                       )
  )
$$;
