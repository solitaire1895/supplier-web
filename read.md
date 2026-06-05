# Hosting Nexusply on Hostinger (via GitHub)

This guide explains how to deploy the Nexusply MVP on Hostinger using GitHub for easy updates and version control.

## Prerequisites

- A GitHub account and a new repository for this project.
- A Hostinger VPS or Node.js hosting plan with SSH access.
- Domain name pointed to your Hostinger server.

## Deployment Steps

### 1. Push Project to GitHub

Your code is now on GitHub. Whenever you make changes locally:

```bash
git add .
git commit -m "Your description"
git push origin main
```

### 2. Clone on Hostinger Server

Connect to your server via SSH and clone the repository:

```bash
# Connect to server
ssh -p 65002 u751309044@82.198.228.114

# Clone the repository
git clone https://github.com/solitaire1895/supplier-web.git ~/nexusply
cd ~/nexusply
```

### 3. Install Dependencies and Build

On the server, install the dependencies and generate the production build:

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory on the server and add your production values:

```bash
nano .env
```

Add the following (update with real values):
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `NEXTAUTH_URL` (e.g., `https://yourdomain.com`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 5. Start the Application with PM2

Use **PM2** to keep your application running in the background:

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the Next.js application
pm2 start npm --name "nexusply" -- start
```

### 6. Updating the App

Whenever you make changes locally:

1. **Locally:** `git push origin main`
2. **On Server:**
   ```bash
   cd ~/nexusply
   git pull origin main
   npm install
   npm run build
   pm2 restart nexusply
   ```

## Troubleshooting

- **Logs:** Check PM2 logs using `pm2 logs nexusply`.
- **Permissions:** If you get permission errors, ensure your SSH user has rights to the directory.
- **Port Conflict:** If port 3000 is taken, you can change it in `package.json` or by setting the `PORT` environment variable.
