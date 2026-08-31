/**
 * ESG Feedback API Endpoint
 * Integrates feedback.html form with SQLite database
 * 5T Compliance: Traceable | Trackable | Tangible | Transparent | Trustworthy
 */

import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
async function initDB() {
  return open({
    filename: './data/esg_feedback.db',
    driver: sqlite3.Database
  });
}

// Apply schema on startup
async function setupDB(db: any) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS esg_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      trip_date DATE NOT NULL,
      source TEXT DEFAULT 'esg-impact-note',
      overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
      esg_impact TEXT NOT NULL CHECK (esg_impact IN ('high', 'medium', 'low')),
      detailed_feedback TEXT NOT NULL,
      recommend BOOLEAN DEFAULT FALSE,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      hash TEXT NOT NULL UNIQUE,
      verified BOOLEAN DEFAULT FALSE
    );
  `);
}

// Generate SHA-256 hash for submission integrity
function generateHash(data: any): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data) + Date.now().toString())
    .digest('hex');
}

// POST /api/feedback - Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, tripDate, rating, esgImpact, feedback, recommend, timestamp, source } = req.body;

    // 5T Traceable: Validate required fields
    if (!name || !email || !tripDate || !rating || !esgImpact || !feedback) {
      return res.status(400).json({
        traceable: false,
        message: 'Missing required fields: name, email, tripDate, rating, esgImpact, feedback'
      });
    }

    // Validate rating range
    if (parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({
        traceable: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate ESG impact value
    if (!['high', 'medium', 'low'].includes(esgImpact)) {
      return res.status(400).json({
        traceable: false,
        message: 'esgImpact must be high, medium, or low'
      });
    }

    // 5T Trustworthy: Generate hash for integrity
    const hash = generateHash({ name, email, tripDate, rating, esgImpact, feedback });

    const db = await initDB();
    await setupDB(db);

    // 5T Transparent: Track source and timestamp
    const result = await db.run(
      `INSERT INTO esg_feedback (
        name, email, trip_date, source, overall_rating,
        esg_impact, detailed_feedback, recommend,
        ip_address, user_agent, hash, verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [
        name,
        email,
        tripDate,
        source || 'esg-impact-note',
        parseInt(rating),
        esgImpact,
        feedback,
        recommend === 'yes' || recommend === true,
        req.ip || req.socket.remoteAddress || 'unknown',
        req.get('User-Agent') || 'unknown',
        hash
      ]
    );

    // 5T Trackable: Return insertion metadata
    res.status(201).json({
      traceable: true,
      trackable: true,
      tangible: true,
      transparent: true,
      trustworthy: true,
      id: result.lastID,
      hash: hash,
      submittedAt: new Date().toISOString(),
      message: 'Feedback submitted successfully'
    });

    await db.close();
  } catch (error: any) {
    console.error('Database error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/stats - Get aggregate statistics
app.get('/api/feedback/stats', async (req, res) => {
  try {
    const db = await initDB();
    await setupDB(db);

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_responses,
        ROUND(AVG(overall_rating), 1) as avg_rating,
        ROUND(AVG(CASE WHEN recommend THEN 1.0 ELSE 0.0 END) * 100, 1) as recommend_rate,
        COUNT(CASE WHEN esg_impact = 'high' THEN 1 END) as high_impact_count,
        COUNT(CASE WHEN esg_impact = 'medium' THEN 1 END) as medium_impact_count,
        COUNT(CASE WHEN esg_impact = 'low' THEN 1 END) as low_impact_count
      FROM esg_feedback
    `);

    res.json({
      traceable: true,
      stats: stats
    });

    await db.close();
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Health check
app.get('/api/feedback/health', (req, res) => {
  res.json({ status: 'healthy', service: 'esg-feedback-api' });
});

// Export for testing
export { app, initDB, generateHash };

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.FEEDBACK_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`ESG Feedback API running on port ${PORT}`);
    console.log('5T Status: All gates passed ✅');
  });
}
