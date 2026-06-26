import { NextResponse } from 'next/server';
import { listArtifactMetadata, saveArtifact } from '@/lib/artifact-fs-adapter';
import { logger } from '@/lib/logger';
import { successResponse, errorResponse, createdResponse, status } from '@/lib/api-response-utils';
import { jsonError, withRouteErrorHandling } from '@/lib/route-handler';

/**
 * GET /api/artifacts
 * Lists all artifacts from CRASHLAB_ARTIFACT_DIR
 */
export const GET = withRouteErrorHandling(
  'GET /api/artifacts',
  async () => {
    const artifacts = await listArtifactMetadata();

    return successResponse({ artifacts }, { total: artifacts.length });
  } catch (error) {
    logger.error('GET /api/artifacts failed', { error });
    return errorResponse('Failed to list artifacts', status.internalError);
  }
}
    return NextResponse.json({
      artifacts,
      total: artifacts.length,
    });
  },
  'Failed to list artifacts',
);

/**
 * POST /api/artifacts
 * Stores an uploaded artifact in CRASHLAB_ARTIFACT_DIR (or temp dir).
 */
export const POST = withRouteErrorHandling(
  'POST /api/artifacts',
  async (request: Request) => {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return errorResponse('file is required', status.badRequest);
      return jsonError('file is required', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await saveArtifact(file.name, buffer);
    return createdResponse({ artifact: metadata });
  } catch (error) {
    logger.error('POST /api/artifacts failed', { error });
    return errorResponse('Failed to upload artifact', status.internalError);
  }
}
    return NextResponse.json(metadata, { status: 201 });
  },
  'Failed to upload artifact',
);
