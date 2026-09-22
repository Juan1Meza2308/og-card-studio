# OG Card Studio

Build a modern, developer-focused SaaS platform named "OGCraft" for generating dynamic Open Graph (OG) preview images via API. 

### Design System & Theme

- Sleek, dark-mode default aesthetic inspired by Vercel, Supabase, and Resend.

- Palette: Deep zinc backgrounds (#09090b), crisp white text, subtle glowing borders, and vibrant accents (violet/indigo gradients).

- UI Components: Use Shadcn UI, Lucide icons, and Tailwind CSS. Responsive and high-contrast typography.

### 1. Landing Page (Public)

- **Navigation Bar:** Logo ("OGCraft"), Links (Features, Playground, Pricing, Docs), and CTA buttons ("Log in", "Get API Key Free").

- **Hero Section:**

  - Catchy Headline: "Dynamic OG Images via a Single API URL".

  - Subtitle: "Generate beautiful, customizable social share cards on the fly for your blog, e-commerce, or app in milliseconds."

  - Primary CTA: "Start Free (100 imgs/mo)" and "Explore Docs".

- **Live Interactive Playground (Hero Centerpiece):**

  - Left panel (Inputs): Text input for Title, Text input for Subtitle/Category, Color Picker for background gradient, Logo URL input, and Template Selector dropdown (Tech, Minimalist, Dark Gradient, Clean White).

  - Right panel (Live Preview): A 1200x630 aspect ratio card that dynamically updates instantly as inputs change.

  - Output bar below preview: Displays the generated API URL (e.g., `https://api.ogcraft.dev/v1/og?title=Hello+World&theme=violet`) with a "Copy URL" button and a "Download PNG" button.

- **Code Integration Tabs:** Show code snippets for HTML `<meta>` tags, Next.js Metadata API, and cURL commands.

- **Pricing Section:**

  - 3 Cards: Free ($0/mo - 100 images, watermark), Pro ($12/mo - 5,000 images, custom templates, no watermark - tagged "Popular"), Agency ($39/mo - 50,000 images, team access, ultra-low latency).

- **Footer:** Links to Github, Docs, Privacy, and Status page.

### 2. User Dashboard (Authenticated View)

- Sidebar Navigation: Overview, API Keys, Template Builder, Analytics, Billing.

- **Overview View:**

  - Usage Meter: Progress bar showing "42 / 100 free requests used this month".

  - Quick-start guide with code snippet.

- **API Keys View:**

  - Table showing Key Name, Key Prefix (`og_live_••••1234`), Created Date, Last Used, and Actions (Copy, Revoke).

  - "Generate New API Key" button with a modal.

- **Template Builder View:**

  - Visual grid of pre-built templates. Allow selecting and tweaking default styles.

### 3. Mock Data & Backend Setup

- Include Supabase Authentication UI flow (Sign in with GitHub/Email).

- Create a mock database state for user profiles, API usage stats, and API keys so the dashboard works out of the box.





Para el playground utiliza la primera imagen de referencia, dashboard la segunda, y tercero para el estilo visual/lainding

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/648918f2-b690-4b25-8008-415b287fb0b1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
