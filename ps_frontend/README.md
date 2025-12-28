# PentaPy — Desktop-first social feed (Frontend)

PentaPy is a polished, desktop-first social feed prototype built with React + Vite + Tailwind CSS.

Key features:
- Desktop-first 3-column layout (left nav, center feed, right suggestions)
- Mock data for posts, users and stories
- Composer with local image preview (no backend required)
- Post modal, story bar, left/right sidebars
- Accessible attributes and keyboard shortcut (`c` focuses the composer)
 - Dark / Light theme toggle (top-right) with persisted preference

Getting started

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

Project structure (important files)
- `src/components/` — UI components (Navbar, LeftSidebar, RightSidebar, Composer, PostModal, etc.)
- `src/pages/` — Route pages (Home is the main feed)
- `src/data/mockData.ts` — Mock users, posts and stories
- `src/assets/pentapy-logo.svg` — text-based PentaPy logo
- `tailwind.config.ts` & `src/index.css` — design tokens and Tailwind setup

Notes
- This is a frontend-only prototype. All images are local or mocked; no authentication.
- The app uses Tailwind CSS with a small neutral + accent palette defined as CSS variables in `index.css`.
 - Toggle dark/light mode with the button in the top bar. Preference is stored in `localStorage`.
- For production-ready work, consider swapping mockData for a small local API (e.g., MirageJS) or a backend endpoint.

Enjoy exploring PentaPy! If you want, I can add tests, MirageJS fake API routes, or a simple CI setup next.
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c6162617-0a23-4f04-9f9a-0fb4b82d546a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c6162617-0a23-4f04-9f9a-0fb4b82d546a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c6162617-0a23-4f04-9f9a-0fb4b82d546a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
