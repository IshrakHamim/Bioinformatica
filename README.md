# Bioinformatica

An interactive, gamified study site for bioinformatics. It turns the **CSE443 Bioinformatics** course (BRAC University, CSE department) into lessons with live algorithm widgets, quizzes, spaced-repetition flashcards, mind maps, a concept knowledge graph, mini-games built into the lessons, practice problems with worked solutions, and a state-of-the-art track (AlphaFold, protein design, genomic foundation models). A track for the biotechnology department's course is scaffolded and ready to fill.

Written for a beginner graduate student with a CS background: every biological idea is introduced from scratch, and every algorithm can be stepped through visually.

## What's inside

| | |
|---|---|
| **20 modules** | 3 foundations (math, algorithms, data/tools) · 14 course lectures L01–L15 · 3 frontiers |
| **53 interactive widgets** | growth-rate race, animated hash map, binary search, DP table fill, Fibonacci recursion tree, BFS vs DFS, Hierholzer's algorithm, local search with restarts, skew diagrams, Gibbs sampler race, de Bruijn graph + Euler path animation, Illumina SBS simulator, Boyer-Moore stepper, k-mer index, k-means / soft k-means / hierarchical clustering, PCA, in-browser t-SNE, NW/SW DP tables, UPGMA / NJ / Fitch, Viterbi & Forward tables, casino HMM, logistic regression with class weights, network centralities, scale-free robustness, Girvan–Newman, a live AlphaFold DB 3D viewer… |
| **Practice** | a quiz and worked practice problems in every module (adapted from the course quizzes and exams, solutions computed by the site's own unit-tested algorithms); a mixed checkpoint quiz for each learning path |
| **Gamification** | XP, levels, streaks, 17 badges, 13 mini-games with high scores, each embedded in the lesson it practises |
| **Study tools** | 170 flashcards (Leitner spaced repetition), per-module and whole-course mind maps, a 154-concept prerequisite graph, glossary and full-text search |
| **Videos in the lessons** | 92 YouTube videos (each checked to exist), including Abdul Bari and Striver (take U forward) lectures in the Algorithms foundation, placed inside the lessons where they help: before a section that is easier after watching, or after it as a recap |
| **Foundation refreshers** | lessons link to the exact math, algorithms or tools section they rely on; it opens inline, so you never have to finish the foundations first |
| **বাংলা** | every lesson has a Bangla explanation (technical terms stay in English); the English \| বাংলা switch at the top of a lesson sets the whole page, and each section has its own switch |
| **Further reading** | primary papers and docs, Rosalind problems for every algorithm |

## Progress tracking across devices

There is no login for now. Progress (completed sections, quiz bests, flashcard schedules, XP, game scores) is always saved in the browser. To sync between devices, choose one:

1. **GitHub Gist (works on GitHub Pages).** Create a GitHub personal access token (classic) with only the `gist` scope and paste it in *Settings & sync* on each device. Progress is stored in a private Gist in your account.
2. **Export / import** a JSON file from *Settings & sync*.

Server sync through `api/progress.js` (Vercel + Upstash Redis, which sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`) is kept for later: it needs accounts, which will return once a Redis store is connected. Until then the client does not call it.

Syncing merges rather than overwrites: achievements are unioned, and the newest flashcard schedule wins.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 49 unit tests: algorithms + content integrity + worked-solution numbers
npm run build      # static site in dist/
```

## Deploy

- **GitHub Pages:** pushes to `main` run `.github/workflows/deploy.yml` (tests → build → Pages). In repo *Settings → Pages*, set *Source* to **GitHub Actions**.
- **Vercel:** import the repo; `vercel.json` already sets the Vite build. The serverless function in `api/` deploys automatically.

The site uses hash routing and relative asset paths, so the same build works at any base URL.

## Adding the biotechnology course (or any new module)

1. Write the lesson in `src/data/content/<id>.md`. Each `## Heading` becomes a trackable section. You can embed:
   - widgets: `{{widget:alignment preset="final"}}` (registry in `src/widgets/registry.ts`),
   - mini-games: `{{game:id}}` (registry in `src/games/registry.ts`; the game's `module` must be this module),
   - videos: `{{video:VIDEO_ID}}` on its own line, where the video helps; list the video (title, channel, a one-line "why") in the module's `videos`. Every listed video must be placed exactly once, since videos only appear inside lessons,
   - foundation refreshers: `{{ref:math#bayes-rule|algo#dynamic-programming}}` (module id `#` section id, the section heading in kebab case), next to the step that needs it,
   - callouts: `:::tip Title` … `:::` (types: tip, bio, cs, warn, exam, example, sota, and `story` for analogies and big-picture narratives),
   - check-yourself questions: `:::think Question?` … `:::`, which shows the question and reveals the answer (the body) on click,
   - math: `$inline$` and `$$display$$` (KaTeX).
   - a Bangla version: `src/data/content/bn/<id>.md`, with the same `##` sections and the same embeds and callouts in the same order (a test checks this). Keep technical terms in English and explain the rest naturally rather than translating word by word. A module without one is shown in English.
2. Describe the module in `src/data/modules/<id>.ts` (copy an existing one): quiz, flashcards, mind map, practice problems, videos, articles, prerequisites, concepts.
3. Import it in `src/data/index.ts` and add its id to the `biotech` track.
4. Add any new concepts to `src/data/concepts.ts` so they appear in the knowledge graph.
5. Run `npm test`. The content tests catch missing widgets, unplaced or unlisted videos, broken refreshers, broken prerequisites, duplicate ids and concept-graph cycles.

## How the content was verified

- Algorithms (`src/lib/bio/`) are implemented from scratch and unit-tested against values from the textbook, the course handouts and the exams. For example: Viterbi on `GGCACTGAA` gives `HHHLLLLLL` with log₂P = −24.49; Forward(`GGCA`) = 0.0038432; V. cholerae oriC frequent 9-mers; the Boyer-Moore slide trace; UPGMA, NW/SW and soft k-means exam answers; Quiz 5 centralities.
- Every YouTube ID was checked through YouTube's oEmbed endpoint; every article URL was fetched, or verified through Crossref where the publisher blocks automated requests.
- State-of-the-art facts (AlphaFold 2/3, AlphaFold DB, ESMFold/ESM3, RFdiffusion, AlphaMissense, T2T, HPRC, Evo 2, AlphaGenome, the 2024 Nobel Prize) were checked against the primary papers or official announcements.
- Where the slides contain slips (e.g., “post-translational” mRNA processing, the triangle-inequality direction), the lessons point them out.

## Copyright

The original course slides, quizzes and exams are **not** included in this repository (they are git-ignored). Lesson text is original and paraphrased; exam-style problems are restated with worked solutions for personal study. Credits: Compeau & Pevzner, *Bioinformatics Algorithms*; Ben Langmead's ADS1 materials; Gusfield; StatQuest; EMBL-EBI training.
