import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Disabled auth persistence for now.
        },
      },
    },
  );
};

// Service role client — bypasses RLS. Use only in trusted server-side code.
export const createServiceClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};

export async function insertAttractionSuggestion(
  name: string,
  description: string,
  stationId: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("attractions")
    .insert([
      {
        name,
        description,
        station_id: stationId,
        is_verified: false,
      },
    ])
    .select();

  if (error) {
    throw new Error(`Failed to insert suggestion: ${error.message}`);
  }

  return data;
}