const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // built-in body parser for JSON

// POST route to update JSON file
app.post('/api/update-json', (req, res) => {
  const data = req.body;

  // Basic validation
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ message: 'Invalid JSON data.' });
  }

  const filePath = path.join(__dirname, 'mdm-database.json');

  fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return res.status(500).json({ message: 'Failed to write file.' });
    }
    console.log('JSON successfully saved to', filePath);
    res.status(200).json({ message: 'JSON file updated successfully.' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});
