# CHANGES.md — Code Block Changes for Existing Files

These are the **only edits needed to existing files**. Every other new file is
already complete and ready to drop in. Make these changes in your editor, save,
and the project is complete.

---

## 1. `src/types/index.ts` — Add `is_admin` to Profile

Find the `Profile` interface and add one line:

```diff
 export interface Profile {
   id: string
   username: string
   avatar_seed: string
   bio: string | null
   created_at: string
   current_streak: number
   longest_streak: number
   last_completed_date: string | null
   total_time_saved_minutes: number
   total_xp: number
+  is_admin?: boolean
 }
```

---

## 2. `src/lib/supabase/types.ts` — Add `is_admin` to profiles table type

Find the `profiles` table section and add `is_admin` to `Row`, `Insert`, and `Update`:

```diff
 // Inside profiles > Row:
   total_xp: number
+  is_admin: boolean

 // Inside profiles > Insert:
   total_xp?: number
+  is_admin?: boolean

 // Inside profiles > Update:
   total_xp?: number
+  is_admin?: boolean
```

---

## 3. `src/components/fork-button.tsx` — Fix incorrect API URL

The fork route is registered at `/flow/fork`, not `/api/flow/fork`.

```diff
-      const res = await fetch('/api/flow/fork', {
+      const res = await fetch('/flow/fork', {
```

---

## 4. `src/app/components/nav.tsx` — Show admin link for admin users

Add an admin link in the profile dropdown so admins can reach the panel.

Find the dropdown block that contains the "Profile" link and add one line:

```diff
 <Link
   href={`/profile/${profile.username}`}
   className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
 >
   Profile
 </Link>
+{profile.is_admin && (
+  <Link
+    href="/admin"
+    className="block px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-secondary)]"
+  >
+    Admin Panel
+  </Link>
+)}
 <button
   onClick={handleSignOut}
```

---

## 5. `.env.local` — Add the Service Role Key

The admin API routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS safely for
moderation actions. Get this from your Supabase project dashboard under
**Project Settings → API → service_role secret**.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
OPENAI_API_KEY=sk-...your-openai-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` does NOT have the `NEXT_PUBLIC_` prefix.
> It is never exposed to the browser. It is only used in server-side API routes.

---

## Summary — What each change does

| File | Why |
|------|-----|
| `src/types/index.ts` | TypeScript knows about `is_admin` on the Profile object |
| `src/lib/supabase/types.ts` | Supabase client has correct types for the new column |
| `src/components/fork-button.tsx` | Fixes a URL mismatch that caused forking to 404 |
| `src/components/nav.tsx` | Admin users see an "Admin Panel" link in their dropdown |
| `.env.local` | Adds service role key for safe server-side admin writes |
