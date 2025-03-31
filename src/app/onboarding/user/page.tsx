"use client";

import React from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";

function OnboardingSetupWizard2() {
  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch px-12 py-12">
        <img
          className="h-8 w-8 flex-none object-cover"
          src="https://res.cloudinary.com/subframe/image/upload/v1742711953/uploads/5582/znqgfqgswfibjir7hibm.png"
        />
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start justify-center gap-12">
          <div className="flex w-full flex-col items-start justify-center gap-4">
            <div className="flex flex-col items-start gap-1">
              <span className="w-full text-heading-2 font-heading-2 text-default-font">
                Who are you
              </span>
              <span className="text-heading-3 font-heading-3 text-subtext-color">
                Tell us about yourself
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col items-start justify-center gap-6">
            <TextField
              className="h-auto w-full flex-none"
              label="Your name"
              helpText=""
            >
              <TextField.Input
                placeholder="Steve Jobs"
                value=""
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label="Your role in the company"
              helpText=""
            >
              <TextField.Input
                placeholder="What do you do?"
                value=""
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
              />
            </TextField>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="neutral-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Back
            </Button>
            <Button
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-12 self-stretch bg-brand-600 px-12 py-12 mobile:hidden">
        <img
          className="w-52 flex-none"
          src="https://res.cloudinary.com/subframe/image/upload/v1742712370/uploads/5582/tltzpvmp8sijr8etiuxo.png"
        />
      </div>
    </div>
  );
}

export default OnboardingSetupWizard2;