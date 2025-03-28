
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON requests
app.use(bodyParser.json());

// Initialize Firebase Admin SDK with service account
// You'll need to provide your own service account key file when deploying
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'FCM Push Notification Server is running' });
});

// Endpoint to send notification to a topic
app.post('/send', async (req, res) => {
  // Log headers for debugging
  console.log('Request headers:', req.headers);
  
  try {
    if (!admin.apps.length) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin SDK not initialized'
      });
    }

    const { title, body, imageUrl, actionUrl, topic = 'all' } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required'
      });
    }

    console.log('Sending notification to topic:', topic);
    console.log('Notification details:', { title, body, imageUrl, actionUrl });

    // Create message payload
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        // Convert all values to strings for FCM
        title: String(title),
        body: String(body),
        sentAt: String(Date.now()),
      },
      topic
    };

    // Add optional fields if they exist
    if (imageUrl) {
      message.notification.imageUrl = imageUrl;
      message.data.imageUrl = String(imageUrl);
    }

    if (actionUrl) {
      message.data.actionUrl = String(actionUrl);
    }

    console.log('FCM message payload:', JSON.stringify(message, null, 2));

    // Send the message
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return res.status(200).json({
      success: true,
      messageId: response
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`FCM Push Notification Server running on port ${PORT}`);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down server...');
  process.exit(0);
});
