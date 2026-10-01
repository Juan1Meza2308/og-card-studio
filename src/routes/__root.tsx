import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { pageTransition } from "@/lib/motion";
import { supabase } from "@/integrations/supabase/client";

function useSupabase() {
  return supabase;
}

import appCss from "../styles.css?url";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

// Inline script to prevent theme flash - runs before React hydrates
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('ogcraft-theme');
    var root = document.documentElement;
    if (theme === 'light' || (!theme && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  } catch (e) {}
})();
`;

// Inline script to handle OAuth redirect BEFORE React hydrates
const oauthRedirectScript = `
(function() {
  try {
    var hash = window.location.hash;
    if (hash.startsWith('#access_token=') || hash.startsWith('#type=recovery')) {
      var params = new URLSearchParams(hash.slice(1));
      var accessToken = params.get('access_token');
      var refreshToken = params.get('refresh_token');
      var expiresIn = params.get('expires_in');
      var type = params.get('type');

      if (accessToken && refreshToken) {
        // Store session for Supabase client to pick up
        var sessionData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
          token_type: 'bearer'
        };
        sessionStorage.setItem('sb-oauth-session', JSON.stringify(sessionData));
        
        // Clean URL and redirect to dashboard
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace('/dashboard');
        return; // Stop execution, redirecting
      } else if (type === 'recovery') {
        // Password recovery - keep hash for reset-password page
        sessionStorage.setItem('sb-recovery-hash', hash);
        window.history.replaceState({}, document.title, window.location.pathname + hash);
      }
    }
  } catch (e) {
    console.error('OAuth redirect error:', e);
  }
})();
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    router.invalidate();
    reset();
  }, [error, reset, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Only genuinely global metadata lives here. Title, description, canonical and
  // og:url are set per route via buildSeo — a root-level canonical silently marks
  // every subpage as a duplicate of the home page.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Juan1Meza2308" },
      { name: "robots", content: "index, follow" },
      { "script:ld+json": organizationJsonLd },
      { "script:ld+json": webSiteJsonLd },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg?v=2", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico?v=2", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
    ],
    scripts: [
      {
        type: "inline",
        children: themeScript,
        strategy: "beforeInteractive",
      },
      {
        type: "inline",
        children: oauthRedirectScript,
        strategy: "beforeInteractive",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const supabase = useSupabase();

  useEffect(() => {
    const stored = sessionStorage.getItem("sb-oauth-session");
    if (stored) {
      sessionStorage.removeItem("sb-oauth-session");
      try {
        const session = JSON.parse(stored);
        supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
        });
      } catch (e) {
        console.error("Failed to hydrate OAuth session", e);
      }
    }
  }, [supabase]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex min-h-screen flex-col"
            >
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
