/* eslint-disable no-undef */
import xml2json from "xml2json";
import fs from "fs";

async function fetchBlogEntries() {
  const url = "https://blog.partykit.io/rss.xml";
  const response = await fetch(url);
  const xml = await response.text();
  const json = xml2json.toJson(xml);
  const data = JSON.parse(json);
  fs.writeFileSync(
    "src/blog.json",
    JSON.stringify(data.rss.channel.item.slice(0, 10), null, 2) + "\n",
  );
}

fetchBlogEntries().catch(console.error);
