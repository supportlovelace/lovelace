🚀 Overview
Lovelace is a Turborepo monorepo. It hosts multiple React apps (Vite), a shared UI library, and an API. Tailwind CSS v4 is used via the official Vite plugin.

- Package manager: Bun (workspaces) — top-level `packageManager` is `bun@1.x`.
- Task runner: Turborepo.
- Frontend: React + Vite, TypeScript, Tailwind v4.
- UI library: Custom design system in `packages/ui` (Radix UI + Tailwind + CVA).
- Docs: Storybook in `packages/ui`.

🏗 Structure
- `apps/admin`: Admin panel (Vite React). Uses `@repo/ui`.
- `apps/hub`: Hub app (Vite React). Uses `@repo/ui`.
- `apps/playtest`: Playtest app (Vite React). Uses `@repo/ui`.
- `apps/api`: API server (Node/TypeScript).
- `packages/ui`: Shared UI library and design tokens.
- `packages/eslint-config`, `packages/typescript-config`: Shared configs.

Note: There is no Next.js app in this workspace at the moment; previous references to Next.js/app router do not apply here.

🧩 UI Library (`@repo/ui`)
- Exports:
  - `@repo/ui/globals.css`: Tailwind base + CSS variables + tokens.
  - `@repo/ui/lib/utils`: includes `cn()` utility (clsx + tailwind-merge).
  - `@repo/ui/components/*`: UI components (e.g. Button, Tooltip, StatsCard...).
- Tailwind v4: `packages/ui/src/globals.css` contains `@import "tailwindcss";` and the design tokens in `@theme` and `@layer base`.
- Storybook: run from `packages/ui` with `bun run storybook` (or `pnpm -F @repo/ui storybook`).

🎨 UI/UX Standards
- Component pattern: Radix UI + CVA (class-variance-authority).
- `asChild` support: always use `Slot` from `@radix-ui/react-slot`.
- Class merging: always use `cn()` from `@repo/ui/lib/utils`.
- Selectors: include `data-slot` attributes (e.g., `data-slot="button"`).
- Tailwind tokens: prefer design tokens (e.g., `bg-primary`, `text-secondary-foreground`) over arbitrary values; use arbitrary values only when necessary.
- Motion: include `transition-all` and a subtle press feedback `active:scale-[0.98]`.
- Glass variant: include `backdrop-blur` and a subtle border for visibility in light/dark.

✅ TypeScript Standards
- Strict mode everywhere; avoid `any`.
- Prefer platform prop typing, e.g. `React.ComponentProps<"button">` combined with `VariantProps<typeof cva>`.

📦 Using `@repo/ui` in apps
Tailwind v4 must be enabled per app and the shared globals imported. Checklist per app:

1) Install Tailwind v4 plugin for Vite in the app package:
   - `bun add -d @tailwindcss/vite tailwindcss --cwd apps/<app-name>`

2) Register the plugin in `apps/<app-name>/vite.config.ts`:
   - `import tailwindcss from '@tailwindcss/vite'`
   - `plugins: [react(), tailwindcss()]`

3) Import `@repo/ui/globals.css` as early as possible (before local styles):
   - Preferred in `src/main.tsx`: `import "@repo/ui/globals.css"`
   - Alternatively first line of `src/index.css`: `@import "@repo/ui/globals.css";`

Notes:
- Tailwind v4 does not require a `tailwind.config.*` or `postcss.config.*`. If such files are present, they’re ignored by the v4 plugin.
- After install, restart the Vite dev server.

🧪 Storybook
- Location: `packages/ui`.
- Run: `bun run storybook` (dev) or `bun run build-storybook` (build).
- Content rules:
  - Every UI component must have a `.stories.tsx` file.
  - Use English for controls, docs, and story names.
  - Include key variants: Default, Outline, Ghost, Glass, Destructive, etc.
  - Keep stories aligned with CVA variants; update both together.

🛠️ Developing Components
- Place reusable primitives in `packages/ui/src/components/ui/`.
- Co-locate stories: `*.stories.tsx` next to the component.
- Follow the CVA + Radix + `cn()` pattern. Example outline:
  - Define `cva` with `variant` and `size` maps and defaults.
  - Implement component with `asChild` using `Slot`.
  - Merge classes with `cn(buttonVariants({ variant, size, className }))`.
  - Add `data-slot` for targeting.

🔗 Imports and Aliases
- Use the workspace package name: `@repo/ui`.
- Examples:
  - Styles: `import "@repo/ui/globals.css"`
  - Utils: `import { cn } from "@repo/ui/lib/utils"`
  - Components: `import { Button } from "@repo/ui/components/ui/button"`

🚀 Dev and Scripts
- Monorepo:
  - `bun run dev` (turbo) — or run per app with `bun dev` in the app dir.
  - `bun run build`, `bun run lint`, `bun run check-types`.
- Apps (Vite): `bun dev` in `apps/<app-name>`.
- API: see `apps/api` scripts.

❗ Troubleshooting Styles
- Symptom: “black text on white only” or Tailwind classes not applied.
  - Ensure `@tailwindcss/vite` is installed and registered in the app’s `vite.config.ts`.
  - Ensure `@repo/ui/globals.css` is imported first.
  - Restart Vite after changing Tailwind/Vite plugins.

📚 Research & External Docs
- When additional documentation is needed, use `use context7` to fetch and reference external docs or examples (e.g., Tailwind v4, Radix UI patterns) while keeping implementations consistent with this repo’s standards.

🤖 Agent Guidance
- Context awareness: before adding code, decide if it belongs to `packages/ui` (reusable) or app-specific code in `apps/*`.
- Consistency: when adding a new variant to a component, update both its CVA and its Storybook stories.
- Glassmorphism: always pair `backdrop-blur` with a subtle border (e.g., `border-white/30` or token-based border).
- Avoid arbitrary values unless design tokens are missing; propose new tokens if needed.

Ready reference
- `packages/ui/src/lib/utils.ts`: `cn()` utility.
- `packages/ui/src/components/ui/button.tsx`: reference CVA + Radix + `data-slot` pattern.
- `packages/ui/src/globals.css`: Tailwind v4 import + tokens.
