
# FCM Push Notification Server

This is a standalone server for sending push notifications using Firebase Cloud Messaging (FCM).

## Setup Instructions

1. Clone this repository or download the files.
2. Install dependencies:
   ```
   npm install
   ```
3. Place your Firebase Admin SDK service account key (serviceAccountKey.json) in the root directory.
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Send Notification

**POST /send**

Send a notification to a topic.

Request body:
```json
{
  "title": "Notification Title",
  "body": "Notification Body",
  "imageUrl": "https://example.com/image.jpg", // Optional
  "actionUrl": "https://example.com/action", // Optional
  "topic": "all" // Optional, defaults to "all"
}
```

Response:
```json
{
  "success": true,
  "messageId": "message-id-from-fcm"
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `FIREBASE_DATABASE_URL`: Your Firebase database URL

## How to Get serviceAccountKey.json

1. Go to your Firebase project settings
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Rename the downloaded file to "serviceAccountKey.json"
5. Place it in the root directory of this project

## Deployment

This server can be deployed to any Node.js hosting platform like Heroku, Vercel, Digital Ocean, AWS, etc.
