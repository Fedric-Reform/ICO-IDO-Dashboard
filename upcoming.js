const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function scrapeICOStats() {
  const url = "https://icodrops.com/category/upcoming-ico/?page=1&paginate=10000";

  // Fetch HTML
  const { data } = await axios.get(url);
  const $ = cheerio.load(data.rendered_html);

  const rows = [];

  $("li.Tbl-Row").each((_, row) => {
    const $row = $(row);

    const project = {
      name: $row.find(".Cll-Project__name").text().trim() || null,
      ticker: $row.find(".Cll-Project__ticker").text().trim() || null,
      image: $row.find(".Cll-Avt img").attr("data-src") || null,
      link: $row.find(".Cll-Avt").attr("href") ? `https://icodrops.com${$row.find(".Cll-Avt").attr("href")}` : null,
      round: $row.find(".Tbl-Row__item--round").text().trim() || null,
      total_raised: $row.find(".Tbl-Row__item--raised").text().trim() || null,
      pre_valuation: $row.find(".Tbl-Row__item--pre-valuation").text().trim() || null,
      categories: $row.find(".Tbl-Row__item--categories").text().trim() || null,
      date: $row.find(".Tbl-Row__item--date").text().trim() || null,
      ecosystem: $row.find(".Tbl-Row__item--ecosystem").text().trim() || null
    };

    // Flatten investor names to individual columns
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

  // Determine all unique keys for CSV headers
  const allKeys = Array.from(new Set(rows.flatMap(obj => Object.keys(obj))));

  // Create CSV
  const csvHeader = allKeys.join(",") + "\n";
  const csvBody = rows.map(r =>
    allKeys.map(k => `"${(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  // Save to file
  const outputPath = path.join(__dirname, "upcoming.csv");
  fs.writeFileSync(outputPath, csvHeader + csvBody);
  console.log(`✅ Saved to ${outputPath}`);
}

scrapeICOStats().catch(console.error);
