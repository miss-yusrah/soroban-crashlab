import { NextRequest, NextResponse } from 'next/server';
import {
  getArtifactById,
  deleteArtifactById,
} from '@/lib/artifact-fs-adapter';
import { logger } from '@/lib/logger';
import { successResponse, errorResponse, status } from '@/lib/api-response-utils';
import { jsonError, withRouteErrorHandling } from '@/lib/route-handler';

/**
 * GET /api/artifacts/[id]
 * Downloads an artifact from CRASHLAB_ARTIFACT_DIR by ID
 */
export const GET = withRouteErrorHandling(
  'GET /api/artifacts/[id]',
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
      return errorResponse('Artifact ID is required', status.badRequest);
      return jsonError('Artifact ID is required', 400);
    }

    const result = await getArtifactById(id);

    if (!result) {
      return errorResponse('Artifact not found', status.notFound);
      return jsonError('Artifact not found', 404);
    }

    const { metadata, buffer } = result;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${metadata.name}"`,
        'Content-Length': metadata.sizeBytes.toString(),
      },
    });
  } catch (error) {
    logger.error('GET /api/artifacts/[id] failed', { error });
    return errorResponse('Failed to download artifact', status.internalError);
  }
}
  },
  'Failed to download artifact',
);

/**
 * DELETE /api/artifacts/[id]
 * Deletes an artifact from CRASHLAB_ARTIFACT_DIR by ID
 */
export const DELETE = withRouteErrorHandling(
  'DELETE /api/artifacts/[id]',
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
      return errorResponse('Artifact ID is required', status.badRequest);
      return jsonError('Artifact ID is required', 400);
    }

    const deleted = await deleteArtifactById(id);

    if (!deleted) {
      return errorResponse('Artifact not found', status.notFound);
    }

    return successResponse({ success: true, message: 'Artifact deleted successfully' });
  } catch (error) {
    logger.error('DELETE /api/artifacts/[id] failed', { error });
    return errorResponse('Failed to delete artifact', status.internalError);
  }
}
      return jsonError('Artifact not found', 404);
    }

    return NextResponse.json({
      success: true,
      message: 'Artifact deleted successfully',
    });
  },
  'Failed to delete artifact',
);
