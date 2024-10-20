// pages/api/groq-chat.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt } = req.body;

  try {
    const groqResponse = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer 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`, 
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Update model ID to use the correct one
        messages: [
          { role: 'system', content: 'You are a helpful drawing tutor.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100, // You can adjust the token limit as needed
      }),
    });

    const data = await groqResponse.json();

    res.status(200).json({ message: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Error interacting with Groq API' });
  }
}