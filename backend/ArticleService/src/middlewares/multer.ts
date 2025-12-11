import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

const router = express.Router();

// --- 1. CONFIGURATION ---
const uploadDir = path.join(__dirname, '../public/uploads');

// Ensure directory exists
fs.ensureDirSync(uploadDir);

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'article-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// --- 2. THE ROUTE ---
// The Gateway maps localhost:8000/articles/upload -> localhost:7000/api/articles/upload
// So this route needs to be defined relative to your router's base path.

// ... your other CRUD routes (create, update, etc.)

export default router;
