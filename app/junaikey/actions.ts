'use server';

import { revalidatePath } from 'next/cache';

export async function addExperienceAction() {
  const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';

  try {
    const res = await fetch(`${baseUrl}/api/junaikey/growth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ expGain: 120 }),
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('Failed to add experience. Status:', res.status);
      return;
    }

    // Trigger revalidation so the page updates
    revalidatePath('/junaikey');
  } catch (error) {
    console.error('Add experience error:', error);
  }
}
