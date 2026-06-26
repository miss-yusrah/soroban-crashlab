import { NextRequest, NextResponse } from 'next/server';
import { buildMockRuns } from '@/app/mockRuns';
import { addTag, normalizeTag, removeTag } from '@/app/run-tags-utils';
import { jsonError, readJsonBody, withRouteErrorHandling } from '@/lib/route-handler';
import { successResponse, errorResponse, createdResponse, status } from '@/lib/api-response-utils';

// In-memory store keyed by run ID (persists for the lifetime of the process)
const tagStore = new Map<string, string[]>();

function getTags(id: string): string[] {
  if (!tagStore.has(id)) {
    const run = buildMockRuns().find((r) => r.id === id);
    const initial = run?.tags ?? [];
    tagStore.set(id, [...initial]);
  }
  return tagStore.get(id)!;
}

/**
 * GET /api/runs/[id]/tags
 * Returns the current tag list for a run.
 */
export const GET = withRouteErrorHandling(
  'GET /api/runs/[id]/tags',
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return jsonError('Run not found', 404);
    }
    return NextResponse.json({ runId: id, tags: getTags(id) });
  },
);
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = buildMockRuns().find((r) => r.id === id);
  if (!run) {
    return errorResponse('Run not found', status.notFound);
  }
  return successResponse({ runId: id, tags: getTags(id) });
}

/**
 * POST /api/runs/[id]/tags
 * Adds a tag (normalized to kebab-case). Body: { tag: string }
 */
export const POST = withRouteErrorHandling(
  'POST /api/runs/[id]/tags',
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return jsonError('Run not found', 404);
    }

    const parsedBody = await readJsonBody(request);
    if ('error' in parsedBody) return parsedBody.error;

    const raw = (parsedBody.body as Record<string, unknown>)?.tag;
    if (typeof raw !== 'string' || !raw.trim()) {
      return jsonError('tag is required and must be a non-empty string', 400);
    }
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

  const raw = (body as Record<string, unknown>)?.tag;
  if (typeof raw !== 'string' || !raw.trim()) {
    return errorResponse('tag is required and must be a non-empty string', status.badRequest);
  }

    const current = getTags(id);
    const result = addTag(current, raw);
    if (!result.success) {
      return jsonError(result.error ?? 'Failed to add tag', 400);
    }
  const current = getTags(id);
  const result = addTag(current, raw);
  if (!result.success) {
    return errorResponse(result.error, status.badRequest);
  }

    tagStore.set(id, result.tags);
    return NextResponse.json({ runId: id, tags: result.tags }, { status: 201 });
  },
);
  tagStore.set(id, result.tags);
  return createdResponse({ runId: id, tags: result.tags });
}

/**
 * DELETE /api/runs/[id]/tags
 * Removes a tag by value. Body: { tag: string }
 */
export const DELETE = withRouteErrorHandling(
  'DELETE /api/runs/[id]/tags',
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const run = buildMockRuns().find((r) => r.id === id);
    if (!run) {
      return jsonError('Run not found', 404);
    }

    const parsedBody = await readJsonBody(request);
    if ('error' in parsedBody) return parsedBody.error;

    const raw = (parsedBody.body as Record<string, unknown>)?.tag;
    if (typeof raw !== 'string' || !raw.trim()) {
      return jsonError('tag is required', 400);
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

  const raw = (body as Record<string, unknown>)?.tag;
  if (typeof raw !== 'string' || !raw.trim()) {
    return errorResponse('tag is required', status.badRequest);
  }

    const normalized = normalizeTag(raw);
    const current = getTags(id);
    if (!current.includes(normalized)) {
      return jsonError('Tag not found', 404);
    }
  const normalized = normalizeTag(raw);
  const current = getTags(id);
  if (!current.includes(normalized)) {
    return errorResponse('Tag not found', status.notFound);
  }

    const next = removeTag(current, normalized);
    tagStore.set(id, next);
    return NextResponse.json({ runId: id, tags: next });
  },
);
  const next = removeTag(current, normalized);
  tagStore.set(id, next);
  return successResponse({ runId: id, tags: next });
}
