import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const app = express();
app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function scrapeText(url) {
  try {
    const { data } = await axios.get(url, { timeout: 7000 });
    const $ = cheerio.load(data);
    const text = $('body').text();
    return text.replace(/\s+/g, ' ').slice(0, 10000); // limit to 10K chars
  } catch {
    return '';
  }
}

app.get('/summary', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain param' });

  const base = `https://${domain}`;
  const pages = [
    `${base}`,
    `${base}/about`,
    `https://en.wikipedia.org/wiki/${domain.split('.')[0]}`
  ];

  let combinedText = '';
  for (const page of pages) {
    const content = await scrapeText(page); 
    if (content.length > 500) {
      combinedText += `\n\nFrom ${page}:\n` + content;
    }
  }

  if (!combinedText) {
    return res.status(404).json({ error: 'No content found on website or Wikipedia.' });
  }

  try {
    const gpt = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a brand ethics and sustainability analyst."
      }, {
        role: "user",
        content: `
From the following company content, summarize the brand and analyze its ethical positioning. Extract mentions of sustainability, DEI, sourcing, labor, or environmental impact. Rate how transparent they seem (0-100). Be concise.

TEXT:
${combinedText}
        `.trim()
      }],
      temperature: 0.7
    });

    const reply = gpt.choices[0].message.content;
    res.json({ domain, summary: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GPT summarization failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ConsciousCart summary API running on port ${PORT}`);
});
