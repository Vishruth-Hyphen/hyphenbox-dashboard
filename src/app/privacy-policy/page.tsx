"use client";

import React from "react";
import { DefaultPageLayout } from "@/subframe/layouts/DefaultPageLayout";

export default function PrivacyPolicy() {
  return (
    <DefaultPageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-default-font">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              This Privacy Policy explains how VoxiGuide ("we", "our", or "us") collects, uses, and protects your information when you use our browser extension and associated services. We are committed to ensuring that your privacy is protected while providing you with a powerful documentation tool.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect the following types of information:</p>
            
            <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
            <ul className="list-disc ml-6 mb-4">
              <li>Email address (for authentication)</li>
              <li>Name (if provided through authentication provider)</li>
              <li>Profile picture (if provided through authentication provider)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Usage Information</h3>
            <ul className="list-disc ml-6 mb-4">
              <li>Web pages visited during documentation sessions</li>
              <li>Click locations and interactions within documented pages</li>
              <li>Screenshots of documented pages</li>
              <li>Audio recordings (when voice narration is enabled)</li>
              <li>Transcribed text from voice recordings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc ml-6 mb-4">
              <li>To authenticate you and maintain your session</li>
              <li>To create and store your documentation guides</li>
              <li>To process and transcribe voice recordings</li>
              <li>To capture and store screenshots for documentation</li>
              <li>To sync your documentation across devices</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">
              All data is encrypted in transit using secure HTTPS/WSS protocols. We store your data securely using:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Secure cloud storage for screenshots and documentation</li>
              <li>Encrypted authentication tokens</li>
              <li>Temporary local storage for active recording sessions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="mb-4">We use the following third-party services:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Google Authentication for user login</li>
              <li>Deepgram for voice transcription</li>
              <li>Supabase for data storage and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your data for as long as your account is active. You can delete your documentation guides at any time through the dashboard. Authentication tokens are automatically cleared upon expiration or logout.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Download your documentation guides</li>
              <li>Opt-out of voice recording features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Updates to Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the extension accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
              [Your Contact Information]
            </p>
          </section>

          <footer className="mt-8 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </footer>
        </div>
      </div>
    </DefaultPageLayout>
  );
}