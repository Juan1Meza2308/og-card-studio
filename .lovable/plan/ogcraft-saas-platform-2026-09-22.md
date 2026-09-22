# OGCraft SaaS Platform

## Build
- Create a dark, high-contrast public landing page with the supplied references guiding the visual style.
- Make the hero playground fully interactive: editable content, template and gradient controls, instant 1200×630 preview, API URL copying, PNG download, and integration tabs.
- Add feature, pricing, and footer sections with working navigation and clear free-plan calls to action.

## Accounts and data
- Add email/password and managed Google authentication, including registration, sign-in, sign-out, confirmation messaging, forgot-password, and password-reset screens.
- Create secure profile, API key, and usage tables. New accounts receive a profile, starter usage, and a sample masked API key.
- Keep all account data private to its owner through database access rules.

## Dashboard
- Build a protected dark dashboard with collapsible navigation for Overview, API Keys, Template Builder, Analytics, and Billing.
- Provide real usage data, quick-start code, API key generation/revocation, editable template presets, analytics mockups, and plan details.
- Ensure the account controls reflect the active session and sign-out clears private state.

## Validation
- Verify the public playground, authentication pages, and authenticated dashboard across desktop and mobile sizes.
- Check build, runtime, accessibility-critical controls, and route metadata.

## Technical details
- TanStack Start, React 19, Tailwind CSS v4 semantic tokens, shadcn controls, Lucide icons, and Lovable Cloud.
- Persist user data with row-level ownership rules; never expose raw API key secrets after creation.
