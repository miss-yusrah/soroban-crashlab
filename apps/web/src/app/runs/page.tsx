'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BulkActionsForRuns, { BulkAction } from '../add-bulk-actions-for-runs';
import {
  applyBulkActionToRuns,
  getSelectedRuns,
  shouldClearSelectionAfterAction,
  toggleAllRunSelection,
  toggleRunSelection,
} from '../runs-bulk-actions-utils';
import { FuzzingRun } from '../types';

const ITEMS_PER_PAGE = 10;

function formatRunIdentifier(runId: string): string {
  const match = runId.match(/(\d+)\s*$/);
  return match ? `#${match[1]}` : runId;
}

function sortRunsForDisplay(runs: FuzzingRun[]): FuzzingRun[] {
  return [...runs].sort((left, right) => {
    const leftStarted = left.startedAt ? Date.parse(left.startedAt) : 0;
    const rightStarted = right.startedAt ? Date.parse(right.startedAt) : 0;
    return rightStarted - leftStarted;
  });
}

export default function RunsPage() {
  const [dataState, setDataState] = useState<'loading' | 'success' | 'error'>('loading');
  const [runs, setRuns] = useState<FuzzingRun[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
  const [fetchAttempt, setFetchAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      setDataState('loading');
      try {
        const res = await fetch('/api/runs', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRuns(data.runs ?? []);
          setDataState('success');
        }
      } catch {
        if (!cancelled) setDataState('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [fetchAttempt]);

  const sortedRuns = sortRunsForDisplay(runs);
  const totalPages = Math.max(1, Math.ceil(sortedRuns.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRuns = sortedRuns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const paginatedRunIds = paginatedRuns.map((run) => run.id);

  const selectedRuns = useMemo(
    () => getSelectedRuns(runs, selectedRunIds),
    [runs, selectedRunIds],
  );

  const allPageRunsSelected =
    paginatedRunIds.length > 0 &&
    paginatedRunIds.every((id) => selectedRunIds.has(id));
  const somePageRunsSelected =
    paginatedRunIds.some((id) => selectedRunIds.has(id)) && !allPageRunsSelected;

  const handleToggleRunSelection = useCallback((runId: string) => {
    setSelectedRunIds((prev) => toggleRunSelection(prev, runId));
  }, []);

  const handleToggleAllRunsSelection = useCallback(() => {
    setSelectedRunIds((prev) => toggleAllRunSelection(prev, paginatedRunIds));
  }, [paginatedRunIds]);

  const handleBulkAction = useCallback(
    (action: BulkAction, runIds: string[], data?: Record<string, unknown>) => {
      setRuns((prev) => applyBulkActionToRuns(prev, action, runIds));

      if (action === 'export' || action === 'tag' || action === 'assign') {
        console.log('Bulk action:', action, runIds, data);
      }

      if (shouldClearSelectionAfterAction(action)) {
        setSelectedRunIds(new Set());
      }
    },
    [],
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRunIds(new Set());
  };

  return (
    <div className="container-full page-padding fade-in">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="heading-page">Fuzzing Runs</h1>
          <p className="text-meta mt-0.5 sm:mt-1">
            Select runs to cancel, retry, delete, export, tag, or assign in bulk
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {dataState === 'success' && (
            <span className="chip text-xs sm:text-sm">{runs.length} Total Runs</span>
          )}
          <Link href="/" className="btn-outline text-xs sm:text-sm px-3 sm:px-6 h-8 sm:h-10">
            Dashboard
          </Link>
        </div>
      </div>

      {dataState === 'loading' && (
        <div className="card card-padding">
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2 sm:gap-4">
                <div className="skeleton h-4 w-16 sm:w-20" />
                <div className="skeleton h-4 w-12 sm:w-16" />
                <div className="skeleton h-4 w-10 sm:w-12" />
                <div className="skeleton h-4 w-12 sm:w-16" />
                <div className="skeleton h-4 w-16 sm:w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {dataState === 'error' && (
        <div
          className="card card-padding text-center py-8 sm:py-12"
          style={{ borderLeft: '4px solid #CC1016' }}
        >
          <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">⚠</span>
          <p className="font-semibold" style={{ color: '#CC1016' }}>
            Failed to load fuzzing runs
          </p>
          <p className="text-meta mt-1 mb-3 sm:mb-4">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => setFetchAttempt((n) => n + 1)}
            className="btn-primary text-xs sm:text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {dataState === 'success' && (
        <>
          <BulkActionsForRuns
            selectedRuns={selectedRuns}
            onAction={handleBulkAction}
            onClearSelection={() => setSelectedRunIds(new Set())}
          />

          <div className="card table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all runs on this page"
                      checked={allPageRunsSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = somePageRunsSelected;
                        }
                      }}
                      onChange={handleToggleAllRunsSelection}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th>Run Identifier</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Area</th>
                  <th>Severity</th>
                  <th className="hidden md:table-cell">Duration</th>
                  <th className="hidden md:table-cell">Seeds</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRuns.map((run) => (
                  <tr
                    key={run.id}
                    className={selectedRunIds.has(run.id) ? 'bg-blue-50/40' : undefined}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select run ${formatRunIdentifier(run.id)}`}
                        checked={selectedRunIds.has(run.id)}
                        onChange={() => handleToggleRunSelection(run.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td
                      className="code-text text-meta"
                      style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {formatRunIdentifier(run.id)}
                    </td>
                    <td>
                      <span className={`badge badge-${run.status}`}>{run.status}</span>
                    </td>
                    <td className="hidden sm:table-cell">{run.area}</td>
                    <td
                      style={{
                        color:
                          run.severity === 'critical'
                            ? '#C37D16'
                            : run.severity === 'high'
                              ? '#CC1016'
                              : 'var(--text-primary)',
                      }}
                    >
                      {run.severity}
                    </td>
                    <td className="hidden md:table-cell text-meta">
                      {run.duration.toLocaleString()}ms
                    </td>
                    <td className="hidden md:table-cell text-meta">
                      {run.seedCount.toLocaleString()}
                    </td>
                    <td>
                      <Link
                        href={`/runs/${run.id}`}
                        className="link text-xs sm:text-sm whitespace-nowrap"
                      >
                        View <span className="hidden sm:inline">Details</span> →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {dataState === 'success' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <span className="text-meta text-xs sm:text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-outline text-xs sm:text-sm"
              style={{
                padding: '0 12px sm:0 16px',
                height: '32px sm:36px',
                fontSize: '13px sm:14px',
                opacity: currentPage === 1 ? 0.4 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-outline text-xs sm:text-sm"
              style={{
                padding: '0 12px sm:0 16px',
                height: '32px sm:36px',
                fontSize: '13px sm:14px',
                opacity: currentPage === totalPages ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
