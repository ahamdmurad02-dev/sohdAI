import { getAccessToken } from '../firebase';

export async function fetchDocument(documentId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch document');
  }

  return await res.json();
}

/**
 * Simplistic parser to extract plain text from a Google Doc structure.
 */
export function extractTextFromDocument(document: any): string {
  let text = '';
  if (!document?.body?.content) return text;

  for (const element of document.body.content) {
    if (element.paragraph) {
      for (const el of element.paragraph.elements) {
        if (el.textRun?.content) {
          text += el.textRun.content;
        }
      }
    }
    // Note: Tables, lists, etc. would need additional handling for a full parser.
  }
  return text;
}
