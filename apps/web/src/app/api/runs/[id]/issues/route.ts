import { NextRequest, NextResponse } from 'next/server';
import { buildMockRuns } from '@/app/mockRuns';
import type { RunIssueLink } from '@/app/types';
import { tryBackend } from '@/lib/api-proxy';
import { jsonError, readJsonBody, withRouteErrorHandling } from '@/lib/route-handler';
import { successResponse, errorResponse, createdResponse, status } from '@/lib/api-response-utils';

const ISSUES_API_URL = process.env.ISSUES_API_URL || process.env.NEXT_PUBLIC_API_URL;

// In-memory store keyed by run ID (persists for the lifetime of the process)
const issueStore = new Map<string, RunIssueLink[]>();

function getIssues(id: string): RunIssueLink[] {
  if (issueStore.has(id)) {
    return issueStore.get(id)!;
  }
  const run = buildMockRuns().find((r) => r.id === id);
  const initial = run?.associatedIssues ?? [];
  issueStore.set(id, [...initial]);
  return issueStore.get(id)!;
}

/**
 * GET /api/runs/[id]/issues
 * Returns the current issue links for a run.
 */
export const GET = withRouteErrorHandling(
  'GET /api/runs/[id]/issues',
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return tryBackend(ISSUES_API_URL, `/runs/${id}/issues`, {}, async () => {
      const run = buildMockRuns().find((r) => r.id === id);
      if (!run) {
        return jsonError('Run not found', 404);
      }
      return NextResponse.json({ runId: id, issues: getIssues(id) });
    });
  },
);
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return tryBackend(ISSUES_API_URL, `/runs/${id}/issues`, {}, async () => {
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return errorResponse('Run not found', status.notFound);
    }
    return successResponse({ runId: id, issues: getIssues(id) });
  });
}

/**
 * POST /api/runs/[id]/issues
 * Appends a new issue link. Body: { label: string; href: string }
 */
export const POST = withRouteErrorHandling(
  'POST /api/runs/[id]/issues',
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return jsonError('Run not found', 404);
    }

    const parsedBody = await readJsonBody(request);
    if ('error' in parsedBody) return parsedBody.error;

    const { label, href } = (parsedBody.body ?? {}) as Record<string, unknown>;
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = buildMockRuns().find((r) => r.id === id);
  if (!run) {
    return errorResponse('Run not found', status.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', status.badRequest);
  }

  const { label, href } = (body ?? {}) as Record<string, unknown>;

    if (typeof label !== 'string' || !label.trim()) {
      return jsonError('label is required', 400);
    }
  if (typeof label !== 'string' || !label.trim()) {
    return errorResponse('label is required', status.badRequest);
  }

    if (typeof href !== 'string') {
      return jsonError('href is required', 400);
    }
  if (typeof href !== 'string') {
    return errorResponse('href is required', status.badRequest);
  }

    try {
      const parsed = new URL(href);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return jsonError('href must use http or https', 400);
      }
    } catch {
      return jsonError('href is not a valid URL', 400);
    }
  try {
    const parsed = new URL(href);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return errorResponse('href must use http or https', status.badRequest);
    }
  } catch {
    return errorResponse('href is not a valid URL', status.badRequest);
  }

    const issues = getIssues(id);

    if (issues.some((link) => link.href === href)) {
      return jsonError('Issue link already exists', 409);
    }
  if (issues.some((link) => link.href === href)) {
    return errorResponse('Issue link already exists', status.conflict);
  }

    const newLink: RunIssueLink = { label: label.trim(), href };
    issues.push(newLink);

    return NextResponse.json({ runId: id, issues }, { status: 201 });
  },
);
  return createdResponse({ runId: id, issues });
}

/**
 * DELETE /api/runs/[id]/issues
 * Removes an issue link by href. Body: { href: string }
 */
export const DELETE = withRouteErrorHandling(
  'DELETE /api/runs/[id]/issues',
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return jsonError('Run not found', 404);
    }

    const parsedBody = await readJsonBody(request);
    if ('error' in parsedBody) return parsedBody.error;

    const { href } = (parsedBody.body ?? {}) as Record<string, unknown>;
    if (typeof href !== 'string') {
      return jsonError('href is required', 400);
    }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = buildMockRuns().find((r) => r.id === id);
  if (!run) {
    return errorResponse('Run not found', status.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', status.badRequest);
  }

  const { href } = (body ?? {}) as Record<string, unknown>;
  if (typeof href !== 'string') {
    return errorResponse('href is required', status.badRequest);
  }

    const issues = getIssues(id);
    const index = issues.findIndex((link) => link.href === href);
    if (index === -1) {
      return jsonError('Issue link not found', 404);
    }
  const issues = getIssues(id);
  const index = issues.findIndex((link) => link.href === href);
  if (index === -1) {
    return errorResponse('Issue link not found', status.notFound);
  }

    issues.splice(index, 1);
    return NextResponse.json({ runId: id, issues });
  },
);
  issues.splice(index, 1);
  return successResponse({ runId: id, issues });
}
