import { NextRequest, NextResponse } from 'next/server';
import { buildMockRuns } from '@/app/mockRuns';
import type { FuzzingRun } from '@/app/types';
import { withRouteErrorHandling } from '@/lib/route-handler';
import { logger } from '@/lib/logger';
import { successResponse, errorResponse, status } from '@/lib/api-response-utils';

/**
 * Resolves a single run by ID from the in-process mock store.
 * Exported for unit testing without the Next.js request layer.
 */
export function findRunById(id: string): FuzzingRun | undefined {
  return buildMockRuns().find((r) => r.id === id);
}

/**
 * GET /api/runs/[id]
 *
 * When RUNS_API_URL is set the request is forwarded to the Rust backend at
 * `${RUNS_API_URL}/runs/<id>`.  Otherwise the response is served from the
 * in-process mock dataset so the frontend stays functional without the backend.
 *
 * Env vars:
 *   RUNS_API_URL  – base URL of the Rust fuzzer API (e.g. http://localhost:8080)
 */
export const GET = withRouteErrorHandling(
  'GET /api/runs/[id]',
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
      return errorResponse('Run ID is required', status.badRequest);
    }

    const runsApiUrl = process.env.RUNS_API_URL;

    if (runsApiUrl) {
      const upstream = await fetch(
        `${runsApiUrl}/runs/${encodeURIComponent(id)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (upstream.status === 404) {
        return errorResponse('Run not found', status.notFound);
      }
      if (!upstream.ok) {
        return errorResponse('Upstream error', status.badGateway);
      }
      const data = (await upstream.json()) as unknown;
      return successResponse(data, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
    }

    const run = findRunById(id);
    if (!run) {
      return errorResponse('Run not found', status.notFound);
    }
    return NextResponse.json(run, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
  },
);
    return successResponse(run, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (error) {
    logger.error('GET /api/runs/[id] failed', { error });
    return errorResponse('Failed to fetch run', status.internalError);
  }
}
