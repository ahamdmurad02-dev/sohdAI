import { getAccessToken } from '../firebase';

export async function fetchSpaces() {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://chat.googleapis.com/v1/spaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch spaces');
  }

  const data = await res.json();
  return data.spaces || [];
}

export async function fetchMessages(spaceName: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch messages');
  }

  const data = await res.json();
  return data.messages || [];
}

export async function sendMessage(spaceName: string, text: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to send message');
  }

  return await res.json();
}
