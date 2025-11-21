# Supabase Storage Setup for Profile Photos

Before you can upload profile photos, you need to create a storage bucket in Supabase.

## Steps:

### 1. Open Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project

### 2. Navigate to Storage
- Click **"Storage"** in the left sidebar
- Click **"Create a new bucket"**

### 3. Create Bucket
- **Name**: `profile-photos`
- **Public bucket**: ✅ **Check this box** (important!)
- Click **"Create bucket"**

### 4. Set Storage Policies (Optional - for better security)

If you want to add security policies, go to the **Policies** tab and add:

#### Allow Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-photos' );
```

#### Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profile-photos' AND auth.role() = 'authenticated' );
```

#### Allow Authenticated Users to Update/Delete Their Own
```sql
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'profile-photos' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'profile-photos' AND auth.role() = 'authenticated' );
```

**Note**: Since we haven't implemented authentication yet (that's Phase 3), you can skip the policies for now. Just make sure the bucket is **public**.

### 5. Verify Setup
- Go back to the **Storage** section
- You should see `profile-photos` bucket listed
- The bucket should show as **Public**

### 6. Test Upload
- Try adding or editing a person in your app
- Upload a profile photo
- The photo should appear on the person's card

## Troubleshooting

**Error: "Failed to upload photo"**
- Make sure the bucket name is exactly `profile-photos` (no typos)
- Ensure the bucket is marked as **Public**
- Check that your Supabase URL and anon key are correct in `.env`

**Photo uploads but doesn't show**
- Check browser console for CORS errors
- Verify the bucket is public
- Try refreshing the page after upload

---

✅ Once this is set up, profile photo uploads will work!
