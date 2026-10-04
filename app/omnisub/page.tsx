import React from 'react';
import { OmniSubClient } from './omnisub-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function OmniSubPage() {
  return <OmniSubClient />;
}
