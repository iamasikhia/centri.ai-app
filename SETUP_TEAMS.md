# Microsoft Teams Integration Setup

To enable the Microsoft Teams integration, you need to register an application in the Microsoft Azure Portal.

## 1. Register App in Azure Portal

1. Go to the [Microsoft Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Click **"New registration"**.
3. **Name**: Enter `Centri.ai` (or your app name).
4. **Supported account types**: Select **"Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**.
5. **Redirect URI**:
    - Select **Web**.
    - Enter URL: `http://localhost:3001/integrations/microsoft_teams/callback`
    *(If using ngrok, replace `http://localhost:3001` with your ngrok URL)*

6. Click **Register**.

## 2. Configure Certificates & Secrets

1. In your new app's sidebar, go to **"Certificates & secrets"**.
2. Click **"New client secret"**.
3. Add a description (e.g., "Dev Secret") and expiration.
4. Click **Add**.
5. **Context**: Copy the **Value** (not the Secret ID) immediately. You won't see it again.

## 3. Configure API Permissions

1. Go to **"API Permissions"** in the sidebar.
2. Click **"Add a permission"** -> **"Microsoft Graph"** -> **"Delegated permissions"**.
3. Search for and check the following permissions:
    - `User.Read`
    - `Team.ReadBasic.All`
    - `Channel.ReadBasic.All`
    - `Chat.Read`
    - `offline_access`
4. Click **"Add permissions"**.

## 4. Update Environment Variables

Add the following to your `apps/api/.env` file:

```env
TEAMS_CLIENT_ID=your_application_client_id
TEAMS_CLIENT_SECRET=your_client_secret_value
```

- **TEAMS_CLIENT_ID**: Found on the "Overview" page as "Application (client) ID".
- **TEAMS_CLIENT_SECRET**: The value you copied in Step 2.
