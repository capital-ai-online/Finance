import express from 'express';
import path from 'path';
import fs from 'fs';

export const documentationRouter = express.Router();

documentationRouter.get('/api/docs-file', (req, res) => {
  const { path: docPath } = req.query;
  if (!docPath || typeof docPath !== 'string') {
    return res.status(400).json({ error: 'Path parameter is required.' });
  }

  const sanitizedPath = path.normalize(docPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const docsRoot = path.resolve(process.cwd(), 'docs');
  const fullPath = path.resolve(process.cwd(), sanitizedPath);

  if (!fullPath.startsWith(docsRoot + path.sep) && fullPath !== docsRoot) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return res.status(404).json({ error: 'Documentation file not found.' });
  }

  return res.type('text/plain').send(fs.readFileSync(fullPath, 'utf8'));
});

documentationRouter.post('/api/docs-file', (req, res) => {
  const { path: docPath, content } = req.body || {};
  if (!docPath || typeof docPath !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'path and content are required.' });
  }

  const sanitizedPath = path.normalize(docPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const docsRoot = path.resolve(process.cwd(), 'docs');
  const fullPath = path.resolve(process.cwd(), sanitizedPath);

  if (!fullPath.startsWith(docsRoot + path.sep) && fullPath !== docsRoot) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  return res.json({ success: true, path: sanitizedPath });
});
