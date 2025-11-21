-- Authentication Migration for Family Tree App
-- Run this in Supabase SQL Editor after creating your initial schema
-- This adds user authentication and data isolation

-- Step 1: Add user_id columns to tables
ALTER TABLE person ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE family_group ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for user_id columns
CREATE INDEX idx_person_user ON person(user_id);
CREATE INDEX idx_family_group_user ON family_group(user_id);

-- Step 3: Drop old public access policies
DROP POLICY IF EXISTS "Enable read access for all users" ON person;
DROP POLICY IF EXISTS "Enable insert access for all users" ON person;
DROP POLICY IF EXISTS "Enable update access for all users" ON person;
DROP POLICY IF EXISTS "Enable delete access for all users" ON person;

DROP POLICY IF EXISTS "Enable read access for all users" ON relationship;
DROP POLICY IF EXISTS "Enable insert access for all users" ON relationship;
DROP POLICY IF EXISTS "Enable update access for all users" ON relationship;
DROP POLICY IF EXISTS "Enable delete access for all users" ON relationship;

DROP POLICY IF EXISTS "Enable read access for all users" ON family_group;
DROP POLICY IF EXISTS "Enable insert access for all users" ON family_group;
DROP POLICY IF EXISTS "Enable update access for all users" ON family_group;
DROP POLICY IF EXISTS "Enable delete access for all users" ON family_group;

DROP POLICY IF EXISTS "Enable read access for all users" ON person_family_group;
DROP POLICY IF EXISTS "Enable insert access for all users" ON person_family_group;
DROP POLICY IF EXISTS "Enable update access for all users" ON person_family_group;
DROP POLICY IF EXISTS "Enable delete access for all users" ON person_family_group;

-- Step 4: Create user-specific RLS policies for person table
CREATE POLICY "Users can view their own persons"
  ON person FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persons"
  ON person FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons"
  ON person FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons"
  ON person FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Create user-specific RLS policies for relationship table
-- Relationships are visible if either person in the relationship belongs to the user
CREATE POLICY "Users can view their own relationships"
  ON relationship FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = relationship.person1_id AND person.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create relationships for their persons"
  ON relationship FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = relationship.person1_id AND person.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM person WHERE person.id = relationship.person2_id AND person.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own relationships"
  ON relationship FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = relationship.person1_id AND person.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own relationships"
  ON relationship FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = relationship.person1_id AND person.user_id = auth.uid()
    )
  );

-- Step 6: Create user-specific RLS policies for family_group table
CREATE POLICY "Users can view their own family groups"
  ON family_group FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family groups"
  ON family_group FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family groups"
  ON family_group FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family groups"
  ON family_group FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create user-specific RLS policies for person_family_group junction table
CREATE POLICY "Users can view their own person-family-group relationships"
  ON person_family_group FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = person_family_group.person_id AND person.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own person-family-group relationships"
  ON person_family_group FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = person_family_group.person_id AND person.user_id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM family_group WHERE family_group.id = person_family_group.family_group_id AND family_group.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own person-family-group relationships"
  ON person_family_group FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = person_family_group.person_id AND person.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own person-family-group relationships"
  ON person_family_group FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM person WHERE person.id = person_family_group.person_id AND person.user_id = auth.uid()
    )
  );

-- Step 8: Update storage policies (already has authenticated requirement, but let's make it explicit)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads" ON storage.objects;

CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their own photos" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their own photos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

-- Step 9: Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create triggers to automatically set user_id
CREATE TRIGGER set_person_user_id
  BEFORE INSERT ON person
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_family_group_user_id
  BEFORE INSERT ON family_group
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
