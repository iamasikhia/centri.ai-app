# Slack Integration Setup Guide

Slack integration requires a **public HTTPS URL**, so we will use the Ngrok tunnel currently running.

**Current Ngrok URL:** `https://krystal-beachy-devyn.ngrok-free.dev`

## Step 1: Create Slack App
1.  Go to [api.slack.com/apps](https://api.slack.com/apps).
2.  Click **Create New App** -> **From scratch**.
3.  App Name: **Centri AI**.
4.  Pick a workspace to develop in.

## Step 2: Configure Redirect URI
1.  In the sidebar, click **OAuth & Permissions**.
2.  Scroll down to **Redirect URLs**.
3.  Click **Add New Redirect URL** and paste:
    ```
    https://krystal-beachy-devyn.ngrok-free.dev/integrations/slack/callback
    ```
4.  Click **Save URLs**.

## Step 3: Configure Environment Variables
1.  Open `apps/api/.env`.
2.  Add your Client ID and Secret (from **Basic Information** page).
3.  **Crucial**: Set the `API_BASE_URL` to your Ngrok URL, but keep `API_LOCAL_URL` for other apps.
    
    Add/Update these lines:
    ```env
    SLACK_CLIENT_ID=your_client_id
    SLACK_CLIENT_SECRET=your_client_secret
    
    # Slack uses this Public URL
    API_BASE_URL=https://krystal-beachy-devyn.ngrok-free.dev
    
    # Gmail/GitHub continue to use this Local URL
    API_LOCAL_URL=http://localhost:3001
    ```

## Step 4: Restart Backend
Restart the API server to load the new configuration:
```bash
# In apps/api
npm run start:dev
```

## Step 5: Connect
1.  Go to Dashboard **Settings > Integrations**.
2.  Click **Connect** on Slack.
