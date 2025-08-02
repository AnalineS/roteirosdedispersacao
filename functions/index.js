const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

// Google Apps Script URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyLemOPBnH6ZPq_AE3x7NW85I4UFW9pITrAap9dVg5Oj9IannQVgDWWOE_WJ0L6ltWD2w/exec';

// Proxy function to forward requests to Google Apps Script
exports.chatProxy = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    console.log('📨 Proxy request received:', req.method, req.body);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Forward request to Google Apps Script
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.text();
      console.log('📥 GAS Response:', data.substring(0, 200));

      // Try to parse as JSON, if not return as text
      try {
        const jsonData = JSON.parse(data);
        return res.status(200).json(jsonData);
      } catch (e) {
        // If not JSON, return as plain text
        return res.status(200).json({ response: data });
      }
    } catch (error) {
      console.error('❌ Proxy error:', error);
      return res.status(500).json({ 
        error: 'Failed to connect to Google Apps Script',
        details: error.message 
      });
    }
  });
});

// Health check endpoint
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'chat-proxy'
    });
  });
});