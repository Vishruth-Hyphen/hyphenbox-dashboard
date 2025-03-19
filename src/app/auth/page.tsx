"use client";

import React, { useState } from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { LinkButton } from "@/ui/components/LinkButton";
import { sendMagicLink } from "../../utils/authUtils";

function SignIn() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    const result = await sendMagicLink(email);
    if (result.success) {
      setMessage("Magic link sent! Check your email.");
    } else {
      const errorMessage = (result.error as Error).message;
      setMessage(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="flex h-full w-full flex-wrap items-start bg-default-background mobile:flex-col mobile:flex-wrap mobile:gap-0">
      <div className="flex max-w-[576px] grow shrink-0 basis-0 flex-col items-center gap-12 self-stretch bg-brand-600 px-12 py-12 mobile:h-auto mobile:w-full mobile:flex-none">
        <div className="flex w-full max-w-[448px] grow shrink-0 basis-0 flex-col items-start justify-center gap-12 mobile:h-auto mobile:w-full mobile:max-w-[448px] mobile:flex-none">
          <img
            className="h-12 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1742091466/uploads/5582/svy6lyqqwqice1toqymg.png"
          />
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-6 self-stretch border-l border-solid border-neutral-border px-12 py-12">
        <div className="flex w-full max-w-[448px] flex-col items-start justify-center gap-8">
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <span className="w-full text-heading-2 font-heading-2 text-default-font text-center">
              Sign In
            </span>
          </div>
          <div className="flex w-full flex-col items-start justify-center gap-4">
            <div className="flex w-full items-center gap-2">
              <TextField
                className="h-auto grow shrink-0 basis-0"
                label=""
                helpText=""
                icon="FeatherMail"
              >
                <TextField.Input
                  placeholder="Email address"
                  value={email}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                />
              </TextField>
              <Button onClick={handleLogin}>
                Login
              </Button>
            </div>
          </div>
        </div>
        {message && <div className="message">{message}</div>}
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-body font-body text-subtext-color">
            Don&#39;t have an account?
          </span>
          <LinkButton
            variant="brand"
            iconRight="FeatherChevronRight"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            Try Hyphenbox today
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export default SignIn;