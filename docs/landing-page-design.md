# Fleet Driver Landing Page Design Document

## 1. Purpose

The landing page should introduce the Fleet Driver app as a professional, driver-first logistics platform. It should feel premium, trustworthy, fast, and operationally clear without adding a payment gateway link. Its primary conversion goal is simple: help visitors understand the app and move them to the existing login page.

## 2. Design Goals

- **Professional logistics credibility:** use confident typography, fleet imagery, operational language, and structured information hierarchy.
- **Driver-first clarity:** explain what drivers can do in the app: browse loads, accept assignments, track active trips, manage documents, message teams, view earnings, and review ratings.
- **Brand consistency:** keep the existing Fleet Driver orange, navy, white, and neutral palette so the landing page feels connected to the app.
- **Premium but practical motion:** use subtle entrance, hover, and floating animations that feel polished without becoming distracting.
- **No payment CTA:** remove all payment gateway/order payment links from the concept. CTAs should be limited to login and internal landing-page section navigation.
- **Responsive layout:** work well on desktop, tablet, and mobile web while staying visually strong on Expo web.

## 3. Target Audience

### Primary audience
Fleet drivers, private transporters, and company drivers who need a clean portal to sign in and manage logistics work.

### Secondary audience
Fleet managers, dispatchers, and operations teams who want confidence that the driver app is organized, auditable, and easy to use.

## 4. Visual Identity

### Recommended color palette

| Token | Usage | Color |
| --- | --- | --- |
| Fleet Orange | Primary CTAs, highlights, active states | `#F68E27` |
| Deep Navy | Hero overlays, dark workflow section, premium contrast | `#061C31` |
| Page Background | Main page background | `#F9F9F9` |
| Surface White | Cards, navbar, CTA panels | `#FFFFFF` |
| Slate Text | Secondary text | `#64748B` |
| Border | Card borders and dividers | `#E0E7EF` |
| Success Green | Online/status indicators only | `#21C45D` |

### Typography direction

- **Hero headline:** very large, bold, tight tracking, confident line height.
- **Section headings:** bold, compact, clear hierarchy.
- **Body copy:** medium size with generous line height for readability.
- **Labels:** uppercase, letter-spaced microcopy for section tags and operational badges.

Recommended font stack: system UI / app default font to keep performance high and stay consistent with the existing React Native app.

## 5. Page Structure

### 5.1 Sticky Navbar

**Purpose:** make the page feel like a real product website and provide quick access to important sections.

**Layout:**

- Left: compact logo lockup.
  - Icon: rounded orange-tinted square with truck symbol or app logo.
  - Text: `Fleet Driver`.
  - Microcopy: `Command on the road`.
- Center: section links on desktop/tablet.
  - `Platform`
  - `Features`
  - `Workflow`
  - `Impact`
- Right: primary CTA.
  - Button text: `Login`
  - Destination: existing login page.

**Mobile behavior:**

- Keep logo and Login button visible.
- Hide center section links if space is tight.
- Optional future enhancement: hamburger menu that opens section links.

**Animation:**

- Sticky navbar casts a soft shadow after scroll.
- Link hover/tap state uses a light orange tint.
- Login button has a subtle scale-down press animation.

## 6. Hero Section

### 6.1 Creative Direction

Use a high-quality logistics/warehouse/fleet image with a dark navy overlay. The image should communicate movement, infrastructure, and scale. Avoid overly generic corporate stock imagery. Trucks, dispatch screens, warehouses, and road freight visuals are ideal.

### 6.2 Hero Content

**Eyebrow badge:**
`FLEET MANAGEMENT DRIVER APP`

**Headline:**
`Move Every Load with Confident, Connected Drivers`

**Supporting copy:**
`A polished logistics workspace for drivers and fleet teams — from onboarding and marketplace loads to active trip tracking, documents, ratings, and earnings.`

**Primary CTA:**
`Login to Dashboard →`

**Secondary CTA:**
`Explore features`

The secondary CTA should scroll to the feature section, not leave the page.

### 6.3 Hero Visual Card

Place a floating card on the right side of the hero on desktop. On mobile, stack it below the hero copy.

**Card title:**
`Live trip cockpit`

**Status badge:**
`ONLINE`

**Rows:**

1. `Pickup confirmed` — `Warehouse A · 09:20`
2. `Route optimized` — `Addis Ababa → Adama`
3. `Delivery proof` — `Photo + signature ready`

**Design details:**

- White card over dark hero background.
- Rounded 28–32px corners.
- Soft deep shadow.
- Top image of a truck/driver/fleet scene.
- Orange check icons or small circular indicators.

### 6.4 Hero Animation

- Hero copy fades in and slides up by roughly 24–32px.
- Hero visual card gently floats vertically by 8–12px in a slow loop.
- CTA buttons animate on press only; avoid constant pulsing.

## 7. Platform Feature Cards

These cards should overlap the bottom of the hero slightly, similar to a premium SaaS landing page.

### Card 1

**Icon:** location/tracking symbol

**Title:**
`Live Driver Visibility`

**Body:**
`See availability, active routes, assignment status, and trip milestones in one calm dispatch view.`

### Card 2

**Icon:** lightning/dispatch symbol

**Title:**
`Fast Load Matching`

**Body:**
`Connect drivers with the right cargo using clear route details, compensation, and pickup windows.`

### Card 3

**Icon:** shield/trust symbol

**Title:**
`Trusted Fleet Control`

**Body:**
`Keep operations auditable with approvals, documents, ratings, and role-aware driver workflows.`

### Card styling

- White cards on light gray background.
- Rounded 24–28px corners.
- Thin border using the app border token.
- Soft shadow, no heavy drop shadow.
- Orange-tinted icon container.
- Entrance stagger: each card fades/slides up with 80–120ms delay from the previous card.

## 8. Feature Detail Section

### Section label
`EVERYTHING YOUR DRIVERS NEED`

### Heading
`A landing point that feels as organized as your best dispatch team.`

### Body copy
`The product experience is designed around speed, trust, and calm decision-making. Drivers can quickly understand what is available, what is active, what needs attention, and what they earned.`

### Capability checklist

- `Driver onboarding, approval, and document readiness`
- `Marketplace loads with route, cargo, and payout context`
- `Active trip timelines with proof-of-delivery moments`
- `Earnings, commission balances, history, and performance records`

### Companion image/card

Use a large rounded image card showing a truck on road or logistics operation. Overlay a small glass-style card near the bottom.

**Overlay label:**
`Operational clarity`

**Overlay text:**
`Professional fleet flow without payment links`

This explicitly reflects the requirement to avoid payment gateway CTAs.

## 9. Workflow Section

Use a full-width dark navy section to create contrast and make the page feel more designed.

### Section label
`DRIVER-FIRST WORKFLOW`

### Heading
`From open load to completed delivery — every step stays visible.`

### Intro copy
`Subtle motion, strong hierarchy, and clear cards make the interface feel premium without distracting drivers from the road.`

### Workflow cards

#### 01 — Discover
`Drivers browse verified loads that match route, capacity, and availability.`

#### 02 — Accept
`Assignments become clear trip cards with pickup, delivery, cargo, and contact details.`

#### 03 — Move
`Milestones guide each driver from pickup through arrival, proof, and completion.`

#### 04 — Improve
`Ratings, history, and earnings data help the fleet make smarter decisions.`

### Styling

- Dark navy background.
- Cards use translucent white fills with white borders.
- Step numbers use orange.
- Text uses white and white at 70% opacity for supporting copy.
- Cards enter with a staggered fade/slide animation.

## 10. Impact / Statistics Section

### Section label
`BUILT FOR MEASURABLE IMPACT`

### Heading
`Better visibility for managers. Better confidence for drivers.`

### Stat cards

| Stat | Label |
| --- | --- |
| `24/7` | `Driver operations` |
| `4x` | `Faster trip context` |
| `98%` | `Clearer handoffs` |
| `1` | `Unified driver app` |

### Important note
These numbers should be treated as product-positioning placeholders unless backed by real analytics. If real metrics become available later, replace these with validated company data.

## 11. Final CTA Section

### Heading
`Ready to manage the road?`

### Copy
`Sign in to access the driver dashboard, loads, active trips, documents, messages, and earnings.`

### CTA
`Go to Login`

### Link behavior
The CTA should navigate to the existing login route. No payment gateway, order payment, or external payment CTA should appear anywhere on the landing page.

## 12. Animation System

### Entrance animation

- Elements start at 0 opacity and translate down by 24–32px.
- Animate to full opacity and natural position.
- Use spring easing or ease-out timing.
- Stagger repeated cards by 80–120ms.

### Floating animation

- Apply only to the hero visual card or one small decorative element.
- Translate Y between 0 and -10px.
- Duration: 2600–3200ms.
- Easing: sine in/out.
- Loop gently.

### Press interactions

- Buttons scale to 0.98 on press.
- Cards can lift by 2–4px on hover for web.
- Avoid flashy bounce, spinning, or excessive pulsing.

### Accessibility motion note
If reduced-motion support is later added, disable looping float animations and use simple fade-in only.

## 13. Responsive Behavior

### Desktop: 1024px and above

- Navbar shows all links.
- Hero uses two columns: text left, visual card right.
- Feature cards and workflow cards appear in rows.
- Content max width around 1180px.

### Tablet: 680px–1023px

- Navbar can still show links if space allows.
- Hero stacks if needed.
- Feature cards can stack or use two columns depending on available width.

### Mobile: below 680px

- Hide center nav links.
- Keep logo and Login CTA visible.
- Stack all sections vertically.
- Reduce hero headline size.
- Use full-width buttons where appropriate.
- Reduce image/card heights to avoid overwhelming the screen.

## 14. Image Direction

Recommended image themes:

- Warehouse with shelves and shipping boxes for hero.
- Truck or driver close-up for the floating hero card.
- Road freight or logistics operation for the feature detail image.

Image treatment:

- Hero image should have a dark navy overlay for text contrast.
- Detail images should have large rounded corners.
- Avoid images with unreadable text, watermarks, or distracting faces.

## 15. Content Tone

The tone should be:

- Confident
- Operational
- Clear
- Professional
- Slightly premium
- Not overly playful

Avoid:

- Payment-first wording
- Generic startup buzzwords
- Overpromising with unsupported metrics
- Long paragraphs that slow scanning

## 16. Suggested Implementation Handoff

When this design is implemented later, the root landing page should include:

1. A sticky navbar with section anchors and login routing.
2. A hero with strong copy, logistics imagery, and login CTA.
3. Three platform cards.
4. A detailed features/checklist section.
5. A dark workflow section.
6. A statistics section.
7. A final login CTA.
8. No payment gateway link.

The existing app theme tokens should be reused wherever possible so the landing page feels connected to the current Fleet Driver screens.
