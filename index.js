
import express from 'express';
import cors from 'cors';
import whois from 'whois-json';
import axios from 'axios';

const app = express();
app.use(cors());

app.get('/company-info', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain param' });

  try {
    const whoisData = await whois(domain);
    const country = whoisData.country || "Unknown";
    const org = whoisData.org || "Unknown Organization";

    // Placeholder for OpenCorporates API (use your own API key if required)
    const openCorpUrl = `https://api.opencorporates.com/companies/search?q=${domain}`;
    const openData = await axios.get(openCorpUrl);
    const company = openData?.data?.results?.companies?.[0]?.company || {};

    const result = {
      domain,
      origin: country,
      organization: org,
      founder: company?.officers?.[0]?.name || "Unknown",
      founderLink: company?.officers?.[0]?.opencorporates_url || null,
      ownership: company?.company_type || "Unknown",
      certifications: [], // to be filled later with scraping/API
      dei: "No DEI data yet", // placeholder
      carbon: "Est. 5.2 kg CO2", // dummy
      water: "Est. 1300L", // dummy
      labor: "No known violations", // placeholder
      score: 50 // placeholder
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching company info' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ConsciousCart API running on port ${PORT}`);
});
