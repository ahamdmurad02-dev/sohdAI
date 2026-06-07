import { getAccessToken } from '../firebase';

export async function fetchEmails(maxResults = 10) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch messages');
  }

  const data = await res.json();
  if (!data.messages) return [];

  const emails = await Promise.all(
    data.messages.map((msg: { id: string }) => fetchEmailDetails(msg.id))
  );

  return emails;
}

export async function fetchEmailDetails(messageId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch message details');
  }

  return await res.json();
}

/**
 * Simplistic parser to extract text/plain from Gmail message parts.
 */
export function extractTextFromEmail(message: any): string {
  let text = '';
  
  const decodeBase64Url = (base64Url: string) => {
    try {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const binString = atob(base64);
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return '';
    }
  };

  if (message.payload?.body?.data) {
    text += decodeBase64Url(message.payload.body.data);
  } else if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decodeBase64Url(part.body.data);
      } else if (part.parts) {
        text += extractTextFromEmail({ payload: part });
      }
    }
  }

  return text;
}
