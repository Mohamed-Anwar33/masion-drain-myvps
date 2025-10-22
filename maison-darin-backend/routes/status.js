const express = require('express');
const router = express.Router();

// Simple status check endpoint
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

module.exports = router;
