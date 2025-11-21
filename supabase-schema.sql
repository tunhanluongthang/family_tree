-- Family Tree Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Person Table
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  maiden_name VARCHAR(100),
  gender VARCHAR(20),
  date_of_birth DATE,
  date_of_death DATE,
  birth_place VARCHAR(200),
  biography TEXT,
  profile_photo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationship Table
CREATE TABLE relationship (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('PARENT_CHILD', 'SPOUSE', 'SIBLING', 'ADOPTED', 'STEP')),
  person1_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_relationship CHECK (person1_id != person2_id)
);

-- Family Group Table
CREATE TABLE family_group (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Person-Family Group Junction Table
CREATE TABLE person_family_group (
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  family_group_id UUID NOT NULL REFERENCES family_group(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('FOUNDER', 'MEMBER', 'MARRIED_IN')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (person_id, family_group_id)
);

-- Indexes for better query performance
CREATE INDEX idx_person_name ON person(first_name, last_name);
CREATE INDEX idx_person_dates ON person(date_of_birth, date_of_death);
CREATE INDEX idx_relationship_person1 ON relationship(person1_id);
CREATE INDEX idx_relationship_person2 ON relationship(person2_id);
CREATE INDEX idx_relationship_type ON relationship(type);
CREATE INDEX idx_person_family_group_person ON person_family_group(person_id);
CREATE INDEX idx_person_family_group_family ON person_family_group(family_group_id);

-- Unique constraint for spouse relationships (no duplicate marriages)
CREATE UNIQUE INDEX idx_unique_spouse ON relationship (
  LEAST(person1_id, person2_id),
  GREATEST(person1_id, person2_id)
) WHERE type = 'SPOUSE' AND end_date IS NULL;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update person.updated_at
CREATE TRIGGER update_person_updated_at
  BEFORE UPDATE ON person
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_family_group ENABLE ROW LEVEL SECURITY;

-- Public access policies (for now - you can restrict later)
-- These allow anyone to read/write. Adjust based on your needs.

CREATE POLICY "Enable read access for all users" ON person
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON person
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON person
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON person
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON relationship
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON relationship
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON relationship
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON relationship
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON family_group
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON family_group
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON family_group
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON family_group
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON person_family_group
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON person_family_group
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON person_family_group
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON person_family_group
  FOR DELETE USING (true);

-- Create storage bucket for profile photos (run in SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for profile photos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete their uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos');
