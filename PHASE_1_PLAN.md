# Phase 1: Family Tree MVP - Implementation Plan

## Project Scope
A web application for your family and close relatives to:
- Build family trees spanning up to 10 generations
- Connect multiple families through marriages
- Visualize relationships in an interactive graph
- Store photos and basic biographical information

## Core Features (Phase 1)

### 1. Person Management
- Add/edit/delete family members
- Store: name, birth date, death date, gender, birthplace
- Upload profile photo
- Short biography/notes field

### 2. Relationship Management
- Parent-child relationships
- Spouse relationships (with marriage date)
- Auto-detect siblings (shared parents)
- Support multiple marriages

### 3. Family Tree Visualization
- Interactive graph display
- Zoom and pan controls
- Click on person to see details
- Show 3-5 generations initially
- Expand up to 10 generations

### 4. Multi-Family Support
- Create family groups
- Link families through marriages
- Each person can belong to multiple family groups

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **React Flow** or **Cytoscape.js** - Graph visualization
- **Zustand** - Simple state management

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Primary database
- OR **SQLite** - Simpler option for family use

### File Storage
- **Local filesystem** - For photos/documents
- OR **Supabase Storage** - Cloud option

### Deployment (Later)
- **Vercel** - Frontend hosting (free tier)
- **Railway/Render** - Backend hosting (free tier)
- OR **Self-hosted** - Raspberry Pi or home server

## Database Schema

### Person Table
```sql
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  maiden_name VARCHAR(100),
  gender VARCHAR(20),
  date_of_birth DATE,
  date_of_death DATE,
  birth_place VARCHAR(200),
  biography TEXT,
  profile_photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relationship Table
```sql
CREATE TABLE relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'PARENT_CHILD', 'SPOUSE', 'SIBLING'
  person1_id UUID REFERENCES person(id) ON DELETE CASCADE,
  person2_id UUID REFERENCES person(id) ON DELETE CASCADE,
  start_date DATE, -- Marriage date for SPOUSE
  end_date DATE, -- Divorce/death date
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_relationship CHECK (person1_id != person2_id)
);
```

### Family Group Table
```sql
CREATE TABLE family_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Person-Family Group Junction
```sql
CREATE TABLE person_family_group (
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_group(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'FOUNDER', 'MEMBER', 'MARRIED_IN'
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (person_id, family_group_id)
);
```

## Development Phases

### Week 1-2: Setup & Core Backend
- [ ] Initialize project structure
- [ ] Set up database (PostgreSQL or SQLite)
- [ ] Create database schema
- [ ] Build REST API for Person CRUD
- [ ] Build REST API for Relationship CRUD

### Week 3-4: Frontend Foundation
- [ ] Set up React + Vite + TypeScript
- [ ] Create Person form (add/edit)
- [ ] Create Person list view
- [ ] Create Person detail page
- [ ] Implement photo upload

### Week 5-6: Relationship Building
- [ ] UI for adding relationships
- [ ] Quick-add family members (parent, child, spouse, sibling)
- [ ] Relationship validation logic
- [ ] Prevent invalid relationships (loops, age issues)

### Week 7-8: Visualization
- [ ] Integrate graph library (React Flow or Cytoscape.js)
- [ ] Build basic tree layout algorithm
- [ ] Render family tree from data
- [ ] Add interactivity (click, zoom, pan)
- [ ] Color-code by family group

### Week 9-10: Multi-Family & Polish
- [ ] Family group management UI
- [ ] Link families through marriages
- [ ] Data validation and error handling
- [ ] Basic search functionality
- [ ] Export tree as image/PDF

## Simplified Approach (For Faster Start)

### Option A: Full-Stack (Recommended for Learning)
- Backend API + Database + Frontend SPA
- More scalable, better separation of concerns
- Can be deployed separately

### Option B: Frontend-Only (Fastest MVP)
- React app with local storage
- No backend needed initially
- Data stored in browser
- Export/import as JSON file
- Can add backend later

### Option C: Supabase (Easiest Backend)
- Supabase provides database + auth + storage
- Just build React frontend
- No backend code needed
- Free tier generous for family use

## Recommended Starting Point

**I recommend Option C (React + Supabase)** because:
1. Fastest to get working
2. No backend code to maintain
3. Free hosting for database
4. Easy to share with family
5. Real-time updates built-in
6. Can export data anytime

## Next Steps

1. Choose your approach (A, B, or C)
2. Set up project structure
3. Create database schema
4. Build first feature: Add a person
5. Iterate from there

Ready to start coding?
