import { readFileSync } from 'node:fs';

// Vercel serverless function. No browser code can read the API key.
const referenceFiles = {
  pink: new URL('../public/references/pink.jpg', import.meta.url),
  blue: new URL('../public/references/blue.jpg', import.meta.url),
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.OPENAI_API_KEY || !process.env.DEMO_PASSCODE) {
    return res.status(503).json({ error: 'Set OPENAI_API_KEY and DEMO_PASSCODE in Vercel environment variables.' });
  }
  // Demo-only protection. For public launch, add proper auth and rate limiting.
  if (req.headers['x-demo-passcode'] !== process.env.DEMO_PASSCODE) {
    return res.status(401).json({ error: 'Wrong demo passcode.' });
  }
  const { photo, look } = req.body || {};
  if (!['pink', 'blue'].includes(look) || typeof photo !== 'string' ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 2300000) {
    return res.status(400).json({ error: 'Invalid selfie or style. Please take another photo.' });
  }
  const stylePrompt = look === 'pink' ? `
IDENTITY: PINK BALLET REBELLION.
Wardrobe from reference image 2: ivory-lace fitted corset with visible lace detailing,
soft dusty-pink layered voluminous tutu miniskirt, distinctive black belt,
black sleek high ponytail with long free-flowing hair, silver crossed necklaces,
slouchy white leg warmers, metallic silver ballet-inspired heeled shoes.
Scene: black-to-gold dreamy fashion game lighting, ornate champagne-gold glowing inventory
frames on the RIGHT, stage pedestal, pale pink accessory previews, shimmering romantic mood.
` : `
IDENTITY: BLUE DAYDREAM.
Wardrobe from reference image 2: pale powder-blue gingham halter top,
asymmetric white ruffle peplum, tiered blue gingham ruffled miniskirt,
long flowing dark hair with delicate silver star hair clip and earrings,
shiny silver ballet flats with dainty blue ribbon ankle ties.
Scene: icy periwinkle dreamy game world, silver pearly and white lace ornamentation,
blue floating flowers and bows, dreamy silver-blue inventory cards on the RIGHT.
`;
  const prompt = `
You are creating a personalized SHUSHU/TONG virtual identity transformation for a fashion campaign.
There are exactly TWO reference images:
IMAGE 1 = an actual camera selfie of the customer. THIS is the only source of identity.
IMAGE 2 = the designer's approved SHUSHU/TONG game visual and clothing art direction.
Generate one brand-new PORTRAIT 9:16-ish illustrated game avatar image.

CRITICAL: Reimagine the person in IMAGE 1 as a stylized, premium, detailed 3D Japanese-anime fashion game character (not photoreal). Preserve the customer's unique and recognizable facial identity: eye shape, eyebrow placement, nose, mouth proportions, jawline, face shape, skin tone, and visible hair color. Keep them recognizable and do NOT copy the model face from IMAGE 2. Do not merely return or paste IMAGE 2. This must be a truly personalized fresh character of the customer in the specified costume and game styling.

${stylePrompt}

IMAGE 2 is the precise visual guide for wardrobe, silhouette, style, fabric, layout, fantasy lighting and accessory inventory. Preserve its clothing details closely rather than inventing unrelated designs. Show the transformed customer as the main virtual model, from mid-thigh to full body, with face large enough to recognize. Add rich high-end fantasy wardrobe selection screen layout inspired by IMAGE 2, with a slim vertical right-side inventory of separate fashion items. The scene should be a cohesive actual game screenshot with opulent fashion campaign art direction, pearly illumination, high detail, refined fabric texture and lovely soft shadows.
Avoid phone outline, phone bezel, notches, OS status bars, QR codes, watermarks, and logos of other brands. Show brand text only if clean and legible: SHUSHU/TONG. No TEKKEN or BRATZ references. Adult fashion avatar. Do not sexualize. Render a single completed polished vertical image.
`;
  try {
    const referenceBase64 = readFileSync(referenceFiles[look]).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240000);
    let apiResponse;
    try {
      apiResponse = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-image-2.5-flare',
          images: [ { image_url: photo }, { image_url: `data:image/jpeg;base64,${referenceBase64}` } ],
          prompt, size: '1024x1536', quality: 'medium', output_format: 'jpeg', output_compression: 72, n: 1
        }),
      });
    } finally { clearTimeout(timeout); }
    const data = await apiResponse.json().catch(() => null);
    if (!apiResponse.ok) {
      const reason = data?.error?.message || `AI API error ${apiResponse.status}`;
      console.error('Image transformation failed:', apiResponse.status, reason);
      return res.status(502).json({ error: apiResponse.status === 429 ? 'AI rate limit or quota reached. Check API billing.' : reason.slice(0, 250) });
    }
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: 'AI did not return an image.' });
    return res.status(200).json({ image: `data:image/jpeg;base64,${b64}` });
  } catch (err) {
    console.error('Transformation exception:', err);
    return res.status(500).json({ error: err.name === 'AbortError' ? 'AI generation timed out. Try again.' : 'Server error. Check Vercel function logs.' });
  }
}
