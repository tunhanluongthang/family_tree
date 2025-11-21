# Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `family-tree`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. You should see "Success. No rows returned" - this is correct!

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. In this project, create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 5: Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Step 6: Verify Database Connection

Once the app loads, try adding your first family member. If successful, your database is connected!

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env` file exists in the root directory
- Check that variable names start with `VITE_`
- Restart the dev server after creating `.env`

### Error: "Failed to fetch"
- Check your Supabase URL is correct
- Make sure your project is running (not paused)
- Verify RLS policies are created

### Tables not found
- Re-run the SQL schema in Supabase SQL Editor
- Check for SQL errors in the editor

## Next Steps

Once running:
1. Add your first family member
2. Start building relationships
3. Visualize your family tree
4. Invite family members to collaborate

## Deployment (Later)

When ready to deploy:
- Frontend: Deploy to [Vercel](https://vercel.com) (free)
- Database: Already hosted on Supabase (free tier)
- Just add environment variables in Vercel dashboard
