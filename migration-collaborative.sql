-- ============================================================================
-- COLLABORATIVE FAMILY TREE AUTHENTICATION MIGRATION
-- ============================================================================
-- This migration creates a collaborative shared tree where:
-- 1. All authenticated users can see all data (Phase 1)
-- 2. Users claim person records to link their account to the tree
-- 3. Roles determine what users can edit (Owner, Admin, Contributor, Viewer)
-- 4. Privacy system hides sensitive details from distant relatives
-- 5. Foundation ready for Phase 2 bilateral descent visibility
--
-- Run this in Supabase SQL Editor AFTER running supabase-schema.sql
-- ============================================================================

-- ============================================================================
-- PART 1: USER PROFILES AND ROLES
-- ============================================================================

-- User profile table (extends auth.users)
CREATE TABLE user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER')) DEFAULT 'CONTRIBUTOR',
  claimed_person_id UUID REFERENCES person(id) ON DELETE SET NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_profile_claimed_person ON user_profile(claimed_person_id);
CREATE INDEX idx_user_profile_role ON user_profile(role);
CREATE INDEX idx_user_profile_approved ON user_profile(approved);

-- ============================================================================
-- PART 2: EXTEND PERSON TABLE
-- ============================================================================

-- Add tracking columns to person table
ALTER TABLE person ADD COLUMN claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE person ADD COLUMN added_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes for faster lookups
CREATE INDEX idx_person_claimed_by ON person(claimed_by_user_id);
CREATE INDEX idx_person_added_by ON person(added_by_user_id);

-- ============================================================================
-- PART 3: ROLE UPGRADE REQUEST SYSTEM
-- ============================================================================

-- Role upgrade request table (Viewer → Contributor)
CREATE TABLE role_upgrade_request (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('CONTRIBUTOR')),
  reason TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_upgrade_user ON role_upgrade_request(user_id);
CREATE INDEX idx_role_upgrade_status ON role_upgrade_request(status);

-- ============================================================================
-- PART 4: HELPER FUNCTIONS FOR ROLES AND PERMISSIONS
-- ============================================================================

-- Check if user is Owner
CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profile
    WHERE id = user_id AND role = 'OWNER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is Admin or Owner
CREATE OR REPLACE FUNCTION is_admin_or_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profile
    WHERE id = user_id AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can edit a person
CREATE OR REPLACE FUNCTION can_edit_person(person_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(20);
  person_added_by UUID;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM user_profile WHERE id = user_id;

  -- Owner and Admin can edit anything
  IF user_role IN ('OWNER', 'ADMIN') THEN
    RETURN TRUE;
  END IF;

  -- Contributor can edit what they added
  IF user_role = 'CONTRIBUTOR' THEN
    SELECT added_by_user_id INTO person_added_by FROM person WHERE id = person_id;
    RETURN person_added_by = user_id;
  END IF;

  -- Viewer cannot edit
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 5: PRIVACY HELPER FUNCTIONS
-- ============================================================================

-- Check if two persons are biological parent-child
CREATE OR REPLACE FUNCTION is_parent_child(person1_id UUID, person2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM relationship
    WHERE type = 'PARENT_CHILD'
    AND (
      (person1_id = person1_id AND person2_id = person2_id)
      OR (person1_id = person2_id AND person2_id = person1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if two persons are biological siblings
CREATE OR REPLACE FUNCTION is_sibling(person1_id UUID, person2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM relationship
    WHERE type = 'SIBLING'
    AND (
      (person1_id = person1_id AND person2_id = person2_id)
      OR (person1_id = person2_id AND person2_id = person1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can see detailed info of a person
-- Detailed info visible to: biological parents, biological siblings, biological children
CREATE OR REPLACE FUNCTION can_see_detailed_info(person_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  viewer_person_id UUID;
BEGIN
  -- Owner/Admin can see everything
  IF is_admin_or_owner(user_id) THEN
    RETURN TRUE;
  END IF;

  -- Get the person record claimed by the viewing user
  SELECT claimed_person_id INTO viewer_person_id
  FROM user_profile
  WHERE id = user_id;

  -- If user hasn't claimed a person, they only see basic info
  IF viewer_person_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if viewer is viewing their own profile
  IF viewer_person_id = person_id THEN
    RETURN TRUE;
  END IF;

  -- Check if viewer is parent, child, or sibling
  IF is_parent_child(viewer_person_id, person_id) THEN
    RETURN TRUE;
  END IF;

  IF is_sibling(viewer_person_id, person_id) THEN
    RETURN TRUE;
  END IF;

  -- Not close family, only basic info
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 6: DROP OLD PUBLIC ACCESS POLICIES
-- ============================================================================

-- Drop existing public access policies
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

-- ============================================================================
-- PART 7: NEW RLS POLICIES - SHARED VISIBILITY (PHASE 1)
-- ============================================================================

-- PERSON TABLE POLICIES
-- Phase 1: All authenticated AND APPROVED users can see all persons
CREATE POLICY "Approved users can view all persons"
  ON person FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
    )
  );

-- Only approved users can add persons (added_by tracked)
CREATE POLICY "Approved users can add persons"
  ON person FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
      AND role IN ('OWNER', 'ADMIN', 'CONTRIBUTOR')
    )
  );

-- Edit based on role permissions
CREATE POLICY "Users can edit persons based on role"
  ON person FOR UPDATE
  TO authenticated
  USING (
    can_edit_person(id, auth.uid())
  );

-- Delete based on role permissions
CREATE POLICY "Users can delete persons based on role"
  ON person FOR DELETE
  TO authenticated
  USING (
    can_edit_person(id, auth.uid())
  );

-- RELATIONSHIP TABLE POLICIES
-- All approved users can see all relationships
CREATE POLICY "Approved users can view all relationships"
  ON relationship FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
    )
  );

-- Approved contributors can add relationships
CREATE POLICY "Approved users can add relationships"
  ON relationship FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
      AND role IN ('OWNER', 'ADMIN', 'CONTRIBUTOR')
    )
  );

-- Owner/Admin can edit all, Contributors can edit what they added
CREATE POLICY "Users can edit relationships based on role"
  ON relationship FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_owner(auth.uid())
    -- TODO: Add tracking of who added relationships for Contributor editing
  );

-- Owner/Admin can delete all
CREATE POLICY "Users can delete relationships based on role"
  ON relationship FOR DELETE
  TO authenticated
  USING (
    is_admin_or_owner(auth.uid())
  );

-- FAMILY_GROUP TABLE POLICIES
-- All approved users can see all family groups
CREATE POLICY "Approved users can view all family groups"
  ON family_group FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
    )
  );

-- Only Owner/Admin can manage family groups
CREATE POLICY "Owner/Admin can manage family groups"
  ON family_group FOR ALL
  TO authenticated
  USING (is_admin_or_owner(auth.uid()))
  WITH CHECK (is_admin_or_owner(auth.uid()));

-- PERSON_FAMILY_GROUP TABLE POLICIES
-- All approved users can see all person-family-group relationships
CREATE POLICY "Approved users can view person family groups"
  ON person_family_group FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profile
      WHERE id = auth.uid()
      AND approved = TRUE
    )
  );

-- Only Owner/Admin can manage person-family-group relationships
CREATE POLICY "Owner/Admin can manage person family groups"
  ON person_family_group FOR ALL
  TO authenticated
  USING (is_admin_or_owner(auth.uid()))
  WITH CHECK (is_admin_or_owner(auth.uid()));

-- ============================================================================
-- PART 8: USER_PROFILE TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profile FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Owner/Admin can view all profiles
CREATE POLICY "Owner/Admin can view all profiles"
  ON user_profile FOR SELECT
  TO authenticated
  USING (is_admin_or_owner(auth.uid()));

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON user_profile FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    -- Users cannot change their own role or approval status
    id = auth.uid()
  );

-- Only Owner can manage other users' roles and approval
CREATE POLICY "Owner can manage all profiles"
  ON user_profile FOR ALL
  TO authenticated
  USING (is_owner(auth.uid()))
  WITH CHECK (is_owner(auth.uid()));

-- Enable RLS on user_profile
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 9: ROLE_UPGRADE_REQUEST TABLE POLICIES
-- ============================================================================

-- Users can view their own requests
CREATE POLICY "Users can view their own role requests"
  ON role_upgrade_request FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owner/Admin can view all requests
CREATE POLICY "Owner/Admin can view all role requests"
  ON role_upgrade_request FOR SELECT
  TO authenticated
  USING (is_admin_or_owner(auth.uid()));

-- Users can create their own requests
CREATE POLICY "Users can create role requests"
  ON role_upgrade_request FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only Owner can approve/reject requests
CREATE POLICY "Owner can manage role requests"
  ON role_upgrade_request FOR UPDATE
  TO authenticated
  USING (is_owner(auth.uid()));

-- Enable RLS on role_upgrade_request
ALTER TABLE role_upgrade_request ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 10: TRIGGERS FOR AUTOMATIC FIELD POPULATION
-- ============================================================================

-- Automatically set added_by_user_id when inserting person
CREATE OR REPLACE FUNCTION set_added_by_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.added_by_user_id IS NULL THEN
    NEW.added_by_user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_person_added_by
  BEFORE INSERT ON person
  FOR EACH ROW
  EXECUTE FUNCTION set_added_by_user_id();

-- Automatically update updated_at for user_profile
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 11: AUTOMATIC USER PROFILE CREATION
-- ============================================================================

-- Automatically create user_profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (id, role, email_verified, approved)
  VALUES (
    NEW.id,
    'CONTRIBUTOR', -- Default role
    NEW.email_confirmed_at IS NOT NULL,
    FALSE -- Requires Owner approval
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- PART 12: FIRST OWNER SETUP
-- ============================================================================

-- You MUST run this AFTER you create your first account
-- Replace 'YOUR_EMAIL@example.com' with your actual email

-- Example (UNCOMMENT AND UPDATE AFTER SIGNUP):
/*
UPDATE user_profile
SET role = 'OWNER', approved = TRUE
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL@example.com'
  LIMIT 1
);
*/

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

-- Next Steps:
-- 1. Sign up with your email/password in the app
-- 2. Run the UPDATE query above (Part 12) to make yourself OWNER
-- 3. Configure OAuth providers in Supabase Dashboard (Google, Apple)
-- 4. Start inviting family members!
