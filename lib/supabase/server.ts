import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot set cookies. Middleware/route handlers can.
          }
        },
      },
    },
  );
}
