# QuizGenius - AI-Powered EdTech Quiz Application

## Overview

QuizGenius is an AI-powered educational quiz platform that generates intelligent multiple-choice questions from PDF study materials. The application targets students preparing for 8th, 10th, and 12th grade exams following Indian education boards (MP Board, CBSE). Users register with their details, upload study material PDFs, and receive AI-generated quizzes with explanations and feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui (New York style) built on Radix UI primitives
- **State Management**: React Query (@tanstack/react-query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **File Uploads**: Multer for PDF handling (10MB limit, memory storage)
- **PDF Processing**: pdf-parse for text extraction
- **AI Integration**: OpenAI GPT-4o for quiz question generation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)
- **Migrations**: Drizzle Kit with `migrations/` output directory
- **Tables**:
  - `students`: User registration data (name, grade, board, location, mobile)
  - `pdfs`: Uploaded PDF metadata and extracted content
  - `quiz_sessions`: Quiz attempts, generated questions, answers, and scores

### Application Flow
1. Student registers with personal details and education info
2. Student selects subject and optionally uploads PDF study material
3. OpenAI generates 10 MCQ questions based on content and curriculum
4. Student answers questions with immediate feedback and explanations
5. Results displayed with performance analysis and retry options

### Design System
- **Typography**: Inter (primary), Poppins (headings) via Google Fonts
- **Layout**: Max-width containers (3xl for quiz, md for forms)
- **Spacing**: Tailwind units 2, 4, 6, 8 for consistent rhythm
- **Components**: Card-based UI with rounded corners, shadows, and focus states

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for generating quiz questions and answer feedback
  - Requires `OPENAI_API_KEY` environment variable
  - Uses JSON response format for structured question output

### Database
- **PostgreSQL**: Primary data store
  - Requires `DATABASE_URL` environment variable
  - Connection pooling via `pg` package

### Third-Party Libraries
- **Radix UI**: Accessible component primitives (dialogs, selects, toasts, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **Zod**: Runtime schema validation (shared between client/server via drizzle-zod)
- **class-variance-authority**: Component variant management
- **embla-carousel**: Carousel functionality
- **react-day-picker**: Calendar component
- **vaul**: Drawer component
- **recharts**: Chart components