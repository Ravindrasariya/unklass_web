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
  - `students`: Board exam student registration (name, grade, board, location, mobile_number)
  - `pdfs`: Uploaded PDF metadata, extracted content, and parsed questions (parsedQuestions JSONB, totalQuestions integer)
  - `quiz_sessions`: Board exam quiz attempts, generated questions, answers, and scores
  - `cpct_students`: CPCT student registration (name, medium, location, mobile_number)
  - `cpct_quiz_sessions`: CPCT quiz attempts
  - `navodaya_students`: Navodaya student registration (name, exam_grade, medium, location, mobile_number)
  - `navodaya_quiz_sessions`: Navodaya quiz attempts
  - `question_pointers`: Tracks sequential question progress (studentId, studentType, pdfId, lastQuestionIndex)

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

### Sequential Question Picking (SERVER-SIDE IMPLEMENTATION)
- **Questions served in order**: Each quiz picks questions sequentially from the PDF, continuing from where the previous quiz ended
- **Server-side slicing**: Questions are pre-parsed on PDF upload and stored in `parsedQuestions` JSONB column
- **Question Pointer Tracking**: `questionPointers` table tracks (studentId, studentType, pdfId, lastQuestionIndex) for each student
- **Zero-based indexing**: All indices are zero-based throughout the system
- **Automatic cycling**: When reaching the end of available questions, wraps back to the beginning
- **Implementation Flow**:
  1. On PDF upload: `parseQuestionsFromPdfContent()` extracts numbered questions using regex patterns
  2. Parsed questions stored in `pdfs.parsedQuestions` JSONB column
  3. On quiz generation: `getSequentialQuestions()` picks next 10 questions starting from stored pointer
  4. Only the selected subset is sent to LLM for MCQ conversion (faster, more accurate)
  5. Pointer updated: `newLastIndex = (startIndex + count - 1) % totalQuestions`
- **Fallback**: If no parsed questions exist, falls back to full PDF content with previous question deduplication
- **Key Files**: `server/questionParser.ts`, `server/routes.ts`, `server/storage.ts`
- **Benefits**: Deterministic, faster LLM calls, ensures complete question coverage, handles edge cases with cycling

### CPCT Exam Prep
- **Separate student table**: `cpctStudents` with fields (name, medium, location, mobileNumber)
- **Medium selection**: Hindi or English - questions, answers, and explanations are rendered in the selected medium
- **Section-based quiz**: Students select from 5 sections after login:
  1. MS Office
  2. Software Operating System & IT Fundamentals
  3. Internet, Networking & Security
  4. Hardware Peripheral & Devices
  5. Aptitude & Logical Reasoning
- **PDF format**: CPCT_{SectionName}.pdf (e.g., CPCT_MS_OFFICE.pdf, CPCT_Internet_Networking_Security.pdf)
- **Fuzzy PDF matching**: Backend matches section names to PDF filenames using fuzzy matching
- **Quiz history**: Students can view their CPCT quiz history and review past questions

### Navodaya Exam Prep (JNV Entrance)
- **Separate student table**: `navodayaStudents` with fields (name, examGrade, medium, location, mobileNumber)
- **Exam grade selection**: 6th or 9th - determines which grade-level questions are generated
- **Medium selection**: Hindi or English - questions, answers, and explanations are rendered in the selected medium
- **Section-based quiz**: Students select sections after login based on their grade:
  - **6th Grade Sections**: Mental Ability Test, Arithmetic Test, Language Test
  - **9th Grade Sections**: Mathematics, Science, English, Hindi
- **PDF format**: {grade}_navodaya_{section}.pdf (e.g., 6th_navodaya_mental_ability_test.pdf, 9th_navodaya_mathematics.pdf)
- **Fuzzy PDF matching**: Backend matches section names to PDF filenames using fuzzy matching
- **Quiz history**: Students can view their Navodaya quiz history and review past questions
- **Fallback questions**: Section-specific fallback questions when no PDF available

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
