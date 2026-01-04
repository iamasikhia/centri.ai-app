# How to Set Up Slack Integration

To enable Slack integration for Centri.ai locally, follow these steps:

## 1. Create a Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App**.
3. Choose **From scratch**.
4. Enter an App Name (e.g., "Centri Integration") and select your Development Workspace.
5. Click **Create App**.

## 2. Configure OAuth & Permissions
1. In the left sidebar, click **OAuth & Permissions**.
2. Scroll down to **Redirect URLs**.
3. Click **Add New Redirect URL**.
4. Enter the local callback URL: 
   `http://localhost:3001/integrations/slack/callback`
5. Click **Add** and then **Save URLs**.

## 3. Add Scopes
1. Still in **OAuth & Permissions**, scroll down to **Scopes**.
2. Under **User Token Scopes** (for acting on behalf of a user) OR **Bot Token Scopes**, add:
   - `users:read` (Required to discover team members)
   - `users:read.email` (To match users by email)
   - `team:read` (Optional, for team info)

## 4. Get Credentials
1. Go to **Basic Information** in the left sidebar.
2. Scroll down to **App Credentials**.
3. Copy the **Client ID** and **Client Secret**.

## 5. Update Environment Variables
1. Open `apps/api/.env` in your code editor.
2. Paste your credentials:
   ```env
   SLACK_CLIENT_ID="your_client_id_here"
   SLACK_CLIENT_SECRET="your_client_secret_here"
   ```
3. Restart your backend server (`pnpm dev` or similar) to load the new variables.

## 6. Test
1. Go to **Settings > Integrations** in the Centri web UI.
2. Click **Connect** on the Slack card.
3. You should be redirected to Slack to authorize the app.
