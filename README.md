# Bioinformatica

An interactive, gamified study site for bioinformatics. It turns the **CSE443 Bioinformatics** course (BRAC University, CSE department) into lessons with live algorithm widgets, quizzes, spaced-repetition flashcards, mind maps, a concept knowledge graph, mini-games, exam practice with worked solutions, and a state-of-the-art track (AlphaFold, protein design, genomic foundation models). A track for the biotechnology department's course is scaffolded and ready to fill.

Written for a beginner graduate student with a CS background: every biological idea is introduced from scratch, and every algorithm can be stepped through visually.

## What's inside

| | |
|---|---|
| **20 modules** | 3 foundations (math, algorithms, data/tools) · 14 course lectures L01–L15 · 3 frontiers |
| **45 interactive widgets** | skew diagrams, Gibbs sampler race, de Bruijn graph + Euler path animation, Illumina SBS simulator, Boyer-Moore stepper, k-mer index, k-means / soft k-means / hierarchical clustering, PCA, in-browser t-SNE, NW/SW DP tables, UPGMA / NJ / Fitch, Viterbi & Forward tables, casino HMM, logistic regression with class weights, network centralities, scale-free robustness, Girvan–Newman, a live AlphaFold DB 3D viewer… |
| **Exam prep** | every Summer 2025 quiz and exam topic covered; mid/final readiness meters; timed mock tests; worked solutions computed by the site's own (unit-tested) algorithms |
| **Gamification** | XP, levels, streaks, 16 badges, 7 mini-games with high scores |
| **Study tools** | 170 flashcards (Leitner spaced repetition), per-module and whole-course mind maps, a 154-concept prerequisite graph, glossary and full-text search |
| **Resources** | 74 YouTube videos (each checked to exist), primary papers and docs, Rosalind problems for every algorithm |

## Login

Username `admin`, password `admin123`.

The login is a **client-side gate** on a static site, used to scope progress to a user. It is not real security; anyone can read the JavaScript. The Vercel sync API re-checks the credentials server-side; set `BIOINFORMATICA_USER` / `BIOINFORMATICA_PASSWORD` env vars there to change them. Changing the client-side login means updating the hash in `src/auth/auth.tsx`; the comment there shows how it is computed.

## Progress tracking across devices

Progress (completed sections, quiz bests, flashcard schedules, XP, game scores) is always saved in the browser. To sync between devices, choose one:

1. **Vercel + Redis (automatic).** Deploy to Vercel, then in the Vercel dashboard go to *Storage → Marketplace → Upstash Redis* (free tier) and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Redeploy. After logging in, every device syncs through `api/progress.js`.
2. **GitHub Gist (works on GitHub Pages).** Create a GitHub personal access token (classic) with only the `gist` scope and paste it in *Settings & sync* on each device. Progress is stored in a private Gist in your account.
3. **Export / import** a JSON file from *Settings & sync*.

Syncing merges rather than overwrites: achievements are unioned, and the newest flashcard schedule wins.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 45 unit tests: algorithms + content integrity + worked-solution numbers
npm run build      # static site in dist/
```

## Deploy

- **GitHub Pages:** pushes to `main` run `.github/workflows/deploy.yml` (tests → build → Pages). In repo *Settings → Pages*, set *Source* to **GitHub Actions**.
- **Vercel:** import the repo; `vercel.json` already sets the Vite build. The serverless function in `api/` deploys automatically.

The site uses hash routing and relative asset paths, so the same build works at any base URL.

## Adding the biotechnology course (or any new module)

1. Write the lesson in `src/data/content/<id>.md`. Each `## Heading` becomes a trackable section. You can embed:
   - widgets: `{{widget:alignment preset="final"}}` (registry in `src/widgets/registry.ts`),
   - videos: `{{yt:VIDEO_ID|Title}}`,
   - callouts: `:::tip Title` … `:::` (types: tip, bio, cs, warn, exam, sota),
   - math: `$inline$` and `$$display$$` (KaTeX).
2. Describe the module in `src/data/modules/<id>.ts` (copy an existing one): quiz, flashcards, mind map, practice problems, videos, articles, prerequisites, concepts.
3. Import it in `src/data/index.ts` and add its id to the `biotech` track.
4. Add any new concepts to `src/data/concepts.ts` so they appear in the knowledge graph.
5. Run `npm test`. The content tests catch missing widgets, broken prerequisites, duplicate ids and concept-graph cycles.

## How the content was verified

- Algorithms (`src/lib/bio/`) are implemented from scratch and unit-tested against values from the textbook, the course handouts and the exams. For example: Viterbi on `GGCACTGAA` gives `HHHLLLLLL` with log₂P = −24.49; Forward(`GGCA`) = 0.0038432; V. cholerae oriC frequent 9-mers; the Boyer-Moore slide trace; UPGMA, NW/SW and soft k-means exam answers; Quiz 5 centralities.
- Every YouTube ID was checked through YouTube's oEmbed endpoint; every article URL was fetched, or verified through Crossref where the publisher blocks automated requests.
- State-of-the-art facts (AlphaFold 2/3, AlphaFold DB, ESMFold/ESM3, RFdiffusion, AlphaMissense, T2T, HPRC, Evo 2, AlphaGenome, the 2024 Nobel Prize) were checked against the primary papers or official announcements.
- Where the slides contain slips (e.g., “post-translational” mRNA processing, the triangle-inequality direction), the lessons point them out.

## Copyright

The original course slides, quizzes and exams are **not** included in this repository (they are git-ignored). Lesson text is original and paraphrased; exam-style problems are restated with worked solutions for personal study. Credits: Compeau & Pevzner, *Bioinformatics Algorithms*; Ben Langmead's ADS1 materials; Gusfield; StatQuest; EMBL-EBI training.
