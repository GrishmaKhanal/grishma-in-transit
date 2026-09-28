import type { Company, Post, Project, SiteSettings } from "@/db/schema";

// Starting content (from the Claude Design final draft). Used by `npm run db:seed`,
// and as a read-only fallback when DATABASE_URL is not configured.

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
  worksFor: "ODIN Mortgage & Tax",
  alumniOf: "Thapathali Engineering Campus, Tribhuvan University",
  email: "grishmakhanal48@gmail.com",
  socials: [
    { label: "GitHub", handle: "@GrishmaKhanal", url: gh },
    { label: "LinkedIn", handle: "in/Grishma-Khanal", url: "https://www.linkedin.com/in/Grishma-Khanal" },
  ],
  seoDescription:
    "Grishma Raj Khanal is a software engineer in Kathmandu building document pipelines, data-security tooling and API integrations in Python, TypeScript and Azure. Notes and articles on engineering.",

  heroEyebrow: "Software engineer · Kathmandu",
  heroHeadline: "I build the systems that move documents and data safely.",
  heroIntro:
    "Software engineer at ODIN Mortgage & Tax, previously Guardware Australia - working on document pipelines, data-security tooling and API integrations. I write here about the problems I solve along the way.",
  langs: ["Python", "JavaScript / TypeScript", "SQL"],
  homeWorkLabel: "Work, 2024 - now",
  homeOffClock:
    "When I'm not at a keyboard for work, I'm usually tweaking a Linux setup, watching or playing football, or reading tech news I'll later argue about.",

  writingIntro:
    "Working notes on problems I've had to solve - algorithms, pipelines, cloud plumbing. Numbered in the order they were written.",
  workIntro:
    "Most of what I've built lives inside companies - internal tools, pipelines and products. Here's where, when, and with what.",
  tinkeringIntro: "Personal and university projects - code on GitHub, not deployed.",

  aboutHeading: "Hi, I'm Grishma.",
  aboutBody: `I'm a software engineer from Kathmandu. I started at Guardware Australia in early 2024 on data-security products - debugging a legacy C++ app, tightening Microsoft Graph integrations, and eventually starting the Python work that became the core of their document parsing and data-discovery engine.

Since November 2025 I've been at ODIN Mortgage & Tax, building the plumbing that moves client documents around: event-driven ingestion on Azure, a portal for collecting documents and signatures, and browser tooling that takes the repetitive typing out of tax returns.

I write here mostly to get things straight in my own head. If a post helps someone else, even better.`,
  aboutPhoto: "/images/grishma.webp",
  aboutPhotoCaption: "Kathmandu, Nepal",
  now: [
    "Software engineer at ODIN Mortgage & Tax",
    "Building a tax-return autofill browser extension",
    "Writing more - next post in drafts",
  ],
  skills: [
    { k: "Languages", v: "Python, TypeScript, JavaScript, SQL" },
    { k: "Backend", v: "Django, NestJS, Node, Flask" },
    { k: "Cloud", v: "Azure Functions, Blob Storage, Service Bus, Entra ID" },
    { k: "Data", v: "PostgreSQL, MySQL, SQLite" },
    { k: "Also", v: "Browser extensions (MV3, WXT), Bash, Linux" },
  ],
  education: [
    { k: "B.E. Computer Engineering", v: "Thapathali Campus, Tribhuvan University · 2026" },
    { k: "+2 Science", v: "Nepal Mega College · 2019" },
  ],
  certificates: ["Web Application Technologies and Django", "Building Web Applications in Django"],
  offClock: [
    { k: "Linux", v: "Daily driver, endless dotfile tinkering." },
    { k: "Football", v: "Watching it, playing it, arguing about it." },
    { k: "Tech news", v: "Too many tabs open, always." },
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
    name: "ODIN Mortgage & Tax",
    span: "Nov 2025 - now",
    location: "Remote",
    siteUrl: "https://odinmortgage.com",
    siteLabel: "odinmortgage.com",
    summary:
      "Event-driven document ingestion, a client document & e-signature portal that replaced a SaaS product, and browser automation for tax returns.",
    stack: ["Python", "TypeScript", "PostgreSQL", "Azure"],
    sortOrder: 0,
    roles: [
      {
        title: "Software Engineer",
        period: "Nov 2025 - Present",
        duration: "11 mo",
        stack: ["Python", "TypeScript", "PostgreSQL", "Azure Functions", "Blob Storage", "Service Bus", "BullMQ", "Entra External ID", "WXT"],
        points: [
          "Built event-driven document ingestion on Azure Blob Storage and Service Bus, with BullMQ queues, duplicate-processing prevention and Google Drive sync.",
          "Delivered a client document-collection and e-signature portal replacing a SaaS product - Azure Functions backend, Static Web App frontend, passwordless OTP sign-in via Entra External ID, Annature signing.",
          "Started a WXT browser extension that autofills tax returns from CRM data, plus Python browser automation with LLM-based address parsing.",
        ],
      },
    ],
  }),
  company({
    id: 2,
    name: "Guardware Australia",
    span: "Feb 2024 - Nov 2025",
    location: "Remote",
    siteUrl: "https://guardware.com.au",
    siteLabel: "guardware.com.au",
    summary:
      "Data-security products - started the Python text-extraction initiative, then built the core processing engine behind data discovery.",
    stack: ["Python", "C++", "JavaScript", "MySQL", "Graph API"],
    sortOrder: 1,
    roles: [
      {
        title: "Intermediate Systems Engineer",
        period: "Jun 2025 - Nov 2025",
        duration: "5 mo",
        stack: ["Python", "MySQL", "Aho-Corasick", "OCR", "asyncio"],
        points: [
          "Designed and implemented the core processing unit of a Python application - Aho-Corasick string search and asynchronous tasks, built for performance.",
          "Engineered a rule evaluator that detects sensitive data patterns via regex / word matching, with context extraction.",
          "Built a parser extracting text from documents and images (OCR), including archive handling.",
        ],
      },
      {
        title: "Systems Engineer",
        period: "Feb 2024 - Jun 2025",
        duration: "1 yr 4 mo",
        stack: ["C++", "Python", "JavaScript", "MySQL", "Microsoft Graph", "VBA", "Manifest V3"],
        points: [
          "Started the Python initiative for text extraction, context identification and document parsing.",
          "Optimised Microsoft Graph API usage and reduced risk by enforcing least-privilege permissions; transformed Graph data into the server database.",
          "Extended legacy VBScript, C#, SQL, MS Access and Excel systems for reporting and analytics.",
          "Prototyped Manifest V3 extensions for secure file-transfer tracking; fixed slow startup in the legacy C++ product.",
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
  project({ companyId: 1, title: "Document ingestion pipeline", summary: "Event-driven intake from Blob Storage + Service Bus into queued processing and Drive sync.", tags: ["Azure", "BullMQ", "TS"] }),
  project({ companyId: 1, title: "Client document & e-sign portal", summary: "Passwordless portal for clients to upload documents and sign - replaced a paid SaaS tool.", tags: ["Azure Functions", "SWA"] }),
  project({ companyId: 1, title: "Tax-return autofill extension", summary: "Browser extension filling tax returns from CRM data, with LLM address parsing.", tags: ["WXT", "Python"] }),
  project({ companyId: 2, title: "Guardware INSIGHT", summary: "Data-security solution for monitoring and mitigating business risk.", tags: ["Python", "MySQL", "PHP"], liveUrl: "https://guardware.com.au", linkLabel: "Product" }),
  project({ companyId: 2, title: "Guardware DISCOVER", summary: "Data discovery - locates and classifies sensitive information (PII, PCI).", tags: ["Python", "MySQL", "SQLite"], liveUrl: "https://guardware.com.au", linkLabel: "Product" }),
  project({ title: "Supply Chain DLT", summary: "Decentralised ledger on Ethereum for transparent supply-chain tracking and asset ownership, with a React UI for transactions.", tags: ["Solidity", "React", "Node"], repoUrl: gh, status: "Not deployed" }),
  project({ title: "Browser Upload Monitor", summary: "Extension that monitors and blocks file uploads, logs email addresses and reports metadata to a Node server.", tags: ["JavaScript", "Node"], repoUrl: gh, status: "Not deployed" }),
  project({ title: "Library Management", summary: "Desktop app for books, members and late-return tracking.", tags: ["PyQt5", "SQLite"], repoUrl: gh, status: "Not deployed" }),
  project({ title: "URL Shortener", summary: "Generates short URLs and handles redirects.", tags: ["Flask"], repoUrl: gh, status: "Not deployed" }),
  project({ title: "Email Scraper", summary: "Script that extracts email addresses from websites.", tags: ["Python", "Selenium"], repoUrl: gh, status: "Not deployed" }),
  project({ title: "Construction supplier site", summary: "Static site showcasing a supplier’s products and services.", tags: ["HTML", "Bootstrap"], repoUrl: gh, status: "Not deployed" }),
];
