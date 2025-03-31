"use client";

import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login instead of dashboard
  // redirect('/auth/login');
  redirect('/dashboard');
}