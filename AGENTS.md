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
- Expected blank line before this statement.
- Remove unused imports, variables, and code introduced by your changes.
- Edit files directly using file-editing tools. Do not use terminal `echo` or `cat` to modify files unless explicitly requested.

## Regression Prevention and Existing Behavior

- Preserve Existing Behavior: Treat all currently working and verified behavior as a requirement. Do not change or remove it unless the task explicitly requires that change.
- Minimal Changes: Make the smallest focused changes necessary to complete the task. Do not rewrite, refactor, or restructure unrelated code.
- Protect Existing Fixes: Before modifying existing logic, inspect how it currently works and identify the behavior that must remain unchanged.
- Regression Testing: When fixing a bug, add or update a regression test whenever practical. Verify that the test fails before the fix and passes after it.
- Verification Required: Run the relevant tests and checks after making changes. Never claim that a fix works unless it has been verified.
- Final Diff Review: Before finishing, inspect all changed files and the complete diff. Revert unintended changes and investigate any modification unrelated to the task.
- Report Regressions: If an existing behavior breaks during implementation, fix it before finishing. If verification is blocked, clearly report what could not be verified.
- No Unrequested Changes: Do not modify database schemas, business rules, APIs, or component architecture unless required by the task.



## Frontend, UI & Themes

- Follow existing React, TypeScript, shadcn/ui, and Radix UI patterns.
- Use Tailwind CSS v4 and `clsx` / `tailwind-merge` for conditional class names.
- Prefer standard Tailwind utility classes over arbitrary values when suitable equivalents exist.
- Use Lucide React for icons.
- Prefer existing shadcn/ui semantic color tokens, such as `bg-background`, `text-foreground`, `bg-card`, and `border-border`.
- Preserve consistent styling and readable contrast in both light and dark themes. Use appropriate `dark:` variants when fixed colors are necessary.
- Reuse existing components and theme conventions instead of introducing inconsistent styling.

## Component Design & Code Organization

- Keep components simple, readable, and well-organized without unnecessary abstraction.
- Do not create a new component, file, hook, or abstraction for every dialog, section, or small UI element.
- Prefer keeping dialog-specific logic and UI in the existing component when it remains reasonably sized and easy to maintain.
- Extract a component only when it provides meaningful reuse, separates a distinct responsibility, or significantly improves readability and maintainability.
- Reuse existing components and patterns before introducing new ones.
- Avoid both oversized components with unrelated responsibilities and excessive fragmentation into many small files.
- Keep related logic together and organize code according to clear responsibilities.
- Before introducing new files or restructuring components, inspect the existing implementation and choose the smallest maintainable solution.
- Preserve existing component boundaries and architecture unless a change provides a clear, practical benefit.

## Custom Hooks and Logic Separation

- **Extract Complex Component Logic:** Move complex React state management, event handlers, effects, and UI-related workflows into custom hooks when doing so improves readability and maintainability.
- **Keep Components Focused on Presentation:** Components should primarily compose UI elements, pass data, and connect user interactions to the appropriate handlers.
- **Keep Business Logic in the Right Place:** Move reusable business rules, calculations, and data transformations into dedicated utility functions or domain modules when appropriate. Do not put all logic into custom hooks by default.
- **Avoid Unnecessary Hooks:** Do not create custom hooks for trivial logic, simple state, or code that is clearer and easier to maintain inside the component.
- **Keep Hooks Cohesive:** Each custom hook must have a clear responsibility. Avoid creating oversized hooks that simply move the original component's complexity into another file.
- **Preserve Behavior:** Extract logic without changing existing functionality, validation, API interactions, state transitions, or UI behavior unless explicitly requested.


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