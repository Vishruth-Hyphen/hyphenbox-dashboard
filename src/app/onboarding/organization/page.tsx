"use client";

import React from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";

export default function OrganizationPage() {
  return (
    <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch px-12 py-12">
      <img
        className="h-8 w-8 flex-none object-cover"
        src="https://res.cloudinary.com/subframe/image/upload/v1742711953/uploads/5582/znqgfqgswfibjir7hibm.png"
        alt="Company logo"
      />
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-start justify-center gap-12">
        <div className="flex w-full flex-col items-start justify-center gap-4">
          <div className="flex flex-col items-start gap-1">
            <span className="w-full text-heading-2 font-heading-2 text-default-font">
              What&#39;s the name of your company?
            </span>
            <span className="text-heading-3 font-heading-3 text-subtext-color">
              Set up your organization 
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start justify-center gap-6">
          <TextField
            className="h-auto w-full flex-none"
            label="Organization Name"
            helpText=""
          >
            <TextField.Input
              placeholder="Acme, Inc"
              value=""
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
            />
          </TextField>
          <TextField
            className="h-auto w-full flex-none"
            label="A brief description about your product"
            helpText=""
          >
            <TextField.Input
              placeholder=" What does your product do?"
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
          <Button onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}