import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes by serving the index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading the application.');
    }

    // Inject the API key from environment variables
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error('API_KEY environment variable not set.');
      return res.status(500).send('Server configuration error: API_KEY is missing.');
    }

    const injectedHtml = data.replace(
      '<script>__API_KEY_SCRIPT__</script>',
      `<script>window.process = { env: { API_KEY: "${apiKey}" } };</script>`
    );
    
    res.send(injectedHtml);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
