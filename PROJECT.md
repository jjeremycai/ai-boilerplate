# Project Definition

> This file should be edited to define YOUR specific project requirements for AI assistants.
> 
> **Architecture Note:** This boilerplate uses a single-dashboard architecture with integrated features accessible through tabs, optimized for minimal dependencies (350 packages).

## Project Overview
<!-- Describe your project in 2-3 sentences -->
[Your project description here]

## Business Goals
<!-- What problem does this solve? Who is the target user? -->
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Built-in Features
<!-- The boilerplate includes these integrated features -->
1. **D1 Database Management** - Full CRUD operations with SQL editor for Cloudflare D1
2. **KV Blog System** - SEO-optimized blog using Cloudflare KV for content storage
3. **AI Chat** - Persistent chat interface with conversation history
4. **Volume-Based Sharding** - Automatic horizontal scaling for D1 databases beyond 10GB

## Core Features
<!-- List the additional features your application needs beyond the built-in ones -->
1. **Feature Name** - Description
2. **Feature Name** - Description
3. **Feature Name** - Description

## Technical Requirements
<!-- Any specific technical needs beyond the boilerplate -->
- [ ] Requirement 1
- [ ] Requirement 2

## UI/UX Guidelines
<!-- Design preferences, user flow, etc. -->
- Style: [Modern, Minimal, Bold, etc.]
- Primary Color: #3B82F6
- Dashboard Architecture:
  - [x] Single Dashboard at `/dashboard` with tab navigation
  - [x] Tab 1: D1 Database Management
  - [x] Tab 2: KV Blog System
  - [x] Tab 3: AI Chat Interface
  - [ ] Additional tabs for your features
- No separate Home or About pages (single-dashboard design)

## API Specifications
<!-- Define your API endpoints if different from boilerplate -->
```
POST /api/v1/your-endpoint
{
  "field": "value"
}
```

## Data Models
<!-- Define your database schema needs -->
```sql
-- Example: Add your tables here
CREATE TABLE your_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Phases
<!-- Break down the project into phases -->
### Phase 1: Foundation (Provided by Boilerplate)
- [x] Authentication flow with Clerk
- [x] Single dashboard layout with tab navigation
- [x] D1 Database integration with management UI
- [x] KV storage for blog content
- [x] AI chat with conversation persistence

### Phase 2: Core Features
- [ ] Add custom tabs to dashboard
- [ ] Integrate your specific features
- [ ] [Your tasks]

### Phase 3: Polish
- [ ] Customize styling and branding
- [ ] Optimize performance
- [ ] [Your tasks]

## Success Criteria
<!-- How will you know the project is complete? -->
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

---

**Note to AI:** This project builds on the existing boilerplate which features:
- Single-dashboard architecture (no multiple pages)
- Three integrated features in tabs (D1 Database, KV Blog, AI Chat)
- Minimal dependencies (350 packages total)
- All new features should be added as dashboard tabs

Refer to MODEL-INSTRUCTIONS.md for technical implementation details.