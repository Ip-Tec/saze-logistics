// apps/web/app/api/rider-profile/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Recommended helper function to create a server-side Supabase client
// This uses the pattern from the Supabase documentation, with correct async cookie handling
async function createClient() {
  // Await the cookies() function as it returns a Promise in this context
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use the Service Role Key for this API route for privileged update operation
    // Be extremely cautious with the Service Role Key and ensure this API route is secure
    // Alternatively, if your RLS is set up correctly for profiles table,
    // you might be able to use process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Provide async getAll method as cookieStore is awaited
        async getAll() {
          return cookieStore.getAll();
        },
        // Provide async setAll method
        async setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
               cookieStore.set(name, value, options); // cookieStore.set is synchronous
            }
          } catch (error) {
            console.error("Error setting cookies in API route:", error);
            // In a Route Handler, setting cookies directly is generally expected to work.
          }
        },
      },
    }
  );
}


// This route handles POST requests to update the rider's profile information
export async function POST(request: Request) {
  try {
    // Parse the request body to get the updated profile data
    // For now, we assume the client sends a JSON body with text fields.
    // Handling file uploads (images) requires a different approach (FormData).
    const updatedProfileData = await request.json();

    // Basic validation: Ensure we have data to update
    if (Object.keys(updatedProfileData).length === 0) {
        return NextResponse.json({ error: 'No update data provided.' }, { status: 400 });
    }

    // Create the Supabase client using our helper function
    const supabase = await createClient();

    // Get the currently authenticated user's session and user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("API: Error getting user or user email:", userError);
      // Use 401 status code for unauthenticated access
      return NextResponse.json({ error: userError?.message || 'Authentication required.' }, { status: 401 });
    }

    const userId = user.id; // Get the authenticated user's ID

    // Update the user's profile in the 'profiles' table
    // Ensure your 'profiles' table has columns matching the keys in updatedProfileData
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedProfileData) // Pass the received data directly
      .eq('id', userId) // Update the row where the 'id' matches the authenticated user's ID
      .select(); // Select the updated row to return it


    if (error) {
      console.error("API: Error updating rider profile:", error);
      // Return a 500 status code for server-side update failure
      return NextResponse.json({ error: error.message || 'Failed to update rider profile.' }, { status: 500 });
    }

    // Profile updated successfully
    return NextResponse.json({ message: 'Rider profile updated successfully!', profile: data?.[0] }, { status: 200 });

  } catch (error: any) {
    console.error("API: Unexpected error in rider-profile route:", error);
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}

// You can also add a GET handler to fetch the rider's profile data

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: userError?.message || 'Authentication required.' }, { status: 401 });
        }

        const userId = user.id;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*') // Select all columns or specific ones
            .eq('id', userId)
            .single(); // Expecting a single row

        if (error) {
            console.error("API: Error fetching rider profile:", error);
            return NextResponse.json({ error: error.message || 'Failed to fetch rider profile.' }, { status: 500 });
        }

        if (!profile) {
             return NextResponse.json({ error: 'Rider profile not found.' }, { status: 404 });
        }

        return NextResponse.json({ profile }, { status: 200 });

    } catch (error: any) {
        console.error("API: Unexpected error in rider-profile GET route:", error);
        return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
    }
}

