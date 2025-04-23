"use client";

// Remove the Sentry import
// import * as Sentry from "@sentry/nextjs";

import NextError from "next/error";
// Remove the unused useEffect import
// import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Remove the useEffect that captures the error with Sentry
  // useEffect(() => {
  //   Sentry.captureException(error);
  // }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
            definition requires a `statusCode` prop. However, since the App Router
            does not expose status codes for errors, we simply pass 0 to render a
            generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
