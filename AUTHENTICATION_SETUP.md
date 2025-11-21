# Authentication Setup Guide

This guide walks you through setting up the collaborative authentication system for your Family Tree application.

## Prerequisites

- Supabase project created
- Initial schema (`supabase-schema.sql`) already run
- **DO NOT run `add-authentication.sql`** - that's for isolated trees only!

---

## Step 1: Run the Collaborative Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `migration-collaborative.sql`
3. Run it in the SQL Editor
4. Verify success (no errors)

---

## Step 2: Create Your Owner Account

### Option A: Using Email/Password

1. Sign up in your app with your email and password
2. Check your email and verify your account
3. Go back to Supabase SQL Editor and run:

```sql
-- Replace with YOUR email
UPDATE user_profile
SET role = 'OWNER', approved = TRUE
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
  LIMIT 1
);
```

4. Refresh your app - you should now have Owner access!

### Option B: Directly in Supabase

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → Choose "Create new user"
3. Enter your email and password
4. Check "Auto Confirm User" (to skip email verification)
5. Copy the User ID
6. Go to SQL Editor and run:

```sql
-- Replace with YOUR user ID
UPDATE user_profile
SET role = 'OWNER', approved = TRUE
WHERE id = 'YOUR-USER-ID-HERE';
```

---

## Step 3: Configure OAuth Providers

### Enable Google Sign-In

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" and click "Enable"
3. You need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**
4. Paste them into Supabase Google provider settings
5. Click "Save"

### Enable Apple Sign-In

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Apple" and click "Enable"
3. You need Apple credentials:
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Sign in with your Apple ID (you'll need an Apple Developer account)
   - Go to "Certificates, Identifiers & Profiles"
   - Create a new App ID for your family tree app
   - Enable "Sign In with Apple" capability
   - Create a Service ID
   - Configure your Service ID:
     - Add your domain
     - Add return URLs:
       ```
       https://<your-project-ref>.supabase.co/auth/v1/callback
       ```
   - Create a Key for "Sign In with Apple"
   - Download the .p8 key file
   - Copy:
     - **Services ID** (e.g., com.yourapp.signin)
     - **Team ID** (10-character ID)
     - **Key ID** (from the key you created)
     - **Private Key** (contents of the .p8 file)
4. Paste all information into Supabase Apple provider settings
5. Click "Save"

**Note:** Apple Sign-In requires a paid Apple Developer account ($99/year). If you don't have one, you can skip this step and use Google + Email/Password only.

### Enable Email Verification

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Customize the "Confirm signup" email template (optional)
3. Go to Authentication → Settings
4. Ensure "Enable email confirmations" is checked
5. Save settings

---

## Step 4: Link Your Person Record (Optional)

If you've already added yourself to the family tree:

```sql
-- Find your person ID first
SELECT id, first_name, last_name FROM person WHERE first_name = 'YourFirstName';

-- Then link it to your account
UPDATE user_profile
SET claimed_person_id = 'YOUR-PERSON-ID-HERE'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
);
```

---

## Step 5: Test the System

1. Log out of your Owner account
2. Try signing up as a new user (use a different email or incognito mode)
3. Search for an existing person and claim them
4. You should see "Pending approval" message
5. Log back in as Owner
6. Go to User Management
7. Approve the new user
8. The new user should now have access!

---

## Step 6: Invite Your Family

Send them the link to your deployed app. They can:

1. **Sign up** with Email/Password, Google, or Apple
2. **Claim their person** in the family tree
3. **Wait for your approval**
4. **Start contributing** once approved!

---

## Role Permissions

| Role | View All | Add | Edit Own | Edit All | Manage Users |
|------|----------|-----|----------|----------|--------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Contributor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Changing Default Role

Currently, new users default to **Contributor**. To change this to **Viewer**:

1. Go to Supabase SQL Editor
2. Run:

```sql
-- Change default role to VIEWER
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (id, role, email_verified, approved)
  VALUES (
    NEW.id,
    'VIEWER', -- Changed from 'CONTRIBUTOR'
    NEW.email_confirmed_at IS NOT NULL,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Users can then request upgrade to Contributor via the app

---

## Privacy System

The migration includes a privacy system:

- **Close family** (parents, siblings, children) see:
  - Full date of birth
  - Maiden name
  - All detailed information

- **Distant relatives** see:
  - Age (calculated from DOB)
  - Place of birth
  - Basic information only
  - Email address

This privacy system is automatically enforced in Phase 1!

---

## Phase 2 Preview

When you're ready for bilateral descent visibility (where users only see their bloodline):

1. The database structure stays the same
2. We'll add the `is_visible_to_user()` function
3. We'll update the RLS policies to use that function
4. No data loss, no UI changes!

---

## Troubleshooting

### Users can't see anything after logging in

Check if they're approved:
```sql
SELECT email, role, approved FROM user_profile
JOIN auth.users ON user_profile.id = auth.users.id;
```

If `approved = FALSE`, approve them:
```sql
UPDATE user_profile SET approved = TRUE WHERE id = 'USER-ID-HERE';
```

### OAuth not working

1. Check redirect URIs match exactly
2. Verify OAuth credentials are correct
3. Check Supabase logs for error messages

### Email verification not sending

1. Check Supabase → Authentication → Settings → Email confirmations is enabled
2. Check your email spam folder
3. Check Supabase logs for SMTP errors

---

## Need Help?

- Supabase Docs: https://supabase.com/docs/guides/auth
- OAuth Setup: https://supabase.com/docs/guides/auth/social-login
- RLS Docs: https://supabase.com/docs/guides/auth/row-level-security
