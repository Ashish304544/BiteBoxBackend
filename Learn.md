# BiteBox — Learn / Project Walkthrough

A developer-oriented guide to what BiteBox is, what it does, which tech stack powers it,
and where every piece lives.

The project is split across two sibling folders:

```
BiteBox_Proj/
├── BiteBox/          # Next.js frontend
└── BiteBoxBackend/   # Express + MongoDB backend  ← this file lives here
```

---

## 1. What is BiteBox?

BiteBox is a **social platform for food lovers**. It combines four things that are
usually separate apps:

| Pillar | What the user can do |
|---|---|
| **Recipe library** | Browse recipes (community-written + a public meal API), search, filter by category, like, watch an embedded YouTube tutorial |
| **Recipe authoring** | Write and publish your own recipe with a rich-text editor, cover image and YouTube link |
| **Community feed** | Create text posts, like/dislike them, comment, and reply to comments |
| **Live cooking streams** | Broadcast a cooking session from your webcam over WebRTC, and let others join, like and comment in real time |

On top of that there is a **Gemini-powered AI cooking assistant** (a draggable chat
bubble available on every page), Firebase authentication, a global dark mode, a
star-rating/review system, and a contact form.

---

## 2. Tech stack

### Frontend — `../BiteBox`

| Layer | Technology | Why it's here |
|---|---|---|
| Framework | **Next.js 15** (App Router) | File-based routing, server/client components, image handling |
| UI library | **React 18** | Component model |
| Styling | **Tailwind CSS 3** + PostCSS | All styling is utility classes; `darkMode: 'class'` strategy |
| Auth | **Firebase Auth v10** (client SDK) | Google OAuth popup + email/password sign-up & sign-in |
| HTTP | **Axios** | Every call to the BiteBox backend and TheMealDB |
| AI chat | **@google/genai** (`gemini-2.5-flash`) | The BiteBox AI culinary assistant |
| Markdown | **react-markdown** + **remark-gfm** + **react-syntax-highlighter** | Renders the AI's markdown/code replies |
| Rich text | **draft-js** + **@draft-js-plugins/\*** | The recipe editor (bold/italic/lists/quote/code…) |
| Icons | **lucide-react**, **react-icons** | UI iconography |
| Carousels | **react-slick** + **slick-carousel** | Customer-review carousel |
| Dates | **date-fns** | `format()` / `formatDistanceToNow()` on posts and streams |
| Email | **@emailjs/browser** | Contact form submits straight from the browser, no backend needed |
| Realtime video | **Browser WebRTC APIs** (`RTCPeerConnection`) | Live streaming, signalled over plain HTTP POST |
| Lint | ESLint + `eslint-config-next`, Babel presets | Code quality |

### Backend — this folder

| Layer | Technology | Why it's here |
|---|---|---|
| Runtime | **Node.js** | Server runtime |
| Framework | **Express 4** | HTTP routing and middleware |
| Database | **MongoDB** via **Mongoose 8** | Recipes, posts, streams, ratings |
| Media relay | **wrtc** | Server-side `RTCPeerConnection` — receives the broadcaster's tracks and forwards them to viewers |
| Middleware | **cors**, **body-parser**, **express.json**, **multer** | Request parsing, CORS, file uploads, `/uploads` static serving |
| Config | **dotenv** | `MONGO_URI`, `PORT`, Firebase service values |
| Admin SDK | **firebase-admin** | Installed for verifying Firebase ID tokens |
| Dev | **nodemon** | `npm start` runs `nodemon server.js` |
| Deploy | **Vercel** (`@vercel/node`) | See [vercel.json](vercel.json) |

### External services / APIs used

- **Firebase Authentication** — user identity (Google + email/password).
- **MongoDB Atlas** — data store.
- **Google Gemini API** (`gemini-2.5-flash`) — AI chat assistant.
- **TheMealDB** (`https://www.themealdb.com/api/json/v1/1/…`) — free public recipe API used by the `/menu` page.
- **EmailJS** — contact-form delivery straight from the browser.
- **YouTube embed** — recipe/tutorial videos.
- **Google STUN servers** — WebRTC NAT traversal.

---

## 3. Folder structure

### Backend (this folder)

```
BiteBoxBackend/
├── server.js                 # Express app, MongoDB connect, route mounts
├── models/
│   ├── recipe.js             # Recipe schema (+ auto-incrementing `autoid` hook)
│   ├── post.js               # Post schema (+ slug generation hook, nested comments)
│   ├── stream.js             # Stream schema (isLive, startedAt/endedAt, duration)
│   └── ratings.js            # Rating schema (unique per email, 1–5)
├── routes/
│   ├── recipeRoutes.js       # /api/recipes …
│   ├── postroutes.js         # /api/posts …
│   ├── streamingRoutes.js    # /api/streams (CRUD + WebRTC relay /broadcast & /consumer)
│   └── ratingroutes.js       # /api/rating, /api/reviews
├── vercel.json               # Vercel serverless build config
├── package.json              # `npm start` → nodemon server.js
└── .env                      # MONGO_URI, PORT, FIREBASE_*
```

### Frontend (`../BiteBox`)

```
BiteBox/
├── src/
│   ├── app/                      # Next.js App Router — every folder = a route
│   │   ├── layout.js             # Root layout: Navbar + Cursor + AI bubble + providers
│   │   ├── page.js               # "/"  home page
│   │   ├── globals.css           # Tailwind directives + custom animations
│   │   ├── firebase.js           # Firebase app + auth initialisation
│   │   ├── DarkModeContext.js    # Dark-mode React context (localStorage-backed)
│   │   ├── context/AuthContext.js# Auth React context (sign in/up/out, ID tokens)
│   │   │
│   │   ├── LoginPage/            # Login / signup screen (wraps <AuthForm/>)
│   │   ├── profile/              # Logged-in user's profile + sign-out
│   │   ├── about/                # Static "About us"
│   │   ├── contact/              # EmailJS contact form
│   │   ├── more/                 # "Community" landing → /post and /streams
│   │   ├── custoratings/         # Submit a 1–5 star rating + review
│   │   ├── [...not-found]/       # Catch-all 404 page
│   │   │
│   │   ├── menu/                 # TheMealDB browser (search + category filter)
│   │   ├── menuview/             # Single TheMealDB meal (?id=) + YouTube embed
│   │   ├── homemenuview/         # Single recipe from the local JSON seed (?id=)
│   │   ├── recipes/              # Community recipes from our backend
│   │   ├── view/                 # Single community recipe (?id=) + like + video
│   │   ├── postrecipe/           # Draft.js recipe editor → POST /api/recipes
│   │   │
│   │   ├── post/                 # Community feed (list of posts)
│   │   │   ├── createpost/       # New post form
│   │   │   └── viewpost/         # Single post: likes, comments, replies
│   │   │
│   │   ├── streams/              # Live + ended stream listings
│   │   │   ├── startnewlive/     # Broadcaster: camera, mic, go live, chat, likes
│   │   │   ├── joinlivestream/   # Viewer: joins a live stream by ?id=
│   │   │   └── streamdetail/     # Replay/details of an ended stream
│   │   ├── live/                 # Older standalone viewer (hardcoded localhost:5000)
│   │   │
│   │   ├── chat/                 # Full-screen Gemini AI chat
│   │   ├── cur/                  # Alternate pink cursor-trail effect
│   │   ├── head.js               # Legacy <head> helper
│   │   └── pages/_document.js    # Legacy Pages-Router document (App Router ignores it)
│   │
│   ├── Components/
│   │   ├── Navbar.js             # Yellow top bar: Home/Menu/Recipes/Community + auth
│   │   ├── AuthForm.jsx          # Email+password form w/ validation, Google sign-in
│   │   ├── Footer/               # Site footer
│   │   ├── Section/              # Layout wrapper (max width + padding)
│   │   ├── Carousel.js           # Auto-rotating hero image carousel (5s)
│   │   ├── CustomerReviewCarousel.js # react-slick carousel of GET /api/reviews
│   │   ├── card.js               # Recipe card
│   │   ├── Ai/Ai.js              # Draggable AI bubble → /chat (mouse + touch)
│   │   ├── Cursor/Cursor.js      # 30-circle brown cursor-trail animation
│   │   ├── DarkModeToggle.js     # Dark-mode switch (commented out in Navbar)
│   │   ├── modeToggle.jsx        # The toggle actually rendered in the Navbar
│   │   ├── loader.jsx            # Skeleton / loading animation
│   │   └── Spinner.jsx           # Small spinner
│   │
│   └── lib/                      # Static assets + seed data
│       ├── Homepagerecipe.json   # Hard-coded featured recipes for the home page
│       └── *.jpg / *.png / *.gif # Food photos, logo, spinner
│
├── next.config.mjs               # Unoptimized images, trailingSlash, remote patterns
├── tailwind.config.js            # class-based dark mode + custom keyframes
├── jsconfig.json                 # `@/*` → `./src/*` path alias
└── stackbit.config.ts            # Stackbit visual-editing config
```

---

## 4. How the core systems work

### 4.1 Authentication (Firebase)

`../BiteBox/src/app/firebase.js` boots the Firebase app from `NEXT_PUBLIC_FIREBASE_*`
env vars and exports `auth`. `context/AuthContext.js` wraps it in a React context:

```js
const { user, loading, googleSignIn, emailSignUp, emailSignIn, logOut, getAuthToken } = UserAuth()
```

- `onAuthStateChanged` keeps `user` in sync and flips `loading` off once resolved.
- `emailSignUp` also calls `updateProfile()` to set the `displayName`.
- `getAuthToken()` returns the Firebase **ID token**, meant to be sent as
  `Authorization: Bearer <token>` (see `postRecipeWithToken`).
- `AuthForm.jsx` enforces a password policy client-side: ≥7 chars, ≥1 uppercase,
  ≥1 digit, ≥1 special character.

The provider is mounted in the root layout, so `UserAuth()` works anywhere. Pages gate
features by checking `user` — e.g. the home page blocks `/postrecipe` and
`/streams/startnewlive` for guests and redirects to `/LoginPage`.

### 4.2 Dark mode (no flash of wrong theme)

Two cooperating pieces:

1. A **blocking inline `<Script strategy="beforeInteractive">`** in the root layout reads
   `localStorage.darkMode` (falling back to `prefers-color-scheme`) and adds the `dark`
   class to `<html>` *before* React hydrates. This is what prevents the white flash.
2. `DarkModeContext.js` then takes over for runtime toggling and persistence.

Tailwind is configured with `darkMode: 'class'`, so `dark:` variants respond to that
class. Many components *also* read `darkMode` from the context and branch on it in JS.

### 4.3 Recipes

- **Community recipes** live in MongoDB. `/recipes` fetches `GET /api/recipes?limit=100`
  once, then does all filtering client-side with `useMemo` (category filter + search +
  live title suggestions). `/view?id=<mongoId>` shows one recipe, extracts the YouTube ID
  with a regex, embeds the player, and posts likes to `PUT /api/recipes/:id/like`.
- **TheMealDB recipes** are fetched directly from the public API — `/menu` searches
  `search.php?s=<query>`, `/menuview?id=` looks up `lookup.php?i=<id>` and splits
  `strInstructions` on blank lines into steps.
- **Home page featured recipes** come from the local `src/lib/Homepagerecipe.json`, and
  `/homemenuview?id=` renders one of them. No network needed.

### 4.4 Community posts

`/post` lists everything from `GET /api/posts/`. `/post/createpost` submits
`{ title, content, thumbnail, username, userId }`. `/post/viewpost?id=` is the busiest
page: it loads one post, then drives likes (`PUT /:id/like`), comments
(`POST /:id/comment`) and **replies** (`POST /:id/comment/:commentId/reply`), formatting
timestamps with `date-fns`.

[models/post.js](models/post.js) auto-generates a URL **slug** from the title in a
Mongoose `pre('save')` hook, appending `Date.now()` for uniqueness.

### 4.5 Live streaming (WebRTC)

The simplified streaming architecture uses `wrtc` on Node.js to act as a lightweight media relay between the broadcaster and viewers over HTTP POST signaling without Socket.IO.

```
Broadcaster                     Backend (Express + wrtc)                    Viewer
    │                                     │                                    │
    │ ─── POST /api/streams/broadcast ──> │                                    │
    │     (SDP Offer)                     │                                    │
    │                                     │ stores stream & tracks in Map      │
    │ <── { sdp: Answer, streamId } ────  │                                    │
    │                                     │                                    │
    │ ─── POST /api/streams ────────────> │ (Saves metadata to MongoDB)          │
    │                                     │                                    │
    │                                     │ <── POST /api/streams/consumer ─── │
    │                                     │     (SDP Offer + streamId)         │
    │                                     │                                    │
    │                                     │     Attaches broadcaster tracks    │
    │                                     │ ─── { sdp: Answer } ─────────────> │
```

The WebRTC backend performs 3 core jobs:

#### 1. Broadcaster Signalling (`POST /api/streams/broadcast`)
1. Broadcaster acquires camera/mic stream via `getUserMedia()`.
2. Creates `RTCPeerConnection`, adds local tracks, and generates an SDP offer.
3. Sends SDP offer to `POST /api/streams/broadcast`.
4. Backend creates a server `RTCPeerConnection`, receives tracks in `ontrack`, stores `{ peer, stream }` in an in-memory `Map` keyed by a generated `streamId`, generates an SDP answer, and returns `{ sdp, streamId }`.
5. Broadcaster sets remote description, then registers stream details (title, description, thumbnail, `streamId`) via `POST /api/streams`.

#### 2. Viewer Signalling (`POST /api/streams/consumer`)
1. Viewer creates `RTCPeerConnection` with `recvonly` audio/video transceivers and generates an SDP offer.
2. Sends `{ sdp, streamId }` to `POST /api/streams/consumer`.
3. Backend validates `streamId` using `checkStreamExists` middleware, retrieves broadcaster stream from `streams` Map, creates a viewer `RTCPeerConnection`, attaches broadcaster tracks (`stream.getTracks()`), generates an SDP answer, and returns `{ sdp }`.
4. Viewer sets remote description and receives live video/audio.

#### 3. Stream REST API
- `POST /api/streams` — Create stream record in MongoDB.
- `GET /api/streams/live` — Fetch active live streams (`isLive: true`).
- `GET /api/streams/ended` — Fetch ended streams (`isLive: false`).
- `GET /api/streams/:streamId` — Fetch stream details, likes, and comments.
- `PUT /api/streams/:streamId/end` — End stream (sets `isLive: false`, computes duration).
- `PUT /api/streams/:streamId/like` & `/unlike` — Like or unlike a stream.
- `POST /api/streams/:streamId/comment` — Add a comment to a stream.

> STUN Server used: `stun:stun.l.google.com:19302`.

### 4.6 AI assistant (Gemini)

`Components/Ai/Ai.js` renders a 100×100 circular bubble that is **draggable with both
mouse and touch** (listeners are attached to `document` while dragging so the pointer can
leave the element). It hides itself on `/chat` via `usePathname()`.

`/chat` uses `new GoogleGenAI({ apiKey })` and calls
`ai.models.generateContent({ model: "gemini-2.5-flash", … })`. A `SYSTEM_PROMPTS` array
defines the "BiteBox AI" persona (friendly culinary assistant, markdown + emoji),
conversation history is kept in a `useRef`, and replies are rendered through
`react-markdown` with `remark-gfm` and Prism syntax highlighting.

### 4.7 Ratings & reviews

`/custoratings` posts `{ email, rating, review }` to `POST /api/rating`.
[routes/ratingroutes.js](routes/ratingroutes.js) uses
`findOneAndUpdate(..., { upsert: true })` keyed on `email`, so there is **one review per
user** — resubmitting overwrites. `CustomerReviewCarousel.js` reads `GET /api/reviews`
(sorted newest-first) and spins them through react-slick on the home page.

### 4.8 Contact form

`/contact` calls `emailjs.sendForm(serviceId, templateId, form, publicKey)` directly from
the browser. No backend route is involved.

---

## 5. Backend API reference

Base URL comes from `NEXT_PUBLIC_BACKEND_API` on the frontend. Mount points are wired in
[server.js](server.js): `/api` (recipes + ratings), `/api/posts`, `/api/streams`.

### Recipes — [routes/recipeRoutes.js](routes/recipeRoutes.js)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/recipes` | Create a recipe (title, content, coverImage, username, email, category, youtube) |
| `GET` | `/api/recipes` | List all recipes |
| `GET` | `/api/recipes/:id` | One recipe by Mongo `_id` |
| `PUT` | `/api/recipes/:id/like` | Like once per `userId` |

### Posts — [routes/postroutes.js](routes/postroutes.js)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/posts` | Create post |
| `GET` | `/api/posts` | List posts |
| `GET` | `/api/posts/:postId` | One post |
| `PUT` | `/api/posts/:postId/like` | Like (removes an existing dislike) |
| `PUT` | `/api/posts/:postId/dislike` | Dislike (removes an existing like) |
| `POST` | `/api/posts/:postId/comment` | Add comment |
| `POST` | `/api/posts/:postId/comment/:commentId/reply` | Reply to comment |
| `DELETE` | `/api/posts/:postId` | Delete post |
| `DELETE` | `/api/posts/:postId/comment/:commentId` | Delete comment |

### Streams — [routes/streamingRoutes.js](routes/streamingRoutes.js)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/streams/broadcast` | Broadcaster offer → answer + new `streamId` |
| `POST` | `/api/streams/consumer` | Viewer offer → answer with broadcaster's tracks |
| `POST` | `/api/streams` | Register a new stream |
| `GET` | `/api/streams/live` | All `isLive: true` |
| `GET` | `/api/streams/ended` | All `isLive: false` |
| `GET` | `/api/streams/:streamId` | Stream detail w/ likes + comments |
| `PUT` | `/api/streams/:streamId/end` | Mark ended, compute `duration` |
| `PUT` | `/api/streams/:streamId/like` \| `/unlike` | Toggle like |
| `POST` | `/api/streams/:streamId/comment` | Add comment |
| `DELETE` | `/api/streams/:streamId/comment/:commentId` | Delete comment |

### Server Health Check — [server.js](server.js)
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Health check — "Welcome to the Recipe Book API" |

---

## 6. Data models (Mongoose)

```js
// models/recipe.js
{ autoid: Number,            // auto-increments in a pre('save') hook
  title, content, coverImage, author, email, category, youtube,
  likes: [{ userId }], timestamps }

// models/post.js
{ user, username, title, thumbnail, content,
  slug,                      // auto-generated from title + Date.now()
  likes: [{ userId }], dislikes: [{ userId }],
  comments: [{ user, text, replies: [...], timestamps }], timestamps }

// models/stream.js
{ user, username, title, description, thumbnail, streamId,
  isLive: Boolean,           // default true
  startedAt, endedAt, duration,   // duration in seconds
  likes: [{ userId }], comments: [{ user, text }] }

// models/ratings.js
{ email,                     // unique → one review per user
  rating: 1–5, review, createdAt }
```

---

## 7. Environment variables

### Backend — `BiteBoxBackend/.env`
```
MONGO_URI=
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
```

### Frontend — `BiteBox/.env`
```
NEXT_PUBLIC_BACKEND_API=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_KEY=            # Google Gemini API key
```

> ⚠️ Everything prefixed `NEXT_PUBLIC_` is **bundled into the browser JS** and is
> publicly readable. The Gemini key in particular is exposed to anyone who opens
> devtools — for production it should move behind a Next.js route handler that keeps the
> key server-side. The EmailJS service/template/public IDs in `contact/page.js` are also
> hardcoded rather than read from `.env`.

---

## 8. Running it locally

```bash
# 1. Backend
cd BiteBoxBackend
npm install
# create .env with MONGO_URI + PORT
npm start                 # nodemon server.js → http://localhost:5000

# 2. Frontend
cd ../BiteBox
npm install
# create .env with the NEXT_PUBLIC_* values above
npm run dev               # → http://localhost:3000
```

Frontend scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`,
`npm run deploy` (gh-pages).

Notes:
- Camera/mic features need `localhost` or HTTPS — browsers block `getUserMedia` on plain
  HTTP origins.
- `next.config.mjs` sets `images: { unoptimized: true }` and allows any `https` remote
  host, so external thumbnail URLs work without extra config.

---

## 9. Deployment

- **Frontend** → Vercel (Next.js). `trailingSlash: true` and unoptimized images are set
  for static-friendly hosting; `gh-pages` scripts exist as an alternative path.
- **Backend** → Vercel serverless via [vercel.json](vercel.json), routing all traffic to
  `server.js` with `@vercel/node`.

> ⚠️ Two deployment caveats worth knowing:
> 1. [server.js](server.js) calls `app.listen()` and holds live streams in an
>    **in-memory `Map`**. Serverless functions are stateless and short-lived, so WebRTC
>    relaying will not survive on Vercel — the streaming half needs a long-running host
>    (Render, Railway, Fly.io, a VM…).
> 2. [vercel.json](vercel.json) hardcodes
>    `Access-Control-Allow-Origin: http://localhost:3000`, while `server.js` sets
>    `cors({ origin: '*' })`. These disagree; pick one and set it to the real deployed
>    frontend origin.

---

## 10. Notable implementation details & gotchas

**Good patterns already in the codebase**
- The blocking dark-mode script eliminates theme flash on first paint.
- `useMemo` on `/recipes` avoids refiltering on every keystroke-triggered render.
- `Promise.all` on `/streams` loads live + ended lists concurrently.
- Every WebRTC `useEffect` and the cursor animation clean up after themselves
  (`cancelAnimationFrame`, `removeEventListener`, `track.stop()`, `peer.close()`).
- Draft.js is `dynamic(..., { ssr: false })`-imported because it touches `window`.
- Like routes are idempotent — they check for an existing `userId` and 400 rather than
  double-counting.

**Things to be aware of**
- **Declared but unused frontend deps:** `livekit-client`, `react-quill`,
  `@tinymce/tinymce-react`, `framer-motion`, `react-typing-effect`, `jest`, and
  `react-router-dom` are in `package.json` but not imported anywhere in `src/`.
  (`react-router-dom` is redundant — Next.js has its own router.)
- **Dead / duplicate frontend routes:** `/live` is an older copy of
  `/streams/joinlivestream` — updated to use `${process.env.NEXT_PUBLIC_BACKEND_API}/api/streams/consumer`.
  `/cur` duplicates `Components/Cursor/Cursor.js` in different colours, and
  `src/app/pages/_document.js` is Pages-Router leftover the App Router ignores.
- **Unreachable route:** the last handler in
  [routes/recipeRoutes.js](routes/recipeRoutes.js) (`GET /api/recipes/:email`) can never
  match, because `GET /api/recipes/:id` is declared first and swallows it. Its body also
  references an undefined `recipes` variable.
- **Deprecated Mongoose calls:** `mongoose.connect` still passes `useNewUrlParser` and
  `useUnifiedTopology`, which are no-ops in Mongoose 8. `comment.remove()` in the
  delete-comment routes was removed in Mongoose 7 and should be `comment.deleteOne()` or
  a `pull()`.
- **Nested comment schema:** `replies: [{ type: this }]` in
  [models/post.js](models/post.js) is not a valid self-reference in Mongoose — recursion
  silently doesn't happen, so only one level of replies actually persists.
- **No authorization on write routes:** the frontend has `getAuthToken()` and the backend
  has `firebase-admin` installed, but no route actually verifies the ID token. Anyone can
  `POST`/`DELETE` posts and streams. This is the highest-value hardening step.
- **`likes` is an unbounded array** on every document. Fine at small scale; at large scale
  it should become its own collection or a counter + membership check.
- `next/legacy/image` is used throughout the frontend instead of the modern `next/image`.

---

## 11. Suggested learning path through the code

1. [server.js](server.js) — middleware, route mounting, Mongo connection, WebRTC relay.
2. `../BiteBox/src/app/layout.js` — how providers, Navbar, cursor and AI bubble compose.
3. `../BiteBox/src/app/context/AuthContext.js` + `Components/AuthForm.jsx` — the auth flow end to end.
4. `../BiteBox/src/app/DarkModeContext.js` — theming, and the no-flash trick.
5. `../BiteBox/src/app/menu/page.js` — the simplest fetch → filter → render page.
6. `../BiteBox/src/app/recipes/page.jsx` — the same idea done well with `useMemo`.
7. [routes/postroutes.js](routes/postroutes.js) + `../BiteBox/src/app/post/viewpost/page.js` — the richest CRUD pairing (likes, comments, replies).
8. `../BiteBox/src/app/streams/startnewlive/page.js` then `joinlivestream/page.js` — WebRTC offer/answer both ways, against `/api/streams/broadcast` and `/api/streams/consumer`.
9. `../BiteBox/src/app/chat/page.js` — Gemini prompting, history and markdown rendering.

---

## 12. Credits

Built by **Mayank Mishra** ([@M-ayank2005](https://github.com/M-ayank2005)) and
**Anurag Yadav** ([@anurag2787](https://github.com/anurag2787)). Frontend is MIT
licensed; backend is ISC.
