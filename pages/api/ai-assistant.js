import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message, videoInfo } = req.body;
      
      const contextPrompt = `You are an AI assistant for a video streaming platform. The user is currently watching "${videoInfo.title}" (${videoInfo.type})${videoInfo.episode ? ', Episode: ' + videoInfo.episode : ''}${videoInfo.season ? ', ' + videoInfo.season : ''} at ${formatTime(videoInfo.currentTime)} out of ${formatTime(videoInfo.duration)}. Please provide information or answer questions in the context of this video. User's message: ${message}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: contextPrompt }, { role: "user", content: message }],
        max_tokens: 150
      });
      
      res.status(200).json({ reply: completion.choices[0].message.content.trim() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
