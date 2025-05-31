const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function scrapeICOStats() {
  const url = "https://icodrops.com/ico-stats/?page=1&paginate=10000";

  const { data } = await axios.get(url);
  const $ = cheerio.load(data.rendered_html);

  const rows = [];

  $("li.Tbl-Row").each((_, row) => {
    const $row = $(row);

    const project = {
      name: $row.find(".Cll-Project__name").text().trim() || null,
      ticker: $row.find(".Cll-Project__ticker").text().trim() || null,
      link: $row.find(".Cll-Avt").attr("href") ? `https://icodrops.com${$row.find(".Cll-Avt").attr("href")}` : null,
      price_24h: $row.find(".Tbl-Row__item--price-24h").text().trim().split(/\s+/)[0] || null,
      change_24h: $row.find(".Tbl-Row__item--price-24h").text().trim().split(/\s+/)[1] || null,
      volume_24h: $row.find(".Tbl-Row__item--volume-24h").text().trim() || null,
      fdv: $row.find(".Tbl-Row__item--fdv").text().trim() || null,
      market_cap: $row.find(".Tbl-Row__item--market-cap").text().trim() || null,
      funding_price: $row.find(".Tbl-Row__item--funding-price").text().trim() || null,
      roi: $row.find(".Tbl-Row__item--roi p").text().trim() || null,
      total_raised: $row.find(".Tbl-Row__item--total-raised").text().trim() || null,
      date: $row.find(".Tbl-Row__item--date").text().trim() || null
    };

    // Flatten investor names into individual columns
    const investors = [];
    $row.find(".Cell-Investors__stacked-images li").each((_, li) => {
      const name = $(li).attr("data-tooltip-text");
      if (name) investors.push(name.trim());
    });

    investors.forEach((inv, i) => {
      project[`investor_${i + 1}`] = inv;
    });

    rows.push(project);
  });

  // Collect all possible keys across rows for CSV headers
  const allKeys = Array.from(new Set(rows.flatMap(obj => Object.keys(obj))));

  // Construct CSV body safely
  const csvBody = rows.map(r =>
    allKeys.map(k => {
      const val = r[k];
      const safe = Array.isArray(val) ? val.join(", ") : String(val ?? "");
      return `"${safe.replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");

  const csvHeader = allKeys.join(",") + "\n";

  // Save the CSV to a file
  const outputPath = path.join(__dirname, "icostats.csv");
  fs.writeFileSync(outputPath, csvHeader + csvBody);
  console.log(`✅ Saved to ${outputPath}`);
}

scrapeICOStats().catch(console.error);
