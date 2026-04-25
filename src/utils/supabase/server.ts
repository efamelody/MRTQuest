import { createServerClient } from "@supabase/ssr";

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