"use client";
/*
 * Documentation:
 * List Row — https://app.subframe.com/75242fa8baca/library?component=List+Row_d6e8f80b-d871-4e7c-ad75-4907e5b2d7c9
 * Dropdown Menu — https://app.subframe.com/75242fa8baca/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Icon Button — https://app.subframe.com/75242fa8baca/library?component=Icon+Button_af9405b1-8c54-4e01-9786-5aad308224f6
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import { DropdownMenu } from "./DropdownMenu";

interface ListRowRootProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  image?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ListRowRoot = React.forwardRef<HTMLElement, ListRowRootProps>(
  function ListRowRoot(
    {
      image,
      title,
      subtitle,
      actions,
      className,
      ...otherProps
    }: ListRowRootProps,
    ref
  ) {
    return (
      <div
        className={SubframeCore.twClassNames(
          "group/d6e8f80b flex w-full cursor-pointer items-center gap-4 rounded-md px-2 py-2 hover:bg-neutral-50 active:bg-neutral-100 focus-within:bg-neutral-100",
          className
        )}
        ref={ref as any}
        {...otherProps}
      >
        {image ? (
          <img
            className="h-12 w-12 flex-none rounded-md object-cover"
            src={image}
          />
        ) : null}
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
          {title ? (
            <span className="line-clamp-1 w-full text-body-bold font-body-bold text-default-font">
              {title}
            </span>
          ) : null}
          {subtitle ? (
            <span className="line-clamp-1 w-full text-caption font-caption text-subtext-color">
              {subtitle}
            </span>
          ) : null}
        </div>
        {actions ? (
          <div className="hidden items-center gap-4 group-hover/d6e8f80b:flex">
            {actions}
          </div>
        ) : null}
      </div>
    );
  }
);

export const ListRow = ListRowRoot;
