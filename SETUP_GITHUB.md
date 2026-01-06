# GitHub Integration Setup Guide

## Step 1: Create OAuth App in GitHub
1.  Log in to GitHub and go to **Settings**.
2.  Scroll down to **Developer settings** (bottom left).
3.  Select **OAuth Apps** -> **New OAuth App**.
4.  Fill in the details:
    *   **Application name**: Centri AI (Local)
    *   **Homepage URL**: `http://localhost:3000`
    *   **Authorization callback URL**: 
        ```
        http://localhost:3001/integrations/github/callback
        ```
5.  Click **Register application**.

## Step 2: Get Credentials
1.  On the app page, copy the **Client ID**.
2.  Click **Generate a new client secret** and copy the **Client Secret**.

## Step 3: Configure Environment
1.  Open `apps/api/.env`.
2.  Add your credentials:
    ```env
    GITHUB_CLIENT_ID=your_client_id_here
    GITHUB_CLIENT_SECRET=your_client_secret_here
    ```
    (Ensure `API_LOCAL_URL=http://localhost:3001` is still set).

## Step 4: Restart Backend
Restart the API to load the new variables:
```bash
# In apps/api
npm run start:dev
```

## Step 5: Connect
1.  Go to Dashboard **Settings > Integrations**.
2.  Click **Connect** on GitHub.
