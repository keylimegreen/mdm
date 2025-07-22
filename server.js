require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());

const {
  GITHUB_TOKEN,
  GITHUB_REPO,
  GITHUB_FILE_PATH,
  GITHUB_BRANCH
} = process.env;

// Get SHA of existing file
async function getFileSha() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Test': 'MDM-website'
    },
    params: {
      ref: GITHUB_BRANCH
    }
  });
  return res.data.sha;
}

// Endpoint to update GitHub JSON
app.post('/api/update-json', async (req, res) => {
  const newContent = Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64');

  try {
    const sha = await getFileSha();

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

    const response = await axios.put(url, {
      message: 'Update mdm-database.json',
      content: newContent,
      sha,
      branch: GITHUB_BRANCH,
    }, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Test': 'MDM-website',
      }
    });

    res.json({ message: 'File updated on GitHub!', data: response.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to update GitHub file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});