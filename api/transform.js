import { readFileSync } from 'node:fs';

// Never put your real OPENAI_API_KEY in this file. Configure it in Vercel Settings.
const referenceFiles = {
  pink: new URL('../public/references/pink.jpg', import.meta.url),
  blue: new URL('../public/references/blue.jpg', import.meta.url),
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST is supported.' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is missing. In Vercel: Project → Settings → Environment Variables → add OPENAI_API_KEY, then Redeploy.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON request.' }); }
  }
  const { photo, look } = body || {};
  if (!['pink', 'blue'].includes(look) || typeof photo !== 'string' ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 2300000) {
    return res.status(400).json({ error: 'Invalid selfie. Please take or upload a smaller photo.' });
  }

  const pink = look === 'pink';
  const outfit = pink ? `PINK IDENTITY. Faithfully recreate the designer's ivory lace corset with intricate lace texture, voluminous dusty pink ballet ruffle skirt, black waist belt, sleek black high ponytail with long free-flowing hair, layered silver necklaces, off-white leg warmers, and metallic silver shoes. A dreamy gold-champagne illuminated stage, warm romantic theatrical lighting, sophisticated dark background.`
  : `BLUE IDENTITY. Faithfully recreate the designer's powder-blue gingham halter top, diagonal white ruffle detail, tiered blue gingham ruffled mini skirt, long flowing dark hair, silver star hair ornament and earrings, silver ballet flats and pale blue ribbons. Icy pearly light, soft silver-blue ornamental fantasy fashion-game atmosphere.`;

  const prompt = `Create a NEW SHUSHU/TONG fashion game identity portrait based on TWO images: IMAGE 1 = real visitor selfie, the ONLY reference for the visitor's facial identity and skin tone. IMAGE 2 = designer-approved fashion look and costume, ONLY reference for clothes and fantasy illustration style. Reimagine the individual from image 1 as a high-end Japanese-inspired 3D anime virtual character. Preserve their recognizable face shape, eyes, eyebrows, nose, lips, skin tone, and facial proportions as closely as possible in a stylized character; do not reuse the model face from image 2. Reproduce the silhouette, textiles, and accessories from image 2 carefully, with no unrelated wardrobe changes. ${outfit} Render ONE centered, large and visually striking fashion-game character on a beautiful ornate fantasy stage. Full-body or three-quarter fashion portrait with a sufficiently visible recognizable face. Fine hair strands, beautifully rendered fabrics, cinematic illumination, subtle glimmer. Vertical 2:3 composition. VERY IMPORTANT: NO right-hand clothing inventory, NO accessory panels, NO small tiles, NO mobile phone frame, NO phone bezel or notch, NO QR code, NO toolbars, NO watermarks, NO game stats. Make the entire image a clean, unified character portrait, not an interface screenshot. If brand text can be rendered legibly, use SHUSHU/TONG only. Do not copy the selfie photograph or simply show the designer image. Produce a newly generated personalized character. Adult fashion campaign, tasteful and non-sexual.`;

  try {
    const ref = readFileSync(referenceFiles[look]).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240000);
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-2.5-flare',
          images: [
            { image_url: photo },
            { image_url: `data:image/jpeg;base64,${ref}` }
          ],
          prompt,
          size: '1024x1536',
          quality: 'medium',
          output_format: 'jpeg',
          output_compression: 75,
          n: 1,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const apiMessage = data?.error?.message || '';
      console.error('OpenAI image API:', response.status, apiMessage);
      if (response.status === 401) return res.status(502).json({ error: 'OpenAI API key invalid. Check OPENAI_API_KEY in Vercel.' });
      if (response.status === 403) return res.status(502).json({ error: 'OpenAI API access denied. Check project permissions / image model access.' });
      if (response.status === 429) return res.status(502).json({ error: 'OpenAI API quota or rate limit exceeded. Check billing and usage limits.' });
      return res.status(502).json({ error: `AI generation failed (${response.status}): ${apiMessage.slice(0, 200) || 'Check Vercel function logs.'}` });
    }
    const image64 = data?.data?.[0]?.b64_json;
    if (!image64) return res.status(502).json({ error: 'AI returned no image. Check Vercel function logs.' });
    return res.status(200).json({ image: `data:image/jpeg;base64,${image64}` });
  } catch (error) {
    console.error('AI transformation error:', error);
    return res.status(500).json({ error: error?.name === 'AbortError' ? 'AI image generation timed out. Try again.' : 'AI server error. Check Vercel function logs.' });
  }
}
