# Go-Live Checklist

Steps to run before the wedding day (March 21, 2026).

## Wipe test data

Clear all development wishes and reset IDs so the first real wish starts at #1:

```sql
TRUNCATE public.wishes RESTART IDENTITY;
```

Via CLI:

```bash
npx supabase db query --linked "TRUNCATE public.wishes RESTART IDENTITY;"
```

## Verify Supabase is active

Free-tier projects pause after 7 days of inactivity. Make sure the project is awake before the wedding:

1. Visit the [Supabase dashboard](https://supabase.com/dashboard) and check the project status
2. Or just load the site — if wishes load, it's active

## Double-check env vars

Make sure production `.env.local` has the correct values:

```
NEXT_PUBLIC_SUPABASE_URL=https://njctehzeyosgiundxzgz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your key>
```
