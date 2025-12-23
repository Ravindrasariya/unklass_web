# EdTech Quiz Application - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design) with EdTech References
- **Justification:** Utility-focused educational tool requiring clarity, accessibility, and student engagement
- **References:** Khan Academy's approachable interface, Duolingo's gamified feedback patterns, Quizlet's clean quiz layouts
- **Principles:** Clear information hierarchy, encouraging feedback patterns, distraction-free learning environment

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - Clean, highly legible for questions and content
- Secondary: Poppins (via Google Fonts) - Friendly, welcoming for headings and CTAs

**Type Scale:**
- Hero/Welcome Headers: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-semibold
- Question Text: text-xl md:text-2xl font-medium (questions must be prominent)
- Body/Options: text-base md:text-lg
- Helper Text: text-sm
- Feedback Messages: text-lg font-medium

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, py-8)
- Form fields: gap-4 between inputs
- Quiz questions: py-6 between question and options
- Section padding: py-8 md:py-12
- Component margins: mb-6 for major separations

**Container Strategy:**
- Max-width: max-w-3xl for quiz interface (optimal reading width)
- Max-width: max-w-md for onboarding form (focused input)
- Full-width: Results screen with max-w-2xl inner container

## Component Library

### 1. Student Onboarding Form
**Layout:** Centered single-column form on plain background
- Card container with rounded-2xl, shadow-lg
- Heading with welcoming message above form
- Form fields stack vertically with consistent gap-4
- Text inputs: Full-width, h-12, rounded-lg, border focus states
- Dropdowns: Native select styling enhanced with custom arrow, h-12
- Submit button: Full-width, h-12, rounded-lg, prominent with icon (arrow-right from Heroicons)

### 2. PDF Upload Interface
**Layout:** Two-state component (empty state / uploaded state)
- **Empty State:** Dashed border dropzone, rounded-xl, p-8
  - Upload icon (document-arrow-up from Heroicons) centered, large size (w-16 h-16)
  - Text: "Drag and drop your PDF or click to browse"
  - File size limit helper text below
- **Uploaded State:** Solid card showing filename with success checkmark icon
  - Remove/Replace button (small, secondary style)
  - "Generate Quiz" primary button below

### 3. Quiz Interface
**Layout:** Single question per screen, centered focus
- Progress indicator at top: "Question X of 10" with progress bar
- Question card: rounded-xl, shadow-md, p-6 md:p-8
- Question text: Prominent, mb-6
- Options grid: grid gap-3, 2x2 layout on mobile, 1-column stack on desktop for better readability
- Each option: Button-style card, h-auto, p-4, rounded-lg, text-left, border-2
- Submit answer button: Fixed at bottom or below options, full-width on mobile

### 4. Feedback Modal/Panel
**Layout:** Appears immediately after answer submission
- Overlay backdrop with blur effect
- Modal card: max-w-lg, rounded-2xl, p-6
- Status icon: Large checkmark (correct) or X mark (incorrect) from Heroicons
- Status text: "Correct!" or "Incorrect" with appropriate styling
- Explanation section: Background panel, rounded-lg, p-4, mt-4
  - Label: "Explanation:"
  - AI-generated explanation text
  - Correct answer highlighted
- "Next Question" button at bottom

### 5. Results Screen
**Layout:** Celebration/encouragement screen, centered
- Large score display: Circle or prominent card showing "X/10"
- Performance message: Based on score (Excellent/Good/Keep Learning)
- Animated icon or illustration placeholder (<!-- CELEBRATION ICON -->)
- Score breakdown: Optional list showing question-by-question results
- Action buttons stacked vertically, gap-4:
  - "Try Another Test" (primary, full-width on mobile)
  - "Upload New Document" (secondary)

### 6. Navigation Header
**Layout:** Minimal, non-distracting during quiz
- Logo/App name on left
- Student name on right (small, text-sm)
- Progress indicator integrated (during quiz mode only)
- Height: h-16, sticky positioning during quiz

## Icons
**Library:** Heroicons (via CDN)
**Key Icons:**
- document-arrow-up: PDF upload
- check-circle: Correct answers
- x-circle: Incorrect answers
- arrow-right: Navigation, CTAs
- academic-cap: Education theme
- chart-bar: Results

## Responsive Behavior
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Quiz interface: Single column always (avoids split attention)
- Form: Maintains max-w-md across all viewports
- Options: Stack vertically on mobile, consider 2-column on tablet+ only if improves scannability

## Accessibility
- High contrast text (WCAG AA minimum)
- Focus states on all interactive elements with visible outlines
- Keyboard navigation support for quiz options (arrow keys)
- Screen reader labels for progress, feedback states
- Touch targets minimum 44px height on mobile

## Animation Guidelines
**Use Sparingly:**
- Progress bar fills smoothly (transition-all duration-500)
- Feedback modal fades in (animate-in)
- Correct/incorrect answer state transitions (200ms)
- NO distracting animations during quiz taking
- Celebration animation on results screen only

## Interaction States
**Quiz Options:**
- Default: Neutral border
- Hover: Subtle shadow elevation
- Selected: Bold border, slight background change
- Correct (after submission): Success treatment
- Incorrect (after submission): Error treatment with correct answer highlighted

**Buttons:**
- Primary: Prominent, rounded-lg, h-12, font-medium
- Secondary: Outlined style, same sizing
- Disabled: Reduced opacity during loading states

This design prioritizes clarity, reduces cognitive load during quiz-taking, and provides encouraging feedback to maintain student engagement.