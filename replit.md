# QuizGenius - AI-Powered EdTech Quiz Application

## Overview

QuizGenius is an AI-powered educational quiz platform that generates intelligent multiple-choice questions from PDF study materials. The application targets students preparing for 8th, 10th, and 12th grade exams following Indian education boards (MP Board, CBSE). Students register with their details, select subjects, and take AI-generated quizzes with instant feedback and explanations.

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
- **AI Integration**: OpenAI GPT-4o for quiz question generation with fallback questions

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)
- **Migrations**: Drizzle Kit with `migrations/` output directory
- **Tables**:
  - `students`: User registration data (name, grade, board, location, mobile_number)
  - `pdfs`: Uploaded PDF metadata and extracted content (admin functionality)
  - `quiz_sessions`: Quiz attempts, generated questions, answers, and scores

### API Endpoints
- `POST /api/students/register` - Register new student
- `GET /api/students/:id` - Get student by ID
- `POST /api/admin/upload-pdf` - Upload PDF (admin only, follows {grade}_{board}_{subject}.pdf naming)
- `GET /api/admin/pdfs` - List all uploaded PDFs
- `POST /api/quiz/generate` - Generate quiz questions for student
- `POST /api/quiz/submit` - Submit quiz results
- `GET /api/students/:studentId/quiz-history` - Get student's quiz history

### Application Flow
1. Student registers with personal details (name, grade, board, location, mobile)
2. Student selects subject from available options (Math, Science, SST, Hindi, English, Physics, Chemistry, Biology)
3. AI generates 10 MCQ questions (uses fallback questions if OpenAI quota exceeded)
4. Student answers questions with immediate feedback and explanations
5. Results displayed with performance messages:
   - Score > 8: "Excellent!"
   - Score > 6: "Good Job!"
   - Otherwise: "Keep Learning!"

### Question Rotation Rules (IMPORTANT)
- **All questions must be covered at least once before repeating**: The system tracks all previously asked questions per student. New questions are generated until all topics/concepts from the PDF are covered.
- **Questions CAN repeat, but only after all topics are covered**: Once all possible topics from the study material have been tested at least once, questions may repeat with rephrased wording.
- **Equal distribution**: Each question/topic should come an equal number of times across all quiz attempts.
- **Implementation**: The backend stores all previous questions in quiz_sessions and passes them to the OpenAI prompt. The AI is instructed to first cover new topics, then allow repetition with varied question formats once all topics are exhausted.

### CPCT Exam Prep
- **Separate student table**: `cpctStudents` with fields (name, medium, location, mobileNumber)
- **Medium selection**: Hindi or English - questions, answers, and explanations are rendered in the selected medium
- **PDF format**: CPCT_Year.pdf (e.g., CPCT_2024.pdf)
- **Direct quiz start**: After login/registration, quiz starts immediately without year selection
- **Quiz history**: Students can view their CPCT quiz history and review past questions

### Design System
- **Typography**: Inter (primary), Poppins (headings) via Google Fonts
- **Layout**: Max-width containers (3xl for quiz, md for forms)
- **Spacing**: Tailwind units 2, 4, 6, 8 for consistent rhythm
- **Components**: Card-based UI with rounded corners, shadows, and focus states

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for generating quiz questions
  - Requires `OPENAI_API_KEY` environment variable
  - Falls back to pre-defined questions when quota exceeded
  - Uses JSON response format for structured question output

### Database
- **PostgreSQL**: Primary data store
  - Requires `DATABASE_URL` environment variable
  - Connection pooling via `pg` package

### Third-Party Libraries
- **Radix UI**: Accessible component primitives (dialogs, selects, toasts, etc.)
- **Lucide React**: Icon library
- **Multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **Zod**: Runtime schema validation (shared between client/server via drizzle-zod)
- **class-variance-authority**: Component variant management

## Security Notes
- Admin PDF upload endpoint is currently unauthenticated - should be secured before production
- OpenAI API key stored in Replit Secrets (encrypted)
- Database credentials managed via environment variables
