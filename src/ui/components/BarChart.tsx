"use client";
/*
 * Documentation:
 * Bar Chart — https://app.subframe.com/75242fa8baca/library?component=Bar+Chart_4d4f30e7-1869-4980-8b96-617df3b37912
 */

import React from "react";
import * as SubframeUtils from "../utils";
import * as SubframeCore from "@subframe/core";

interface BarChartRootProps
  extends React.ComponentProps<typeof SubframeCore.BarChart> {
  stacked?: boolean;
  className?: string;
}

const BarChartRoot = React.forwardRef<HTMLElement, BarChartRootProps>(
  function BarChartRoot(
    { stacked = false, className, ...otherProps }: BarChartRootProps,
    ref
  ) {
    return (
      <SubframeCore.BarChart
        className={SubframeUtils.twClassNames("h-80 w-full", className)}
        ref={ref as any}
        stacked={stacked}
        colors={[
          "#3b82f6",
          "#bfdbfe",
          "#2563eb",
          "#93c5fd",
          "#1d4ed8",
          "#60a5fa",
        ]}
        {...otherProps}
      />
    );
  }
);

export const BarChart = BarChartRoot;
