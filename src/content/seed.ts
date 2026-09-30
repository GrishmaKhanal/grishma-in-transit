import type { Company, Post, Project, SiteSettings } from "@/db/schema";

// Starter content. Used by `npm run db:seed` and as a read-only fallback when DATABASE_URL
// is not configured. Deliberately generic: the repo is public, real content lives in the database.

const gh = "https://github.com/GrishmaKhanal";

export const seedSettings: SiteSettings = {
  name: "Grishma Raj Khanal",
  monogram: "GK",
  role: "Software Engineer",
  location: "Kathmandu",
  country: "Nepal",
  countryCode: "NP",
  timezone: "Asia/Kathmandu",
  tzLabel: "NPT (UTC+5:45)",
  worksFor: "",
  alumniOf: "",
  email: "hello@example.com",
  socials: [
    { label: "GitHub", handle: "@GrishmaKhanal", url: gh },
    { label: "LinkedIn", handle: "in/Grishma-Khanal", url: "https://www.linkedin.com/in/Grishma-Khanal" },
  ],
  seoDescription:
    "Grishma Raj Khanal is a software engineer writing about backend systems, data pipelines and the problems solved along the way.",

  heroEyebrow: "Software engineer · Kathmandu",
  heroHeadline: "I build the systems that move documents and data safely.",
  heroIntro:
    "Software engineer working on backend services, data pipelines and API integrations. I write here about the problems I solve along the way.",
  langs: ["Python", "JavaScript / TypeScript", "SQL"],
  homeWorkLabel: "Work",
  homeOffClock:
    "Away from work I read, walk, and keep at least one side project half-finished at all times.",

  writingIntro:
    "Working notes on problems I've had to solve - algorithms, pipelines, cloud plumbing. Numbered in the order they were written.",
  workIntro:
    "Most of what I've built lives inside companies - internal tools, pipelines and products. Here's where, when, and with what.",
  tinkeringIntro: "Personal projects - small, unfinished, fun.",

  aboutHeading: "Hi, I'm Grishma.",
  aboutBody: `I'm a software engineer who likes the unglamorous middle of systems: queues, pipelines, and the glue between APIs.

I write here mostly to get things straight in my own head. If a post helps someone else, even better.

_This is starter content. Edit it in the admin under Site content._`,
  aboutPhoto: "",
  aboutPhotoCaption: "",
  now: ["Writing more - next post in drafts"],
  skills: [
    { k: "Languages", v: "Python, TypeScript, JavaScript, SQL" },
    { k: "Backend", v: "Node, Django, Flask" },
    { k: "Cloud", v: "Serverless functions, object storage, message queues" },
    { k: "Data", v: "PostgreSQL, SQLite" },
  ],
  education: [{ k: "B.Sc. Computer Science", v: "Example University · 2020" }],
  certificates: ["Example certificate in web development"],
  offClock: [
    { k: "Reading", v: "Mostly fiction, some systems papers." },
    { k: "Walking", v: "Long ones, no headphones." },
    { k: "Side projects", v: "Started often, finished sometimes." },
  ],

  contactHeading: "Say hello.",
  contactIntro:
    "For engineering roles, collaborations, or a question about something I wrote. Email is the quickest way to reach me.",
};

const stringMatching = `Searching for words or patterns in text is everywhere, from search engine to security tools hunting for sensitive data, to you searching in webpage or files with \`Ctrl + F\`.

When the search space is small, the approach used almost does not matter. Now, imagine the search space is large i.e. **large documents** or **multiple patterns at once**, then a single search scan can take minutes or even hours depending on the approach used. The choice of faster and better algorithm start to matter.

In this post we explore string matching algorithms, starting simple and building to the **Aho-Corasick algorithm**.

## Method 1: The Naive Approach - Loop

The most simplest way to search for multiple patterns is to loop over each keyword and check whether it exists in the text. In Python, we can use \`in\` operator or \`str.find()\`. We scan the text from left to right until it reaches the end.

\`\`\`python
def naive_search(text, keywords):
    matches = []
    for keyword in keywords:
        if keyword in text:
            start = text.find(keyword)
            matches.append((keyword, start))
    return matches
\`\`\`

**The Pros:** \`Simplicity\`, \`Fast enough for short texts and small keyword lists\`

**The Problem:** \`Worst Time Complexity: O(n*m)\`

As your keyword list grows to thousands of entries, the method slows down significantly. Because for every keyword, you have to re-scan the entire document from start to finish.

## Method 2: Regex with Alternation

A common improvement is to combine all keywords into a single regular expression using alternation (|). This allows the regex engine to scan the text in one pass.

\`\`\`python
import re
def regex_search(text, keywords):
    pattern = '|'.join(re.escape(kw) for kw in keywords)
    regex = re.compile(pattern)
    return [(m.group(), m.start()) for m in regex.finditer(text)]
\`\`\`

**The Pros:** \`Single pass over text\`, \`Often faster than naive loops\`, \`Uses Python's optimized regex engine\`

**The Problem:** \`Complex regex becomes hard to maintain\`, \`Performance degrades with many patterns\`

While this method works well for moderate keyword sets, it becomes fragile and inefficient when patterns number in the thousands.

## Method 3: Aho-Corasick Algorithm

The Aho–Corasick algorithm, introduced by Alfred V. Aho and Margaret J. Corasick in 1975, is designed specifically for multi-pattern string matching. Unlike previous approaches, it matches all keywords simultaneously in a single pass.

![An Aho-Corasick automaton](/assets/An-Aho-Corasick-automato.jpg)

#### How it works:

1. **Build a trie** - All keywords are inserted into a trie (prefix tree), where each edge represents a character and terminal nodes mark complete words.
2. **Add failure links** - Similar to the KMP algorithm, failure links allow the automaton to jump to the longest valid suffix when a mismatch occurs.
3. **Add output links** - These links make it possible to report multiple matches efficiently when one keyword is a suffix of another.
4. **Scan the text** - The text is processed character by character while traversing the automaton. Matches are emitted instantly when reached.

**Time Complexity**: Scanning takes \`O(n + m)\` time (n = text length, m = matches). This performance is independent of the number of keywords.

\`\`\`python
import ahocorasick

def aho_corasick_search(text, keywords):
    A = ahocorasick.Automaton()

    for idx, keyword in enumerate(keywords):
        A.add_word(keyword.lower(), keyword)
    A.make_automaton()

    matches = []
    for end_index, keyword in A.iter(text.lower()):
        start_index = end_index - len(keyword) + 1
        matches.append((keyword, start_index))
    return matches
\`\`\`

**The Pros:** \`Extremely fast for large keywords sets\`, \`Single pass over the text\`, \`low memory consumptions\`

**Real-world use:** \`Virus scanners\`, \`Data Loss Prevention (DLP)\`, \`search engines\`, \`DNA pattern search\`

## Final Thoughts

If you're searching for just a handful of keywords, simple methods are often enough. But as soon as scale enters the picture - large documents, massive keyword lists, or real-time scanning - specialized algorithms like Aho–Corasick become helpful.
`;

const now = new Date("2026-01-01T00:00:00Z");

export const seedPosts: Post[] = [
  {
    id: 1,
    slug: "001-multi-string-match-python",
    kind: "blog",
    number: 1,
    title: "Multi-string matching in Python",
    subtitle: "Getting Started With Multi-Pattern String Matching in Python",
    excerpt:
      "Searching a document for thousands of patterns at once - why the naive loop breaks down, and how Aho-Corasick does it in a single pass.",
    content: stringMatching,
    tags: ["Python", "Algorithms", "Aho-Corasick", "DLP"],
    coverImage: "/assets/An-Aho-Corasick-automato.jpg",
    seoTitle: null,
    seoDescription: null,
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

const company = (c: Omit<Company, "createdAt" | "updatedAt" | "published">): Company => ({
  ...c,
  published: true,
  createdAt: now,
  updatedAt: now,
});

export const seedCompanies: Company[] = [
  company({
    id: 1,
    name: "Harbor Metrics",
    span: "2025 - now",
    location: "Remote",
    siteUrl: "https://harbor-metrics.example.com",
    siteLabel: "harbor-metrics.example.com",
    summary: "Event-driven ingestion, a customer upload portal and the small tools that keep an analytics product running.",
    stack: ["Python", "TypeScript", "PostgreSQL"],
    sortOrder: 0,
    roles: [
      {
        title: "Software Engineer",
        period: "2025 - Present",
        duration: "1 yr",
        stack: ["Python", "TypeScript", "PostgreSQL", "Queues", "Serverless"],
        points: [
          "Built queue-based ingestion with retries and duplicate protection.",
          "Delivered a portal for customers to upload files and track their status.",
          "Automated a weekly reporting task that used to take an afternoon.",
        ],
      },
    ],
  }),
  company({
    id: 2,
    name: "Pinecrest Software",
    span: "2023 - 2025",
    location: "Remote",
    siteUrl: "https://pinecrest.example.com",
    siteLabel: "pinecrest.example.com",
    summary: "Search and document tooling: text extraction, pattern matching and the services around them.",
    stack: ["Python", "C++", "MySQL"],
    sortOrder: 1,
    roles: [
      {
        title: "Systems Engineer",
        period: "2024 - 2025",
        duration: "1 yr",
        stack: ["Python", "MySQL", "asyncio"],
        points: [
          "Built the matching engine behind document search, using Aho-Corasick.",
          "Wrote a parser for text in documents, images and archives.",
        ],
      },
      {
        title: "Junior Engineer",
        period: "2023 - 2024",
        duration: "1 yr",
        stack: ["C++", "Python", "JavaScript"],
        points: [
          "Fixed slow startup in a legacy desktop app.",
          "Maintained reporting scripts and internal dashboards.",
        ],
      },
    ],
  }),
];

let pid = 0;
const project = (p: Partial<Project> & { title: string; summary: string; tags: string[] }): Project => ({
  id: ++pid,
  companyId: null,
  liveUrl: null,
  linkLabel: null,
  repoUrl: null,
  status: null,
  sortOrder: pid,
  published: true,
  createdAt: now,
  updatedAt: now,
  ...p,
});

export const seedProjects: Project[] = [
  project({ companyId: 1, title: "Ingestion pipeline", summary: "Files land in storage, get queued, processed once and synced onward.", tags: ["Python", "Queues"] }),
  project({ companyId: 1, title: "Customer upload portal", summary: "Passwordless portal where customers upload files and follow their progress.", tags: ["TypeScript", "Serverless"] }),
  project({ companyId: 1, title: "Report automation", summary: "Scheduled job that builds the weekly report and emails it.", tags: ["Python"] }),
  project({ companyId: 2, title: "Document search engine", summary: "Finds thousands of patterns in large documents in a single pass.", tags: ["Python", "Aho-Corasick"], liveUrl: "https://pinecrest.example.com/search", linkLabel: "Product" }),
  project({ companyId: 2, title: "Text extraction service", summary: "Pulls text out of PDFs, images and archives for indexing.", tags: ["Python", "OCR"], liveUrl: "https://pinecrest.example.com/extract", linkLabel: "Product" }),
  project({ title: "Link shortener", summary: "Short URLs with click counts.", tags: ["Flask", "SQLite"], repoUrl: "https://git.example.com/link-shortener", status: "Not deployed" }),
  project({ title: "Habit tracker", summary: "Terminal app for daily streaks.", tags: ["Python"], repoUrl: "https://git.example.com/habits", status: "Not deployed" }),
  project({ title: "Chess clock", summary: "Browser chess clock with increments.", tags: ["JavaScript"], repoUrl: "https://git.example.com/chess-clock", status: "Not deployed" }),
  project({ title: "Recipe scaler", summary: "Scales a recipe to any number of servings, units included.", tags: ["TypeScript"], repoUrl: "https://git.example.com/recipe-scaler", status: "Not deployed" }),
];
