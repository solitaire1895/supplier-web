# Nexus AI assistant

The chat bubble on every `/dashboard` page. Answers stream from a FreeLLMAPI router
(free tiers of many AI providers behind one OpenAI-compatible API) that you host.

## Daily limits

Free 5, Explorateur 30, Importateur 100, Partenaire 300 messages per day, reset at
midnight Douala time. Change them in `lib/assistant.ts` (`ASSISTANT_DAILY_LIMITS`).
The rules the assistant follows (`SYSTEM_PROMPT`) are in the same file.

## Setup

1. **Database:** run `supabase/migrations/0022_assistant_usage.sql` in the Supabase SQL editor.
2. **Router on the VPS** (Docker required):
   ```bash
   curl -fsSL https://freellmapi.co/install.sh | bash   # read it first: https://freellmapi.co/install.sh
   ```
   It listens on `127.0.0.1:3001`. Put it behind HTTPS with a reverse proxy, for example Caddy:
   ```
   ai.nexusply.com {
     reverse_proxy 127.0.0.1:3001
   }
   ```
   Open the dashboard once (SSH tunnel: `ssh -L 3001:127.0.0.1:3001 <vps>`, then http://localhost:3001),
   create the admin account, add provider keys on the **Keys** page, and copy the unified key.
3. **Site settings** (Vercel or wherever the site runs), server-only:
   ```
   FREELLMAPI_URL=https://ai.nexusply.com
   FREELLMAPI_API_KEY=freellmapi-...
   FREELLMAPI_MODEL=auto
   ```
4. Redeploy, open `/dashboard`, click the red bubble.

## Notes

- Free provider tiers may keep or train on prompts. The chat tells users not to share
  passwords or bank details; mention the AI providers in `/privacy` too.
- When every provider is busy the user sees a friendly error and the message is not counted.
- Test: `npm test`.
