"use client";
/*
 * Documentation:
 * Invite team members — https://app.subframe.com/75242fa8baca/library?component=Invite+team+members_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar with sections — https://app.subframe.com/75242fa8baca/library?component=Sidebar+with+sections_f4047c8b-cfb4-4761-b9cf-fbcae8a9b9b5
 * Avatar — https://app.subframe.com/75242fa8baca/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 * Dropdown Menu — https://app.subframe.com/75242fa8baca/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Icon Button — https://app.subframe.com/75242fa8baca/library?component=Icon+Button_af9405b1-8c54-4e01-9786-5aad308224f6
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import { SidebarWithSections } from "../components/SidebarWithSections";
import { Avatar } from "../components/Avatar";
import { DropdownMenu } from "../components/DropdownMenu";
import { IconButton } from "../components/IconButton";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from '../../utils/authUtils';
import { useAuth } from '../../hooks/useAuth';

interface InviteTeamMembersRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const InviteTeamMembersRoot = React.forwardRef<
  HTMLElement,
  InviteTeamMembersRootProps
>(function InviteTeamMembersRoot(
  { children, className, ...otherProps }: InviteTeamMembersRootProps,
  ref
) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  
  const handleLogout = async () => {
    const { success } = await logoutUser();
    if (success) {
      router.push('/auth/login');
    }
  };

  return (
    <div
      className={SubframeCore.twClassNames(
        "flex h-screen w-full items-start",
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      <SidebarWithSections
        className="mobile:hidden"
        header={
          <img
            className="h-8 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1742094859/uploads/5582/z5g0s70inu7ajzonxtfx.png"
          />
        }
        footer={
          <>
            <div className="flex grow shrink-0 basis-0 items-start gap-2">
              <Avatar image="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg">
                {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-caption-bold font-caption-bold text-default-font">
                  {session?.user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {session?.user?.email || 'No email'}
                </span>
              </div>
            </div>
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <IconButton size="small" icon="FeatherMoreHorizontal" />
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                >
                  <DropdownMenu>
                    <DropdownMenu.DropdownItem icon="FeatherUser">
                      Profile
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem icon="FeatherSettings">
                      Settings
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem 
                      icon="FeatherLogOut" 
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenu.DropdownItem>
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </>
        }
      >
        <SidebarWithSections.NavSection label="Guide">
          <SidebarWithSections.NavItem
            icon="FeatherMousePointerClick"
            selected={pathname === "/dashboard/cursorflows" || pathname.includes("/dashboard/cursorflows")}
            href="/dashboard/cursorflows"
          >
            Cursor Flows
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon="FeatherBookOpen"
            selected={pathname === "/dashboard/knowledge" || pathname.includes("/dashboard/knowledge")}
            href="/dashboard/knowledge"
          >
            Knowledge
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon="FeatherUsers"
            selected={pathname === "/dashboard/audiences" || pathname.includes("/dashboard/audiences")}
            href="/dashboard/audiences"
          >
            Audiences
          </SidebarWithSections.NavItem>
        </SidebarWithSections.NavSection>
        <SidebarWithSections.NavSection label="Team">
          <SidebarWithSections.NavItem 
            icon="FeatherUserPlus"
            selected={pathname === "/dashboard/team" || pathname.includes("/dashboard/team")}
            href="/dashboard/team"
          >
            Manage Team
          </SidebarWithSections.NavItem>
        </SidebarWithSections.NavSection>
        <SidebarWithSections.NavSection label="Developers">
          <SidebarWithSections.NavItem 
            icon="FeatherCode2"
            selected={pathname === "/dashboard/setup" || pathname.includes("/dashboard/setup")}
            href="/dashboard/setup"
          >
            Setup
          </SidebarWithSections.NavItem>
        </SidebarWithSections.NavSection>
      </SidebarWithSections>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const InviteTeamMembers = InviteTeamMembersRoot;
