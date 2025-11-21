# Supabase Configuration Checklist

Complete these steps in order:

## ✅ Step 1: Run Migration
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Copy entire `migration-collaborative.sql` contents
- [ ] Run in SQL Editor
- [ ] Verify no errors

## ✅ Step 2: Create Owner Account
- [ ] Sign up in app OR create user in Supabase Dashboard
- [ ] Copy your User ID or email
- [ ] Run owner setup query in SQL Editor (see AUTHENTICATION_SETUP.md)
- [ ] Verify you have `role='OWNER'` and `approved=TRUE`

## ✅ Step 3: Enable Email Verification
- [ ] Go to Supabase Dashboard → Authentication → Settings
- [ ] Check "Enable email confirmations" is ON
- [ ] Save settings

## ✅ Step 4: Configure Google OAuth (Optional but Recommended)
- [ ] Go to Google Cloud Console
- [ ] Create OAuth 2.0 credentials
- [ ] Add Supabase redirect URI
- [ ] Copy Client ID and Secret
- [ ] Paste into Supabase → Authentication → Providers → Google
- [ ] Save

## ✅ Step 5: Configure Apple OAuth (Optional)
**Note:** Requires Apple Developer account ($99/year)
- [ ] Go to Apple Developer Portal
- [ ] Create App ID with Sign In capability
- [ ] Create Service ID
- [ ] Configure domains and redirect URLs
- [ ] Create Key for Sign In with Apple
- [ ] Copy all credentials
- [ ] Paste into Supabase → Authentication → Providers → Apple
- [ ] Save

## ✅ Step 6: Test Authentication
- [ ] Try signing up as a new user
- [ ] Verify email confirmation works
- [ ] Test Google Sign-In (if configured)
- [ ] Test Apple Sign-In (if configured)
- [ ] Log in as Owner and approve new user
- [ ] Verify new user can access the tree

## 📝 Notes

- **Google OAuth** is highly recommended - most users have Google accounts
- **Apple OAuth** is optional - requires paid developer account
- **Email/Password** always works as fallback
- You can add/remove OAuth providers anytime without affecting existing users

## Next Steps After Configuration

Once Supabase is configured, the React components will handle:
- Sign up with person claiming
- OAuth button integration
- Role management UI
- Privacy filtering
- User approval system

All of this is being built in the next steps!
