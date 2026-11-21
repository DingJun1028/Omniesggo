/**
 * Google Drive service - build stub
 * Full implementation requires googleapis which is excluded from build
 * due to gaxios/breaking import in googleapis-common.
 * Runtime: uses dynamic import to load googleapis.
 */

export async function uploadToDrive(fileName: string, content: Buffer, mimeType: string = 'application/pdf') {
  console.log(`[GoogleDrive] Stub upload: ${fileName}`);
  return { id: `mock-drive-id-${Date.now()}`, webViewLink: '#' };
}
