# Office Drink Ordering System

## Overview

A web-based office drink ordering application that allows employees to order beverages from their workstations while providing kitchen staff with order management capabilities. The system supports three user roles: employees (order drinks), kitchen staff (fulfill orders), and administrators (manage menu and view analytics).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (CSS variables for theming)
- **Charts**: Recharts for analytics visualization in the admin dashboard

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Pattern**: REST API with typed route definitions in `shared/routes.ts`
- **Authentication**: Passport.js with Local Strategy, session-based auth using express-session
- **Session Storage**: MemoryStore for development (should use connect-pg-simple for production with PostgreSQL)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod
- **Database Migrations**: Drizzle Kit for schema migrations (`db:push` command)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks (auth, orders, drinks, analytics)
│       ├── pages/        # Route components
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Data access layer (repository pattern)
│   └── index.ts      # Server entry point
├── shared/           # Shared code between client and server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route type definitions
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
- **Shared Schema**: Database schema and API types are shared between frontend and backend
- **Repository Pattern**: `storage.ts` abstracts all database operations through an interface
- **Role-Based Access**: Three distinct user roles with different UI views and permissions
- **Real-time Updates**: Polling mechanism for kitchen order queue (5-second intervals)

### Build System
- **Development**: Vite dev server with HMR for frontend, tsx for backend
- **Production**: esbuild bundles server code, Vite builds frontend to `dist/public`
- **Output**: Single `dist/index.cjs` for server, static files in `dist/public`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### Authentication
- **Passport.js**: Authentication middleware
- **express-session**: Session management
- **MemoryStore**: In-memory session storage (development only)

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-built component library using Radix primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Recharts**: Charting library for analytics

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (optional, defaults to "secret")