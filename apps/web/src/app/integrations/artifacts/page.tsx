'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ArtifactStorageIntegration = dynamic(
  () => import('../../integrate-storage-backend-integration-for-artifacts'),
  { ssr: false }
);

export default function ArtifactStorageIntegrationPage() {
  return <ArtifactStorageIntegration />;
}
