"use client";
/*
 * Documentation:
 * Modern footer — https://app.subframe.com/7418c6bb4910/library?component=Modern+footer_4b4c4ad8-afcc-4799-ab54-034089d0145d
 * Icon Button — https://app.subframe.com/7418c6bb4910/library?component=Icon+Button_af9405b1-8c54-4e01-9786-5aad308224f6
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "./IconButton";

interface ModernFooterRootProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ModernFooterRoot = React.forwardRef<HTMLElement, ModernFooterRootProps>(
  function ModernFooterRoot(
    { className, ...otherProps }: ModernFooterRootProps,
    ref
  ) {
    return (
      <div
        className={SubframeCore.twClassNames(
          "flex w-full flex-col items-center justify-center gap-6 border-t border-solid border-neutral-100 px-6 py-12",
          className
        )}
        ref={ref as any}
        {...otherProps}
      >
        <div className="flex w-full max-w-[1024px] flex-wrap items-start gap-6">
          <div className="flex min-w-[320px] flex-col items-start gap-6 self-stretch">
            <div className="flex w-full min-w-[320px] grow shrink-0 basis-0 items-start gap-4">
              <img
                className="h-5 w-5 flex-none object-cover"
                src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png"
              />
              <span className="grow shrink-0 basis-0 font-['Inter'] text-[14px] font-[500] leading-[20px] text-default-font -tracking-[0.01em]">
                Subframe
              </span>
            </div>
            <div className="flex w-full items-center gap-2">
              <IconButton icon="FeatherTwitter" />
              <IconButton icon="FeatherGithub" />
              <IconButton icon="FeatherSlack" />
              <IconButton icon="FeatherYoutube" />
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-wrap items-start gap-4 self-stretch">
            <div className="flex min-w-[144px] grow shrink-0 basis-0 flex-col items-start gap-4">
              <span className="w-full font-['Inter'] text-[14px] font-[500] leading-[20px] text-default-font -tracking-[0.01em]">
                Product
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Features
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Integrations
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Pricing
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Docs
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Download
              </span>
            </div>
            <div className="flex min-w-[144px] grow shrink-0 basis-0 flex-col items-start gap-4">
              <span className="w-full font-['Inter'] text-[14px] font-[500] leading-[20px] text-default-font -tracking-[0.01em]">
                Company
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                About us
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Blog
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Careers
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Customers
              </span>
            </div>
            <div className="flex min-w-[144px] grow shrink-0 basis-0 flex-col items-start gap-4">
              <span className="w-full font-['Inter'] text-[14px] font-[500] leading-[20px] text-default-font -tracking-[0.01em]">
                Resources
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Community
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Contact
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Privacy Policy
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Terms of Service
              </span>
            </div>
            <div className="flex min-w-[144px] grow shrink-0 basis-0 flex-col items-start gap-4">
              <span className="w-full font-['Inter'] text-[14px] font-[500] leading-[20px] text-default-font -tracking-[0.01em]">
                Developers
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                API
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Status
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-subtext-color -tracking-[0.01em]">
                Github
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const ModernFooter = ModernFooterRoot;
