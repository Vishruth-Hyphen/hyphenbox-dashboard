"use client";
/*
 * Documentation:
 * Dashboard Sidebar - Adapted from Invite team members & Sidebar with sections
 * Sidebar with sections — https://app.subframe.com/75242fa8baca/library?component=Sidebar+with+sections_f4047c8b-cfb4-4761-b9cf-fbcae8a9b9b5
 * Avatar — https://app.subframe.com/75242fa8baca/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 * Dropdown Menu — https://app.subframe.com/75242fa8baca/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Icon Button — https://app.subframe.com/75242fa8baca/library?component=Icon+Button_af9405b1-8c54-4e01-9786-5aad308224f6
 */

import React, { useState, useEffect, useRef } from "react";
import * as SubframeUtils from "../utils"; // Assuming ../utils is correct relative path
import { SidebarWithSections } from "../components/SidebarWithSections"; // Assuming ../components is correct relative path
import { Avatar } from "../components/Avatar"; // Assuming ../components is correct relative path
import { DropdownMenu } from "../components/DropdownMenu"; // Assuming ../components is correct relative path
import * as SubframeCore from "@subframe/core";
import { IconButton } from "../components/IconButton"; // Assuming ../components is correct relative path
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface DashboardSidebarRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

// Define navigation items structure
const navSections = [
  {
    label: "Guide",
    items: [
      { label: "Cursor Flows", icon: "FeatherMousePointerClick", href: "/dashboard/cursorflows" },
      { label: "Onboarding", icon: "FeatherPlayCircle", href: "/dashboard/onboarding" },
      { label: "Knowledge", icon: "FeatherBookOpen", href: "/dashboard/knowledge" },
      { label: "Audiences", icon: "FeatherUsers", href: "/dashboard/audiences" },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Manage Team", icon: "FeatherUserPlus", href: "/dashboard/team" },
    ],
  },
  {
    label: "Developers",
    items: [
      { label: "Setup", icon: "FeatherCode2", href: "/dashboard/setup" },
      { label: "Cursor Appearance", icon: "FeatherCode2", href: "/dashboard/cursor-appearance" },
    ],
  },
];

const customNavItems = [
  {
    label: "Get Started",
    icon: "FeatherPlay" as SubframeCore.IconName, 
    action: () => {
      if (window.hyphenSDKInstance && window.hyphenSDKInstance.onboarding) {
        window.hyphenSDKInstance.onboarding.show();
      } else {
        console.warn("Hyphen SDK not ready or onboarding module unavailable.");
      }
    },
  },
];


const DashboardSidebarRoot = React.forwardRef<
  HTMLElement,
  DashboardSidebarRootProps
>(function DashboardSidebarRoot(
  { children, className, ...otherProps }: DashboardSidebarRootProps,
  ref
) {
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user?.id;

  // State for user profile: name and avatar_url
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null);
  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("name, avatar_url")
        .eq("id", userId)
        .single();
      if (!error && data) setProfile(data);
    }
    loadProfile();
  }, [userId]);

  // For avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    // Upload to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return;
    }
    // Get public URL
    const { data: publicData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);
    const publicUrl = publicData.publicUrl;
    if (!publicUrl) {
      console.error('Error getting avatar URL: no public URL returned');
      return;
    }
    // Update user_profiles
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }
    // Update local state
    setProfile(prev => ({ ...(prev as any), avatar_url: publicUrl }));
  };

  const userName = profile?.name || session?.user?.email || "User";
  const userAvatarUrl = profile?.avatar_url || undefined;
  const userTitle = session?.user?.is_super_admin ? "Super Admin" : "Member";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full overflow-hidden", // Changed: Added overflow-hidden to prevent parent scroll
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      {/* Sidebar */}
      <SidebarWithSections
        className="hidden md:flex md:w-64 md:flex-col md:flex-none h-full border-r border-neutral-border" // Changed: Added h-full
        header={
          <Link href="/dashboard" className="inline-block">
            <img
              className="h-8 flex-none object-cover"
              alt="Logo"
              src="https://res.cloudinary.com/subframe/image/upload/v1742094859/uploads/5582/z5g0s70inu7ajzonxtfx.png"
            />
          </Link>
        }
        footer={
          <>
            {/* Avatar upload input (hidden) */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {/* Clickable Avatar */}
            <div className="cursor-pointer" onClick={handleAvatarClick}>
              {userAvatarUrl ? (
                <Avatar image={userAvatarUrl} />
              ) : (
                <Avatar>
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </div>
            {/* User Info Div */}
            <div className="flex flex-col items-start overflow-hidden"> {/* Added overflow-hidden */} 
              <span className="text-caption-bold font-caption-bold text-default-font truncate">
                {userName}
              </span>
              <span className="text-caption font-caption text-subtext-color truncate">
                {userTitle}
              </span>
            </div>
            {/* Dropdown Menu (pushes right due to parent gap/flex) */}
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                 <IconButton size="small" icon="FeatherMoreHorizontal" />
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                 <SubframeCore.DropdownMenu.Content
                    side="top"
                    align="end"
                    sideOffset={4}
                    asChild={true}
                 >
                    <DropdownMenu>
                       <DropdownMenu.DropdownItem icon="FeatherLogOut" onSelect={handleLogout}>
                          Log out
                       </DropdownMenu.DropdownItem>
                    </DropdownMenu>
                 </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </>
        }
      >
        {/* Navigation Sections */}
        {navSections.map((section) => (
          <SidebarWithSections.NavSection key={section.label} label={section.label}>
            {section.items.map((item) => (
              <Link href={item.href} key={item.href} passHref legacyBehavior={false}>
                <SidebarWithSections.NavItem
                  icon={item.icon as SubframeCore.IconName}
                  selected={pathname === item.href}
                >
                  {item.label}
                </SidebarWithSections.NavItem>
              </Link>
            ))}
          </SidebarWithSections.NavSection>
        ))}
        {/* Custom "Get Started" Button */}
        <SidebarWithSections.NavSection>
          {customNavItems.map((item) => (
            <SidebarWithSections.NavItem
              key={item.label}
              icon={item.icon}
              onClick={item.action} // Use onClick for the action
              // Treat as a button; you might need to adjust styling or use a different component
              // if SidebarWithSections.NavItem doesn't inherently support button-like behavior well.
              // For now, this assumes onClick is sufficient or the component handles it.
              className="cursor-pointer" // Explicitly make it look clickable
            >
              {item.label}
            </SidebarWithSections.NavItem>
          ))}
        </SidebarWithSections.NavSection>
      </SidebarWithSections>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-default-background h-full"> {/* Changed: Added h-full */}
          {children}
      </main>
    </div>
  );
});


// Ensure the component is exported correctly
export const DashboardSidebar = DashboardSidebarRoot; 