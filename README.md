# Family Tree - Multi-Generation Genealogy Manager

A modern web application for building and managing family trees spanning multiple generations. Connect families through marriages and preserve your family history.

## Features

- **Person Management**: Add, edit, and manage family members with detailed information
- **Relationship Tracking**: Define parent-child, spouse, sibling, and other relationships
- **Multi-Family Support**: Connect multiple families through marriages
- **Interactive Visualization**: Beautiful graph-based family tree (up to 10 generations)
- **Photo Management**: Upload and display profile photos
- **Data Validation**: Prevents invalid relationships (loops, age issues, etc.)
- **Search & Filter**: Quickly find family members
- **Export Options**: Save your tree as PDF or image

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Visualization**: React Flow
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier is sufficient)

### Installation

1. **Clone the repository**
   ```bash
   cd family_tree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   Follow the detailed instructions in [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md):
   - Create a Supabase project
   - Run the database schema
   - Get your API keys
   - Configure environment variables

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Adding Your First Family Member

1. Click "Get Started" on the home page
2. Fill in the person's details (name, birth date, etc.)
3. Upload a profile photo (optional)
4. Click "Save"

### Building Relationships

- **Add Parent**: Select a person, click "Add Parent", fill in details
- **Add Child**: Select a person, click "Add Child", fill in details
- **Add Spouse**: Select a person, click "Add Spouse", set marriage date
- **Add Sibling**: Select a person, click "Add Sibling"

### Creating Family Groups

1. Navigate to "Family Groups"
2. Click "Create New Group"
3. Name your family group (e.g., "Smith Family")
4. Add members to the group

### Viewing the Family Tree

- Click "Tree View" to see the interactive graph
- Zoom with mouse wheel or pinch gesture
- Click and drag to pan
- Click on a person to see details
- Use generation controls to expand/collapse levels

## Project Structure

```
family_tree/
├── src/
│   ├── components/      # React components
│   ├── lib/            # Supabase client setup
│   ├── services/       # API service layer
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # App entry point
├── supabase-schema.sql # Database schema
├── .env.example        # Environment variables template
└── README.md           # This file
```

## Database Schema

### Tables

- **person**: Stores individual family members
- **relationship**: Stores relationships between persons
- **family_group**: Stores family group information
- **person_family_group**: Junction table for many-to-many relationships

See [supabase-schema.sql](./supabase-schema.sql) for the complete schema.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

Your Supabase database is already hosted (free tier), so you only need to deploy the frontend.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

### Adding New Features

1. Create types in `src/types/`
2. Add service methods in `src/services/`
3. Update store in `src/store/`
4. Build UI components in `src/components/`
5. Test thoroughly

## Roadmap

### Phase 1 (Current)
- ✅ Core person and relationship management
- ✅ Database setup with Supabase
- ✅ Basic UI and forms
- 🔄 Family tree visualization
- 🔄 Photo upload
- 🔄 Multi-family group support

### Phase 2 (Future)
- [ ] Advanced search and filtering
- [ ] Data import/export (GEDCOM format)
- [ ] Print-friendly PDF export
- [ ] Timeline view
- [ ] Historical events integration

### Phase 3 (Future)
- [ ] Collaborative editing
- [ ] User authentication and permissions
- [ ] Rich media (videos, audio recordings)
- [ ] AI-powered photo recognition
- [ ] DNA integration

## Contributing

This is a family project, but suggestions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - feel free to use this for your own family!

## Support

For setup help, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)

For issues or questions, create an issue on GitHub.

## Acknowledgments

- Built with love for family preservation
- Inspired by the need for a modern, flexible genealogy tool
- Thanks to the open-source community for amazing tools

---

**Made with ❤️ for families everywhere**
