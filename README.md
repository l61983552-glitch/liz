# SHUSHU/TONG AI Identity Filter V3

This version removes the clothing inventory and demo passcode. It sends a real selfie and the selected Pink or Blue fashion design reference to OpenAI's image editing API to generate a *new* virtual fashion character.

## Upload to GitHub

- Upload `api/transform.js`, `public/index.html`, `public/references/pink.jpg`, `public/references/blue.jpg`, `package.json`, `vercel.json` into the ROOT of the existing `liz` repository (folders stay nested).
- You can leave an old root-level `index.html`; Vercel should serve `public/index.html` for this project structure. The old `/public/items/` pictures are no longer used.
- Commit changes; connected Vercel project automatically redeploys.

## Critical: Enable real AI

Open Vercel Dashboard → your project → Settings → Environment Variables.
Add `OPENAI_API_KEY` with your real OpenAI API secret. Leave it in Vercel only; NEVER paste it into GitHub code, a screenshot or a chat.
The obsolete `DEMO_PASSCODE` environment variable may be deleted.
Then go to Deployments → latest deployment → Redeploy so the setting is used.

API usage is billed separately from ChatGPT and may require billing/verification. If missing, the page will display `OPENAI_API_KEY is missing` and cannot transform, even if the selfie preview works.

## Privacy and cost

- Selfie is transmitted to the configured AI API when user taps Transform with the consent box checked.
- Avoid sharing the public link widely: since the passcode is removed, anyone who can reach the public website can trigger paid image generation. Protect the deployment using Vercel access controls and configure API budget/usage alerts before public sharing.
- One generated STILL image per attempt, not real-time 3D AR animation.
