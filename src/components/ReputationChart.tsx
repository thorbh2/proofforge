"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Profile } from "@/lib/types";

/** D3 horizontal bars of a contributor's outcome counters. */
export function ReputationChart({ profile }: { profile: Profile }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const data = [
      { k: "Accepted", v: profile.accepted, c: "#245C4A" },
      { k: "Rejected", v: profile.rejected, c: "#B91C1C" },
      { k: "Challenges won", v: profile.challengesWon, c: "#2563EB" },
      { k: "Challenges lost", v: profile.challengesLost, c: "#D97706" },
      { k: "Appeals won", v: profile.appealsWon, c: "#2563EB" },
      { k: "Appeals lost", v: profile.appealsLost, c: "#D97706" },
    ];
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    const width = Math.max(380, ref.current?.clientWidth ?? 520);
    const labelW = 132;
    const rowH = 26;
    const gap = 10;
    const barMax = width - labelW - 44;
    const height = data.length * (rowH + gap);
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height);
    const maxV = Math.max(1, d3.max(data, (d) => d.v) ?? 1);
    const x = d3.scaleLinear().domain([0, maxV]).range([0, barMax]);
    const rows = svg.selectAll("g").data(data).join("g").attr("transform", (_d, i) => `translate(0,${i * (rowH + gap)})`);
    rows.append("text").attr("x", 0).attr("y", rowH / 2 + 4).attr("font-size", 11.5).attr("fill", "#667085").text((d) => d.k);
    rows.append("rect").attr("x", labelW).attr("y", 3).attr("width", barMax).attr("height", rowH - 6).attr("rx", 4).attr("fill", "#F4F7F2").attr("stroke", "#D7DED3");
    rows.append("rect").attr("x", labelW).attr("y", 3).attr("height", rowH - 6).attr("rx", 4).attr("fill", (d) => d.c).attr("opacity", 0.9).attr("width", 0)
      .transition().duration(550).ease(d3.easeCubicOut).attr("width", (d) => Math.max(d.v > 0 ? 6 : 0, x(d.v)));
    rows.append("text").attr("x", width - 6).attr("y", rowH / 2 + 4).attr("text-anchor", "end").attr("font-size", 12).attr("font-weight", 700).attr("fill", "#111827").text((d) => d.v);
  }, [profile]);

  return <svg ref={ref} role="img" aria-label="Reputation outcomes chart" />;
}
