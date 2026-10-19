# Project Rules

## Project Stack

- **Backend:** PHP 8.3, Laravel 13, Eloquent, Fortify.
- **Frontend:** React 19, TypeScript, Inertia.js, Wayfinder, Tailwind CSS v4, Vite.
- **UI:** shadcn/ui, Radix UI, Lucide React, CVA.
- **Utilities:** `clsx`, `tailwind-merge`, `@dnd-kit`, `date-fns`, `xlsx`, `jspdf`, `html2pdf.js`.
- **Testing:** Pest.

## Core Development Rules

- Follow the existing architecture, project conventions, and installed package versions.
- Inspect relevant code and configuration before making changes.
- Prefer simple, modular, reusable solutions. Make the smallest change that correctly solves the task.
- Use strict TypeScript types; avoid `any`.
- Always use curly braces for conditional and loop blocks, including single-line statements.
- Leave an empty line before `if` and `return` statements, following project conventions.
- Remove unused imports, variables, and code introduced by your changes.
- Edit files directly using file-editing tools. Do not use terminal `echo` or `cat` to modify files unless explicitly requested.

## Frontend, UI & Themes

- Follow existing React, TypeScript, shadcn/ui, and Radix UI patterns.
- Use Tailwind CSS v4 and `clsx` / `tailwind-merge` for conditional class names.
- Prefer standard Tailwind utility classes over arbitrary values when suitable equivalents exist.
- Use Lucide React for icons.
- Prefer existing shadcn/ui semantic color tokens, such as `bg-background`, `text-foreground`, `bg-card`, and `border-border`.
- Preserve consistent styling and readable contrast in both light and dark themes. Use appropriate `dark:` variants when fixed colors are necessary.
- Reuse existing components and theme conventions instead of introducing inconsistent styling.

## Laravel, Inertia, Wayfinder & Forms

- Follow Laravel 13 conventions and the installed versions of Inertia.js and Wayfinder.
- Use Wayfinder-generated route helpers for navigation and form actions wherever supported. Avoid duplicating route URLs or HTTP methods unnecessarily.
- Before creating or modifying forms, inspect the installed Inertia version, official documentation, and existing project patterns.
- Prefer modern, version-compatible Inertia form APIs over legacy patterns when appropriate. Do not assume one form API fits every situation.
- Keep frontend submissions, backend validation, error handling, and Inertia responses consistent.
- Use Laravel Form Requests for validation where appropriate.
- Follow existing Eloquent relationship and controller conventions.
- Add or update relevant Pest tests when appropriate.

## Documentation & Language

### User-Facing Content — French

- Write all interface text in French, including labels, buttons, placeholders, validation messages, notifications, and user-visible errors.

### Developer-Facing Content — English

- Write code, identifiers, filenames, comments, documentation, PHPDoc, JSDoc, TSDoc, logs, and test descriptions in English.
- Do not write developer documentation or code comments in French or Arabic unless explicitly requested.
- Apply these language rules regardless of the conversation language.

## Code Quality & Verification

- Follow the project's ESLint, Prettier, and Laravel Pint configurations.
- Use the existing commands when appropriate:

  ```bash
  npm run lint:check
  ```

  ```bash
  npm run format:check
  ```

  ```bash
  composer lint:check
  ```

- Run relevant tests and checks after changes when possible.
- Fix issues introduced by your changes.
- Report verification results accurately; never claim a check passed unless it ran successfully.
- Keep final responses concise, stating what changed and any relevant checks or remaining issues.