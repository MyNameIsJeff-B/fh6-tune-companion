import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const automationRoot = path.join(root, "automation");
const snapshotsRoot = path.join(automationRoot, "snapshots");

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const compact = (value) => value.replace(/\s+/g, " ").trim();

export const hashValue = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const normaliseHtml = (html) => {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ");
  const selected = [];
  const pattern = /<(h1|h2|h3|h4|p|li|time)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of withoutNoise.matchAll(pattern)) {
    const text = compact(
      decodeEntities(match[2].replace(/<[^>]+>/g, " ").replace(/\u00a0/g, " ")),
    );
    if (text.length >= 3) selected.push(text);
  }
  return [...new Set(selected)].join("\n");
};

const extractHtmlStructure = (html) => {
  const text = normaliseHtml(html);
  const headings = [];
  for (const match of html.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)) {
    const heading = compact(decodeEntities(match[1].replace(/<[^>]+>/g, " ")));
    if (heading) headings.push(heading);
  }
  const updateLines = text
    .split("\n")
    .filter((line) => /last updated|updated on|published|version/i.test(line))
    .slice(0, 10);
  return {
    digest: hashValue(text),
    headings: [...new Set(headings)].slice(0, 50),
    updateLines,
  };
};

export const extractOfficialCars = (html) => {
  const text = normaliseHtml(html);
  const cars = [];
  const pattern =
    /\b((?:19|20)\d{2})\s+([A-Z0-9][^\n]{2,90}?)(?=(?:\n|Available|Earn|Car Pass|Festival|$))/g;
  for (const match of text.matchAll(pattern)) {
    const name = compact(match[2].replace(/[.!:,;]+$/, ""));
    if (
      /^(may|june|july|august|september|october|november|december)\b/i.test(name) ||
      /points?|pts|series|season/i.test(name)
    ) {
      continue;
    }
    const parts = name.split(" ");
    if (parts.length < 2) continue;
    cars.push({
      year: match[1],
      make: parts.shift(),
      model: parts.join(" "),
    });
  }
  return [...new Map(cars.map((car) => [`${car.year}|${car.make}|${car.model}`, car])).values()]
    .sort((a, b) => `${a.year}${a.make}${a.model}`.localeCompare(`${b.year}${b.make}${b.model}`));
};

const parseFeed = (xml, keywords, maxItems = 10) => {
  const items = [];
  const blocks = xml.match(/<(entry|item)\b[\s\S]*?<\/\1>/gi) ?? [];
  for (const block of blocks) {
    const title = compact(
      decodeEntities(
        (block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
          .replace(/<!\[CDATA\[|\]\]>/g, "")
          .replace(/<[^>]+>/g, " "),
      ),
    );
    if (!title) continue;
    const lowered = title.toLowerCase();
    if (keywords.length && !keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      continue;
    }
    const link =
      block.match(/<link\b[^>]*href=["']([^"']+)/i)?.[1] ??
      block.match(/<link\b[^>]*>([^<]+)/i)?.[1] ??
      "";
    const published =
      block.match(/<(published|updated|pubDate)\b[^>]*>([^<]+)/i)?.[2] ?? "";
    items.push({ title, link: decodeEntities(link), published });
  }
  return items.slice(0, maxItems);
};

export async function fetchText(url, options) {
  const attempts = (options.retryCount ?? 0) + 1;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": options.userAgent,
          Accept: options.accept ?? "text/html,application/xhtml+xml,application/xml",
        },
        signal: AbortSignal.timeout(options.timeoutMs ?? 20000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

const fetchSourceUrls = async (source, config) => {
  const urls = source.urls ?? [source.url];
  const values = [];
  for (const url of urls) {
    values.push(
      await fetchText(url, {
        retryCount: source.retryCount,
        userAgent: config.userAgent,
      }),
    );
  }
  return values;
};

const extractSource = async (source, config) => {
  if (source.kind === "github-state") {
    const state = JSON.parse(
      await fetchText(source.url, {
        userAgent: config.userAgent,
        accept: "application/vnd.github+json",
      }),
    );
    const commit = Array.isArray(state) ? state[0] : state;
    const dataText = await fetchText(source.dataUrl, {
      userAgent: config.userAgent,
      accept: "application/json",
    });
    const data = JSON.parse(dataText);
    return {
      content: {
        commit: commit?.sha ?? null,
        publishedAt:
          commit?.commit?.committer?.date ??
          commit?.published_at ??
          null,
        name: commit?.commit?.message ?? commit?.name ?? null,
        dataVersion: data.version ?? null,
        dataUpdated: data.updated ?? null,
        carCount: data.cars?.length ?? 0,
        dataHash: hashValue(data),
      },
      data,
    };
  }

  if (source.kind === "youtube-rss") {
    const page = await fetchText(source.url, { userAgent: config.userAgent });
    const channelId =
      page.match(/"channelId":"([^"]+)"/)?.[1] ??
      page.match(/<meta itemprop="channelId" content="([^"]+)"/)?.[1];
    if (!channelId) throw new Error("YouTube channelId niet gevonden");
    const feed = await fetchText(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { userAgent: config.userAgent },
    );
    return { content: parseFeed(feed, source.keywords ?? [], source.maxItems) };
  }

  const pages = await fetchSourceUrls(source, config);
  if (source.kind === "rss") {
    return {
      content: pages.flatMap((page) =>
        parseFeed(page, source.keywords ?? [], source.maxItems),
      ).slice(0, source.maxItems),
    };
  }
  if (source.kind === "official-news") {
    return { content: pages.flatMap(extractOfficialCars) };
  }
  if (source.kind === "publication-status") {
    const text = pages.map(normaliseHtml).join("\n").toLowerCase();
    const found = (source.keywords ?? []).some((keyword) =>
      text.includes(keyword.toLowerCase()),
    );
    return { content: { found, evidence: found ? source.keywords : [] } };
  }

  const content = pages.map(normaliseHtml).join("\n---\n");
  if (source.kind === "html-keywords") {
    const matches = config.physicsKeywords.filter((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase()),
    );
    return {
      content: {
        digest: hashValue(content),
        physicsKeywords: matches,
      },
    };
  }
  return {
    content: {
      digest: hashValue(content),
      pages: pages.map(extractHtmlStructure),
    },
  };
};

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
};

export const mergeCatalogRecords = (catalog, cars) => {
  const keys = new Set(
    catalog.cars.map((car) =>
      `${car.year}|${car.make}|${car.model}`.toLowerCase(),
    ),
  );
  const added = [];
  for (const car of cars) {
    const key = `${car.year}|${car.make}|${car.model}`.toLowerCase();
    if (keys.has(key)) continue;
    catalog.cars.push({
      ...car,
      dataStatus: "identity-only",
      provenance: ["forza-official-news"],
    });
    keys.add(key);
    added.push(car);
  }
  if (added.length) {
    catalog.version = Number(catalog.version ?? 0) + 1;
    catalog.cars.sort((a, b) =>
      `${a.make}|${a.model}|${a.year}`.localeCompare(
        `${b.make}|${b.model}|${b.year}`,
      ),
    );
  }
  return { catalog, added };
};

const mergeOfficialCars = async (cars, now) => {
  const file = path.join(automationRoot, "data", "catalog-base.json");
  const current = await readJson(file, { version: 1, cars: [] });
  const { catalog, added } = mergeCatalogRecords(current, cars);
  if (added.length) {
    catalog.updated = now.toISOString().slice(0, 10);
    await writeFile(file, `${JSON.stringify(catalog)}\n`, "utf8");
  }
  return added;
};

export async function runWatch({
  now = new Date(),
  dryRun = false,
  fixtureResults = {},
  sourceIds,
} = {}) {
  const config = JSON.parse(
    await readFile(path.join(automationRoot, "sources.json"), "utf8"),
  );
  await mkdir(snapshotsRoot, { recursive: true });
  const report = {
    schemaVersion: 1,
    checkedAt: now.toISOString(),
    dataUpdates: [],
    reviewRequired: [],
    signals: [],
    unreachable: [],
    physicsResearchRequired: false,
    snapshotChanges: 0,
  };

  for (const source of config.sources.filter(
    (candidate) => !sourceIds || sourceIds.includes(candidate.id),
  )) {
    const snapshotFile = path.join(snapshotsRoot, `${source.id}.json`);
    const previous = await readJson(snapshotFile, null);
    try {
      const result =
        Object.prototype.hasOwnProperty.call(fixtureResults, source.id)
          ? fixtureResults[source.id]
          : await extractSource(source, config);
      if (result instanceof Error) throw result;
      const snapshot = {
        sourceId: source.id,
        extractorVersion: 1,
        checkedAt: now.toISOString(),
        hash: hashValue(result.content),
        content: result.content,
      };
      const fixtureChanged =
        dryRun &&
        Object.prototype.hasOwnProperty.call(fixtureResults, source.id);
      const changed =
        fixtureChanged ||
        (previous !== null && previous.hash !== snapshot.hash);
      const initialised = previous === null;
      if (changed || initialised) report.snapshotChanges += 1;

      if (source.tier === "data-update" && changed) {
        if (source.id === "forza-official-news") {
          const added = dryRun
            ? mergeCatalogRecords({ version: 1, cars: [] }, result.content).added
            : await mergeOfficialCars(result.content, now);
          if (added.length) {
            report.dataUpdates.push({
              sourceId: source.id,
              summary: `${added.length} nieuwe officiële auto('s)`,
              records: added,
            });
          }
        } else if (source.id === "tunelab-releases" && result.data) {
          if (!dryRun) {
            await writeFile(
              path.join(automationRoot, "data", "tunelab-cars.json"),
              `${JSON.stringify(result.data, null, 2)}\n`,
              "utf8",
            );
          }
          report.dataUpdates.push({
            sourceId: source.id,
            summary: `TuneLab-data gewijzigd naar ${result.content.commit?.slice(0, 8) ?? result.content.dataVersion ?? "onbekende versie"}`,
          });
        }
      } else if (source.tier === "review-required" && changed) {
        const item = {
          sourceId: source.id,
          priority:
            source.priorityWhenFound &&
            result.content?.found
              ? source.priorityWhenFound
              : "normal",
          summary: source.detect,
        };
        report.reviewRequired.push(item);
        if (
          source.id === "forza-release-notes" &&
          result.content?.physicsKeywords?.length
        ) {
          report.physicsResearchRequired = true;
          item.physicsKeywords = result.content.physicsKeywords;
        }
      } else if (source.tier === "signal" && changed) {
        const previousKeys = new Set(
          (previous?.content ?? []).map((item) => item.link || item.title),
        );
        const newItems = (result.content ?? []).filter(
          (item) => !previousKeys.has(item.link || item.title),
        );
        if (newItems.length) {
          report.signals.push({
            sourceId: source.id,
            items: newItems.slice(0, source.maxItems ?? 10),
          });
        }
      }

      if (!dryRun) {
        await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`);
      }
    } catch (error) {
      report.unreachable.push({
        sourceId: source.id,
        expected: Boolean(source.knownFlaky),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!dryRun) {
    await writeFile(
      path.join(automationRoot, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
  }
  return report;
}

export function renderIssue(report) {
  const lines = [
    "# Wekelijkse FH6-onderhoudscontrole",
    "",
    `Gecontroleerd: ${report.checkedAt}`,
  ];
  if (report.physicsResearchRequired) {
    lines.push(
      "",
      "## Actie vereist: start extra researchrun",
      "",
      "**Een release note raakt mogelijk handling, tires, PI, drivetrain of physics. Start handmatig een extra Codex-researchrun en hercontroleer de claims in `COMMUNITY_META_NOTES.md`.**",
    );
  }
  const sections = [
    ["Data-updates", report.dataUpdates],
    ["Inhoudelijke review", report.reviewRequired],
    ["Nieuwe signalen", report.signals],
    ["Handmatige controle nodig", report.unreachable],
  ];
  for (const [title, items] of sections) {
    if (!items.length) continue;
    lines.push("", `## ${title}`);
    for (const item of items) {
      if (item.items) {
        lines.push(`- **${item.sourceId}**`);
        for (const signal of item.items) {
          lines.push(`  - [${signal.title}](${signal.link})`);
        }
      } else {
        lines.push(`- **${item.sourceId}**: ${item.summary ?? item.error}`);
      }
    }
  }
  lines.push(
    "",
    "Overweeg een nieuwe researchronde als er meer dan zes weken geen is geweest.",
    "",
    "@codex",
  );
  return `${lines.join("\n")}\n`;
}
