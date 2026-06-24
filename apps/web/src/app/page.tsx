"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ResourceFeeInsightPanel } from "./implement-resource-fee-insight-panel-component";
import { FuzzingRun } from "./types";

function DashboardContent() {
  const [runs, setRuns] = useState<FuzzingRun[]>([]);
  const [dataState, setDataState] = useState<"loading" | "error" | "success">("loading");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/runs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRuns(data.runs ?? []);
          setDataState("success");
        }
      } catch {
        if (!cancelled) setDataState("error");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container-full page-padding fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-page">Dashboard</h1>
        <Link href="/runs" className="btn-primary text-sm">View Runs</Link>
      </div>

      {dataState === "success" && (
        <div className="section">
          <ResourceFeeInsightPanel runs={runs} dataState={dataState} />
        </div>
      )}

      {dataState === "loading" && <div className="card card-padding text-meta">Loading resource metrics...</div>}
      {dataState === "error" && <div className="card card-padding">Failed to load runs.</div>}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container-full page-padding text-meta">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
