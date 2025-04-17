"use client";

import React from "react";
// import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { IconWithBackground } from "@/ui/components/IconWithBackground";

function Setup() {
  return (
    // <InviteTeamMembers>
    <>
      <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-default-background py-12">
        <div className="flex w-full max-w-[768px] flex-col items-start gap-12">
          <div className="flex w-full flex-col items-start">
            <span className="text-heading-2 font-heading-2 text-default-font">
              Set up Hyphenbox
            </span>
            <span className="text-body font-body text-subtext-color">
              Follow these steps to integrate Hyphenbox with your application
            </span>
          </div>
          <div className="flex w-full flex-col items-start">
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherPackage" />
                <div className="flex w-0.5 grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 pb-6">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Install the package
                  </span>
                  <span className="text-body font-body text-default-font">
                    First, install our package using npm or yarn
                  </span>
                </div>
                <div className="flex w-full items-start gap-2">
                  <div className="flex grow shrink-0 basis-0 items-center rounded-md bg-neutral-100 px-4 py-2">
                    <span className="text-body font-body text-default-font">
                      npm install @hyphenbox/react
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherCode" />
                <div className="flex w-0.5 grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 pb-6">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Configure your frontend
                  </span>
                  <span className="text-body font-body text-default-font">
                    Add the Hyphenbox provider to your app
                  </span>
                </div>
                <div className="flex w-full items-start gap-2">
                  <div className="flex grow shrink-0 basis-0 items-center rounded-md bg-neutral-100 px-4 py-2">
                    <span className="text-body font-body text-default-font">
                      importfrom &#39;@hyphenbox/react&#39;
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherUserPlus" />
                <div className="flex w-0.5 grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 pb-6">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Create your account
                  </span>
                  <span className="text-body font-body text-default-font">
                    Set up your organization&#39;s Hyphenbox account
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherCode2" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Add the snippet
                  </span>
                  <span className="text-body font-body text-default-font">
                    Copy and paste this snippet into your app&#39;s main
                    component
                  </span>
                </div>
                <div className="flex w-full items-start gap-2">
                  <div className="flex grow shrink-0 basis-0 items-center rounded-md bg-neutral-100 px-4 py-2">
                    <span className="text-body font-body text-default-font">
                      &lt;HyphenboxProvider apiKey=&quot;YOUR_API_KEY&quot;
                      /&gt;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Setup;
