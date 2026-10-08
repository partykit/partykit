/* eslint-disable no-undef */
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

async function fetchBlogEntries() {
  const url = "https://blog.partykit.io/rss.xml";
  const response = await fetch(url);
  const xml = await response.text();
  // same output shape as xml2json, which we used before: attributes as plain
  // properties, element text in "$t", and values kept as strings
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "$t",
    parseTagValue: false,
  });
  const data = parser.parse(xml);
  fs.writeFileSync(
    "src/blog.json",
    JSON.stringify(data.rss.channel.item.slice(0, 10), null, 2) + "\n",
  );
}

fetchBlogEntries().catch(console.error);
