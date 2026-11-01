# SHUSHU/TONG | Identity Filter

This is a **real AI portrait transformation demo**, not a fake image-replacement filter.

- User chooses a Pink or Blue look (designer assets included under `public/references/`).
- User captures a front-facing selfie or uploads **a selfie** (not a character image).
- The Vercel backend sends the selfie and the selected design reference to the OpenAI Images Edit API.
- The user's facial features are used to generate a new anime-game avatar with the style and outfit from the design.
- User downloads the final image.

## Publish

1. Upload the whole extracted project to your GitHub repository, replacing the old `index.html`.
2. Visit https://vercel.com/new and import the GitHub repository (Framework Preset: Other; root directory: `./`).
3. In Vercel project Settings → Environment Variables add:
   - `OPENAI_API_KEY` — a *secret* OpenAI API key with sufficient image generation quota.
   - `DEMO_PASSCODE` — your private demo code for visitors to enter in the UI.
4. Deploy (or redeploy after changing environment variables) and open the Vercel HTTPS domain from your phone.
5. Select Pink/Blue, start camera, grant camera permission, check consent, enter the demo code, tap TRANSFORM.

**IMPORTANT:** GitHub Pages can host the front end, but cannot run `api/transform.js`. The GitHub Pages URL will not generate AI images. You must open the **Vercel** URL.

## Costs & privacy

- GitHub repository and Vercel Hobby may be free within their eligibility and limits; **OpenAI API image generation is billed separately** and needs API credits / billing, and may require organization verification.
- Never paste your API key in GitHub code, public README, or client HTML. Add the key only in Vercel Environment Variables.
- The server does not explicitly save selfie files, but selfie and reference are transmitted to OpenAI for image processing.
- `DEMO_PASSCODE` helps prevent casual misuse; it is *not* full production access control. For public launch, add authenticated accounts, user rate limits, quotas, and privacy policy.
- Result is **one AI-generated image per transformation**, not continuous video/real-time motion tracking. Fidelity may vary per generation, especially if the selfie does not reveal full-body information.

## Files

- `index.html`: full mobile camera / UI / result download app.
- `api/transform.js`: Vercel serverless AI image-edit request.
- `public/references/pink.jpg`: provided Pink design reference (cropped screenshot).
- `public/references/blue.jpg`: provided Blue design reference (cropped screenshot).
- `vercel.json`: image generation function timeout and reference inclusion.

## Development

Use `vercel dev` with `OPENAI_API_KEY` and `DEMO_PASSCODE` configured in a local uncommitted `.env` file, or just deploy from GitHub.
