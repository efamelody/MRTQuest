import { createClient } from "@/src/utils/supabase/client";

export default async function Home() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stations")
    .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);

  return (
    <div>
      <h1>Supabase Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}