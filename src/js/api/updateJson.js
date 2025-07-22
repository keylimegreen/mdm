// src/js/api/updateJson.js

export async function updateJsonOnGitHub(newJson) {
    const response = await fetch('/api/update-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo: 'your-repo-name',
        path: 'data.json',
        branch: 'main',
        newJson: newJson
      })
    });
  
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update JSON');
    }
  
    return await response.json();
  }
  