import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIResponse(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    return completion.choices[0].message.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "An error occurred while processing your request.";
  }
}
