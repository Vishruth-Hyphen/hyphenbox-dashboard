"use client";

import { redirect } from "next/navigation";

export default function Home() {
  // Server-side redirect is more reliable than client-side
  redirect('/dashboard/cursorflows');
}