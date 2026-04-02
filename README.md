# Conduit AI

The premier platform for high-status AI efficiency.

---

## 🏁 Phase 4: Final Handover (100% Code Complete)

> [!IMPORTANT]
> **Status**: The entire "Viral Share Layer," "Global Authority Ticker," and "Automated ROI Reporting" code is successfully implemented. 
> 
> To go live, you just need to perform the following **manual operations** in your Supabase and Vercel Dashboards.

### 1. Database Initialization (MANDATORY)
Run the script below in your **Supabase SQL Editor**. This sets up the Trust Score logic, the Global Ticker, and the Lineage tracking functions.

```sql
-- 1. Trust Score and Verification
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- RPC to update a creator's trust score
CREATE OR REPLACE FUNCTION public.update_trust_score(creator_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_acc_starts INTEGER;
  total_acc_completions INTEGER;
  new_trust_score NUMERIC;
BEGIN
  -- Sum up run count and completion count for all flows authored by this creator.
  SELECT COALESCE(SUM(run_count), 0), COALESCE(SUM(completion_count), 0)
  INTO total_acc_starts, total_acc_completions
  FROM public.flows
  WHERE creator_id = creator_profile_id;

  IF total_acc_starts > 0 THEN
    new_trust_score := (total_acc_completions::NUMERIC / total_acc_starts::NUMERIC) * 100.0;
  ELSE
    new_trust_score := 0.0;
  END IF;

  UPDATE public.profiles
  SET 
    trust_score = new_trust_score,
    is_verified = (total_acc_starts >= 50 AND new_trust_score > 85.0)
  WHERE id = creator_profile_id;
END;
$$;


-- 2. Global Ticker RPC
CREATE OR REPLACE FUNCTION public.get_global_time_saved()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(total_time_saved_minutes), 0)::INTEGER
  FROM public.profiles;
$$;


-- 3. Fork Lineage RPC
CREATE OR REPLACE FUNCTION public.get_flow_lineage(target_flow_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  creator_name TEXT,
  depth INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE lineage AS (
    -- Base case: the initial flow
    SELECT 
      f.id, 
      f.title, 
      (SELECT username FROM public.profiles p WHERE p.id = f.creator_id) as creator_name,
      f.parent_flow_id,
      0 as depth
    FROM public.flows f
    WHERE f.id = target_flow_id
    
    UNION ALL
    
    -- Recursive step: get the parent
    SELECT 
      parent.id, 
      parent.title, 
      (SELECT username FROM public.profiles p WHERE p.id = parent.creator_id) as creator_name,
      parent.parent_flow_id,
      l.depth + 1
    FROM public.flows parent
    INNER JOIN lineage l ON parent.id = l.parent_flow_id
  )
  SELECT id, title, creator_name, depth FROM lineage ORDER BY depth DESC;
$$;
```

### 2. Environment Configuration
Ensure these are set in your `.env.local` (for development) and **Vercel Project Settings** (for production):

| Variable | Description |
| :--- | :--- |
| `RESEND_API_KEY` | Your Resend API key (re-verify this). |
| `RESEND_FROM_EMAIL` | The sender address (e.g., `updates@yourdomain.com`). |
| `ADMIN_EMAIL` | Where you want the Weekly ROI reports sent. |
| `CRON_SECRET` | A random string to secure your cron endpoint from outside pings. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for admin-level database overrides in cron jobs. |

### 3. Vercel Deployment & Validation
Push your changes to Git and deploy. Then, perform these final checks:
1. **Cron Job Check**: Go to the "Settings > Cron" tab in your Vercel Dashboard. You should see `/api/cron/roi-report` scheduled for Monday at 9AM.
2. **Social Card Check**: Paste any Flow URL into the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to verify the dynamic OG image renders correctly.
3. **Global Ticker Check**: Complete a flow on your local/prod environment and watch the home page ticker pulse as it updates in real-time.

---

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase
- **Styling**: Vanilla CSS (Premium Dark Mode)
- **Email**: Resend
- **OG Images**: @vercel/og (Dynamic Branding)
- **Scheduling**: Vercel Cron
