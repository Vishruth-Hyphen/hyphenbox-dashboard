"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Cursor Flows page when users access the Dashboard index
    router.push("/Dashboard/Cursor%20Flows");
  }, [router]);

  // Return a loading state that will show briefly during redirect
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p>Loading Dashboard...</p>
    </div>
  );
}