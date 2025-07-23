export async function updateJsonOnGitHub(newJson) {
    const response = await fetch(
      'https://api.github.com/repos/keylimegreen/mdm/actions/workflows/update-json.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer YOUR_GITHUB_TOKEN', // see security notes!
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main', // branch name to trigger on
          inputs: {
            jsonContent: JSON.stringify(newJson),
          }
        }),
      }
    );
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Failed to trigger workflow: ' + errorText);
    }
    console.log('Workflow triggered!');
  }
  