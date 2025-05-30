const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeICOStats() {
  const url = "https://icodrops.com/ico-stats/?page=1&paginate=10000";

  const { data } = await axios.get(url);
  const $ = cheerio.load(data.rendered_html);

  const projects = [];

  $("li.Tbl-Row").each((_, row) => {
    const $row = $(row);
    const project = {};

    project.name = $row.find(".Cll-Project__name").text().trim() || null;
    project.ticker = $row.find(".Cll-Project__ticker").text().trim() || null;

    const href = $row.find(".Cll-Avt").attr("href");
    project.link = href ? `https://icodrops.com${href}` : null;

    const priceParts = $row.find(".Tbl-Row__item--price-24h").text().trim().split(/\s+/);
    project.price_24h = priceParts[0] || null;
    project.change_24h = priceParts[1] || null;

    project.volume_24h = $row.find(".Tbl-Row__item--volume-24h").text().trim() || null;
    project.fdv = $row.find(".Tbl-Row__item--fdv").text().trim() || null;
    project.market_cap = $row.find(".Tbl-Row__item--market-cap").text().trim() || null;

    const investors = [];
    $row.find(".Cell-Investors__stacked-images li").each((_, li) => {
      const name = $(li).attr("data-tooltip-text");
      if (name) investors.push(name.trim());
    });

    investors.forEach((inv, i) => {
      project[`investor_${i + 1}`] = inv;
	});

    project.investors = investors;

    project.funding_price = $row.find(".Tbl-Row__item--funding-price").text().trim() || null;
    project.roi = $row.find(".Tbl-Row__item--roi p").text().trim() || null;
    project.total_raised = $row.find(".Tbl-Row__item--total-raised").text().trim() || null;
    project.date = $row.find(".Tbl-Row__item--date").text().trim() || null;

    projects.push(project);
  });
  // Determine all unique keys for CSV headers
  const allKeys = Array.from(new Set(rows.flatMap(obj => Object.keys(obj))));

  // Create CSV
  const csvHeader = allKeys.join(",") + "\n";
  const csvBody = rows.map(r =>
    allKeys.map(k => `"${(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  // Save to file
  const outputPath = path.join(__dirname, "icostats.csv");
  fs.writeFileSync(outputPath, csvHeader + csvBody);
  console.log(`✅ Saved to ${outputPath}`);
}


  console.log(JSON.stringify(projects, null, 2));
}

scrapeICOStats().catch(console.error);
