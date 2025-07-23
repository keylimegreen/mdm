async function updateJsonOnGitHub(newJson) {
  const response = await fetch('/.netlify/functions/update-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newJson),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error('Failed: ' + error);
  }

  return await response.json();
}