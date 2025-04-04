"use client";

import React from "react";

export default function Home() {
  // This is just a loading state - middleware will handle redirects
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium">Loading HyphenBox...</h2>
      </div>
    </div>
  );
}