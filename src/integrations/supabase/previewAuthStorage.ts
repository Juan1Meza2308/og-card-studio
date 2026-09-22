// Standard localStorage-based auth storage for Supabase client
export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;

  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}
