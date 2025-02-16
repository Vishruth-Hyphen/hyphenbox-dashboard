"use client";
/*
 * Documentation:
 * Pie Chart — https://app.subframe.com/7418c6bb4910/library?component=Pie+Chart_0654ccc7-054c-4f3a-8e9a-b7c81dd3963c
 */

import React from "react";
import * as SubframeCore from "@subframe/core";

interface PieChartRootProps
  extends React.ComponentProps<typeof SubframeCore.PieChart> {
  className?: string;
}

const PieChartRoot = React.forwardRef<HTMLElement, PieChartRootProps>(
  function PieChartRoot({ className, ...otherProps }: PieChartRootProps, ref) {
    return (
      <SubframeCore.PieChart
        className={SubframeCore.twClassNames("h-52 w-52", className)}
        ref={ref as any}
        colors={[
          "#737373",
          "#e5e5e5",
          "#262626",
          "#d4d4d4",
          "#404040",
          "#a3a3a3",
        ]}
        {...otherProps}
      />
    );
  }
);

export const PieChart = PieChartRoot;
