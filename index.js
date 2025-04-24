
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

app.get('/company-info', async (req, res) => {
  const domain = req.query.domain;
  const cleanDomain = domain.replace(/^www\\./, '');

  if (!domain) return res.status(400).json({ error: 'Missing domain param' });

  try {
    const openData = await axios.get(
  `https://api.opencorporates.com/companies/search?q=${cleanDomain}`
);
    const company = openData?.data?.results?.companies?.[0]?.company || {};

    res.json({
      domain,
      organization: company.name || "Unknown Company",
      jurisdiction: company.jurisdiction_code || "Unknown Country",
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
