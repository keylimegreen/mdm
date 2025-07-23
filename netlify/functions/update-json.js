const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const body = JSON.parse(event.body);
  const jsonContent = JSON.stringify(body);

  const response = await fetch('https://api.github.com/repos/keylimegreen/mdm/actions/workflows/update-json.yml/dispatches', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: { jsonContent }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to trigger GitHub workflow: ' + error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'GitHub workflow triggered!' }),
  };
};
