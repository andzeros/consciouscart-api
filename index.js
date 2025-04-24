
import express from 'express';
import cors from 'cors';
import whois from 'whois';
import { promisify } from 'util';
import axios from 'axios';

const whoisAsync = promisify(whois.lookup);

const app = express();
app.use(cors());

app.get('/company-info', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain param' });

  try {
    const rawWhois = await whoisAsync(domain);
    const countryMatch = rawWhois.match(/Country:\s*([^\n]+)/i);
    const orgMatch = rawWhois.match(/OrgName:\s*([^\n]+)/i);
    const country = countryMatch ? countryMatch[1] : "Unknown";
    const org = orgMatch ? orgMatch[1] : "Unknown Organization";

    const openData = await axios.get(`https://api.opencorporates.com/companies/search?q=${domain}`);
    const company = openData?.data?.results?.companies?.[0]?.company || {};

    res.json({
      domain,
      origin: country,
      organization: org,
      founder: company?.officers?.[0]?.name || "Unknown",
      founderLink: company?.officers?.[0]?.opencorporates_url || null,
      ownership: company?.company_type || "Unknown",
      certifications: [],
      dei: "No DEI data yet",
      carbon: "Est. 5.2 kg CO₂",
      water: "Est. 1300L",
      labor: "No known violations",
      score: 50
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ConsciousCart API running on port ${PORT}`);
});
