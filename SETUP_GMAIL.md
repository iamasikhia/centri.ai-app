# Gmail Integration Setup Guide

## Step 1: Configure OAuth in Google Cloud Console
1.  Navigate to **APIs & Services** > **Credentials**.
2.  Click on your **OAuth 2.0 Client ID** (the same one used for Google Calendar, or create a new one).
3.  Scroll to **Authorized redirect URIs**.
4.  Add the following URI:
    ```
    http://localhost:3001/integrations/gmail/callback
    ```
5.  Click **Save**.

## Step 2: Verify Enabled API
1.  Go to **Enabled APIs & services**.
2.  Check that **Gmail API** is enabled.

## Step 3: Check Environment Variables
1.  Open `apps/api/.env`.
2.  Ensure you have your OAuth credentials:
    ```
    GOOGLE_CLIENT_ID=your_client_id_here
    GOOGLE_CLIENT_SECRET=your_client_secret_here
    ```
3.  Ensure `API_LOCAL_URL` is set:
    ```
    API_LOCAL_URL=http://localhost:3001
    ```
4.  (Optional) Ensure `FRONTEND_URL` matches your dashboard port (default 3000):
    ```
    FRONTEND_URL=http://localhost:3000
    ```

## Step 4: Restart Backend
Restart your NestJS API to load the environment setup:
```bash
# In apps/api directory
npm run start:dev
```

## Step 5: Connect
1.  Go to your Centri Dashboard **Settings > Integrations**.
2.  Find **Gmail** and click **Connect**.
