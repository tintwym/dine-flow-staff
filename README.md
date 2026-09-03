# office — staff (desktop + tablet)

One staff site for counter, kitchen, floor, and manager.

## Local

```bash
../supabase/sync-env.sh
npm install
npm run dev          # http://localhost:3001
```

- Login: http://localhost:3001/login  
- QR print: http://localhost:3001/qrs  

Demo: `manager@dineflow.local` / `DineFlow1!`  
(also `cashier@`, `floor@`, `kitchen@dineflow.local`)

## Deploy to Vercel

1. Import this folder as a **new** Vercel project (or set Root Directory = `office` in a monorepo).
2. Environment variables (same Supabase as customer):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krbhwyfaondqyuyfzxxs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your cloud `eyJ…` anon key |
| `NEXT_PUBLIC_GUEST_ORDER_BASE_URL` | `https://dine-flow-restaurant.vercel.app` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `diqkh6yqr` (optional) |

3. Deploy → open `/login`

Guest app: `../customer`
