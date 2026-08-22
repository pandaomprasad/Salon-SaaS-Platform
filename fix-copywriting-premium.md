# Fix: Elevate Copy to Feel Premium (while staying consistent & clear)

## The goal
Keep everything from the consistency fix (one word for "salon," no redundant headline/eyebrow pairs), but raise the *register* of the words themselves — so the app reads like a curated luxury experience, not a generic listings app. Premium copy is usually **quieter and more specific**, not flashier — avoid words like "premium," "elite," "exclusive," or "best" on their own, since those are the words that make copy feel *cheap*, not expensive. Real luxury brands describe specific, sensory, or locally-grounded detail instead of announcing their own status.

## Section-by-section: premium rewrite

### Home screen
| Current | Consistency-fix version | Premium version | Why |
|---|---|---|---|
| "STUDIO DISCOVERY" | "DISCOVER SALONS" | "THE SALON EDIT" | "Edit" (as in a curated selection, like a fashion/beauty editorial) signals curation without saying "curated" out loud. |
| "Good evening" | Keep | Keep | Personal, warm, already understated — correct for luxury tone. |
| "Find and book top luxury salons & spas" | "Book trusted salons & spas near {city}" | "Brahmapur's finest, ready to book" | Specific to the city (ties to location picker), confident without over-explaining, short. |
| "Track your appointments" / "Sign in to view active bookings" | Keep | "Your bookings, all in one place" / "Sign in to keep track" | Slightly warmer phrasing, still fully clear and active-voice. |
| "FEATURED PARTNERS" / "Featured in Brahmapur" | "NEAR YOU" / "Top-rated in {city}" | "HANDPICKED" / "Loved in Brahmapur" | "Handpicked" implies human curation (premium signal); "Loved" is warmer than "top-rated," which sounds like an algorithm talking. |
| "ALL STUDIOS" / "Explore all partners" | "MORE SALONS" / "All salons in {city}" | "THE FULL LIST" / "Every salon in Brahmapur" | Plain and confident — premium copy doesn't need to dress up a simple "see everything" moment. |

### Search screen
| Current | Consistency-fix version | Premium version | Why |
|---|---|---|---|
| "SEARCH & EXPLORE" | Keep or simplify | "FIND YOUR NEXT APPOINTMENT" | More specific to the actual outcome (booking), less like a generic app-section label. |
| "Search Salons" | Keep | Keep | Short, clear, no change needed. |
| "Find luxury hair, beauty & spa studios near you" | "...salons near you" | "Hair, skin & spa — handpicked near you" | Cuts "luxury" (telling, not showing) and "beauty" (redundant with hair/skin/spa), replaces with the same "handpicked" signal used above for consistency across the app. |
| "Search by salon name or service..." | Keep | Keep | Functional placeholder text should stay plain — don't decorate UI instructions. |

### Card-level & deal copy
| Current | Verdict |
|---|---|
| "SPECIAL OFFER" | Keep, but consider "LIMITED-TIME" if the deal is actually time-bound — more specific than generic "special." |
| "Weekend Hair Keratin & Spa Care at ₹999" | Keep — specific, sensory, already good. |
| "Deep conditioning, head massage & precision haircut" | Keep — this is exactly the sensory specificity that makes premium copy work. |
| "Book deal" | Keep — active voice, exact action. |
| "Hair · Skin · Spa · Grooming" | Keep | Plain category tags — correct to leave alone. |
| "Top Rated" | Consider "Guest Favorite" — softer, more boutique-hotel language than the slightly algorithmic "Top Rated." |
| "Book" | Keep — never over-write a button. |

## The one-line rule for this app's voice
**Specific and warm, never self-congratulatory.** Every "premium" word you cut (luxury, elite, best, top) should be replaced by something concrete: a place name, a sensory detail, or a human framing like "handpicked" or "loved." That's what separates a boutique feel from a listings app.

## Instruction for Agent
1. Apply the "Premium version" column from both tables above, replacing the corresponding strings in the codebase (search for the "Current" values listed to locate them).
2. Standardize the word "salon" throughout (per the earlier consistency pass) — the premium rewrites above already use "salon" consistently, do not reintroduce "studio" or "partner."
3. Wire any `{city}` placeholders to the existing location state used by the header's location picker — do not hardcode "Brahmapur."
4. Leave deal-card copy, button labels, and search placeholder untouched except where explicitly listed above ("Top Rated" → "Guest Favorite" is optional — apply only if it fits the existing badge component's character limit/style).
5. This is a text-only pass — do not change layout, component structure, colors, or fonts.
