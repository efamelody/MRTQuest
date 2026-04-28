import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📋 [signin-with-username] Request received');
    const { username } = await request.json();
    console.log('📋 [signin-with-username] Username:', username);

    if (!username) {
      console.log('❌ [signin-with-username] Username is empty');
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [signin-with-username] Creating Supabase client...');
    const supabase = await createClient();
    
    console.log('🔍 [signin-with-username] Querying ba_user table for username:', username);
    // Query by 'name' field since that's where the username is stored during signup
    const { data: allResults, error: queryError } = await supabase
      .from('ba_user')
      .select('id, email, name')
      .ilike('name', username);

    console.log('🔍 [signin-with-username] Query result - data:', allResults, 'error:', queryError);

    if (queryError) {
      console.error('❌ [signin-with-username] Supabase error:', queryError);
      return NextResponse.json(
        { error: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (!allResults || allResults.length === 0) {
      console.log('❌ [signin-with-username] No users found. Checking if name column has data...');
      // Debug: check if ANY users have names
      const { data: allUsers } = await supabase
        .from('ba_user')
        .select('id, email, name')
        .limit(5);
      console.log('🔍 [signin-with-username] Sample of all users:', allUsers);
      
      return NextResponse.json(
        { error: 'Username not found' },
        { status: 404 }
      );
    }

    const user = allResults[0];
    console.log('✅ [signin-with-username] Found user:', { id: user.id, email: user.email, name: user.name });
    return NextResponse.json({ email: user.email });
  } catch (err) {
    console.error('❌ [signin-with-username] Unexpected error:', err);
    return NextResponse.json(
      { error: `Internal error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
