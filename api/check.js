
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    keyConfigured: Boolean(
      process.env.OPENAI_API_KEY?.trim()
    ),
    environment: process.env.VERCEL_ENV || "unknown"
  });
}
