# NOVUA Decision Room — Week 1 Deploy Checklist

## Before Deploy

- [ ] `npm run build` passes locally
- [ ] Supabase schema has been applied from `supabase/schema.sql`
- [ ] `.env.local` works locally
- [ ] no exposed secrets remain in screenshots or copied files

## Vercel Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended for demo protection:

- `DEMO_BASIC_AUTH_USER`
- `DEMO_BASIC_AUTH_PASSWORD`

Optional:

- `DEMO_MODE=1`

## Production Smoke Test

After deploy, verify:

- [ ] `/dashboard` loads
- [ ] queue shows live deals
- [ ] open one deal brief
- [ ] one valid action updates the deal
- [ ] returning to workspace preserves the new state
- [ ] `Export audit packet` downloads JSON
- [ ] auth challenge appears if demo auth is enabled

## Demo Readiness

- [ ] `docs/DEMO_SCRIPT.md` reviewed once before sharing the link
- [ ] one clean deal selected for the main walkthrough
- [ ] reset path available if using demo mode
- [ ] short GIF or screen recording captured from the production environment

## Good Demo Links

- Dashboard: `/dashboard`
- Main example: `/decisions/deal-1`
- Simulation: `/simulation`
