// apps/web/app/api/change-password/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Recommended helper function to create a server-side Supabase client
// This uses the pattern from the Supabase documentation, with correct async cookie handling
async function createClient() {
  // Await the cookies() function as it returns a Promise in this context
  const cookieStore = await cookies();
  console.log("TESX:::>",{ cookieStore });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use the Service Role Key for this API route for privileged update operation
    // Be extremely cautious with the Service Role Key and ensure this API route is secure
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Provide async getAll method as cookieStore is awaited
        async getAll() {
          return cookieStore.getAll();
        },
        // Provide async setAll method
        async setAll(cookiesToSet) {
          // setAll needs to be async because cookieStore.set might be used within async forEach
          try {
            // Use a for...of loop to correctly await each set operation if needed,
            // although cookieStore.set is typically synchronous.
            // Keeping async setAll for consistency with async getAll if required by createServerClient signature.
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options); // cookieStore.set is synchronous
            }
            // If you prefer forEach, ensure it handles async correctly if the set method were async:
            // await Promise.all(cookiesToSet.map(async ({ name, value, options }) =>
            //   cookieStore.set(name, value, options) // Still synchronous here
            // ));
          } catch (error) {
            console.error("Error setting cookies in API route:", error);
            // This try/catch is less critical in a Route Handler but kept for pattern consistency.
            // In a Route Handler, setting cookies directly is generally expected to work.
          }
        },
      },
    }
  );
}

// This route handles the password change request with server-side re-authentication
export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Basic server-side validation
    if (!currentPassword || !newPassword) {
      console.log("Validation failed: Missing password(s)");
      return NextResponse.json(
        { error: "Current and new passwords are required." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      console.log("Validation failed: Passwords are the same");
      return NextResponse.json(
        { error: "New password must be different from the current one." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      console.log("Validation failed: New password too short");
      // Example: Minimum length check
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    // Add other server-side password strength/complexity checks here

    console.log(
      "Server-side validation passed. Proceeding with Supabase calls."
    );

    // Create the Supabase client using our helper function
    const supabase = await createClient();

    // 1. Get the current user's email (needed for re-authentication)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      console.error("API: Error getting user or user email:", userError);
      // Use 401 status code for unauthenticated access
      return NextResponse.json(
        { error: userError?.message || "Authentication required." },
        { status: 401 }
      );
    }

    const userEmail = user.email;

    // 2. Re-authenticate the user with their current password
    // This verifies the user knows their current password before allowing a change
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail, // Get user's email from the authenticated session
      password: currentPassword,
    });

    if (signInError) {
      console.error("API: Re-authentication failed:", signInError);
      // Be careful with the error message here for security
      // Avoid exposing details about why sign-in failed beyond "Invalid credentials"
      return NextResponse.json(
        { error: "Invalid current password." },
        { status: 401 }
      );
    }

    // If signInWithPassword succeeds, the current password is correct.
    // Now, update the password.

    // 3. Update the user's password with the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("API: Password update failed:", updateError);
      // Map specific update errors to user-friendly messages
      let errorMessage = "Failed to update password.";
      if (updateError.message.includes("Weak password")) {
        // Example based on Supabase errors
        errorMessage = "Password is too weak. Please choose a stronger one.";
      } else {
        errorMessage = `Failed to update password: ${updateError.message}`; // Be cautious exposing raw messages
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 }); // Use 500 for server-side update failure
    }

    // Password updated successfully
    return NextResponse.json(
      { message: "Password changed successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API: Unexpected error in change-password route:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}

// Note: You might also want to implement other HTTP methods (GET, PUT, DELETE)
// or restrict this route to only POST requests if needed.
