/**
 * Project content — the single source of truth for the project showcase,
 * the project detail pages, the skills cross-references and the sitemap.
 *
 * Everything here was checked against each project's actual codebase.
 * Keep it that way: list a technology or feature as `implemented` only when
 * the code really has it, otherwise mark it `partial` or `planned`.
 *
 * Images: drop files into `src/assets/projects/<slug>/` and reference them by
 * file name (e.g. `cinnabytehq/overview-dark.png`). They are optimized at build time.
 */

/** Edit freely; these are the statuses the UI knows how to color. */
export type ProjectStatus = 'In Development' | 'Concept' | 'Academic Project' | 'Deployed' | 'Design Project';

export type Availability = 'implemented' | 'partial' | 'planned';

export interface TechItem {
  name: string;
  /** Defaults to `implemented`. */
  status?: Availability;
  /** Short clarification shown on the detail page, e.g. "via Supabase". */
  note?: string;
}

export interface ArchitectureNode {
  label: string;
  detail?: string;
  status?: Availability;
}

export interface ProjectImage {
  /** Path inside `src/assets/projects/`. */
  src: string;
  alt: string;
  caption?: string;
  kind: 'desktop' | 'mobile';
  /** For screenshots that exist in both themes: shown only in the matching site theme. */
  theme?: 'dark' | 'light';
}

export interface SchemaEntity {
  name: string;
  /** Key columns only; the full data dictionary is added separately. */
  keys: { name: string; kind: 'PK' | 'FK' }[];
}

export interface SchemaRelation {
  from: string;
  to: string;
  /** e.g. "1 — N" */
  cardinality: string;
  label: string;
}

export interface Highlight {
  title: string;
  body: string;
}

export interface Project {
  slug: string;
  index: string;
  title: string;
  /** Shorter title for tight spaces (cards, nav). */
  shortTitle: string;
  category: string;
  headline: string;
  summary: string;
  status: ProjectStatus;
  statusNote?: string;
  year: string;
  /** Which visual treatment the showcase uses. */
  presentation: 'flagship' | 'schema' | 'mobile' | 'storefront';
  problem: string;
  solution: string;
  stack: TechItem[];
  concepts: string[];
  highlights: Highlight[];
  scope?: { implemented: string[]; planned: string[] };
  architecture: { title: string; caption: string; nodes: ArchitectureNode[] };
  /** Simplified entity overview for database projects. */
  schema?: { note: string; entities: SchemaEntity[]; relations: SchemaRelation[] };
  /** Ordered step flow shown as a pipeline (Mobile Booking, SellBytes). */
  flow?: ArchitectureNode[];
  images: ProjectImage[];
  /** Placeholder slots shown where screenshots are still missing. */
  imagePlaceholders?: string[];
  links: { github: string | null; demo: string | null };
  /** Built under Cinnabyte. */
  cinnabyte: boolean;
}

export const projects: Project[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'cinnabytehq',
    index: '01',
    title: 'CinnabyteHQ',
    shortTitle: 'CinnabyteHQ',
    category: 'Internal Operations Platform',
    headline: 'One workspace for requests, approvals, and team tasks.',
    summary:
      'CinnabyteHQ is an internal operations platform that centralizes requests, approvals, and ongoing work into one structured workspace. It is a full-stack web app with its own REST API and a PostgreSQL database.',
    status: 'In Development',
    statusNote:
      'Runs locally against a Supabase-hosted PostgreSQL database with seeded demo data. Authentication is the next milestone.',
    year: '2026',
    presentation: 'flagship',
    problem:
      'Small teams often track internal requests, sign-offs, project work and tasks across scattered tools, which makes it hard to see what is waiting on whom and what changed.',
    solution:
      'One workspace where every request follows an explicit workflow. Categories that need sign-off are routed to an approver automatically, and every change is written to an activity log. The server-rendered UI and the REST API share the same workflow rules, so the interface never offers a step the API would refuse.',
    stack: [
      { name: 'Astro', note: 'Server-rendered pages and API routes' },
      { name: 'TypeScript', note: 'Strict mode across UI, API and services' },
      { name: 'PostgreSQL', note: 'Hosted on Supabase' },
      { name: 'REST API', note: 'Astro API routes with a JSON envelope' },
      { name: 'Node.js', note: 'Server runtime via the Node adapter' },
      { name: 'Zod', note: 'Strict request validation' },
      { name: 'Tailwind CSS' },
    ],
    concepts: [
      'Workflow state machine',
      'Category-based approval routing',
      'Layered service architecture',
      'Schema-level integrity',
      'Input validation',
      'Server islands',
      'Activity / audit logging',
    ],
    highlights: [
      {
        title: 'One workflow, enforced twice',
        body: 'A single workflow module defines the allowed status changes. The API rejects invalid transitions with 409 Conflict, and the UI uses the same rules to disable them.',
      },
      {
        title: 'Approvals that can’t race',
        body: 'Decisions only apply while an approval is still pending, and a partial unique index guarantees one pending approval per request.',
      },
      {
        title: 'Integrity in the schema',
        body: 'Enums, length and range checks, deliberate foreign-key delete rules and updated_at triggers are defined in the PostgreSQL migration.',
      },
      {
        title: 'A strict API contract',
        body: 'Every endpoint validates input with strict schemas and returns a consistent data/error envelope with mapped HTTP status codes.',
      },
    ],
    scope: {
      implemented: [
        'Requests: create, filter, search, comment and move through review',
        'Approvals routed by category, with approve / reject decisions',
        'Projects and tasks with progress and optimistic task updates',
        'Activity log and an overview dashboard computed from the database',
        'Command palette search and keyboard shortcuts',
        'Light and dark themes with a responsive layout',
      ],
      planned: [
        'Authentication and row-level security policies',
        'Real-time updates',
        'Automated tests and CI',
        'Public deployment',
      ],
    },
    architecture: {
      title: 'Request lifecycle',
      caption: 'Pages and server islands call the same REST API the browser uses; only the service layer talks to the database.',
      nodes: [
        { label: 'Astro UI', detail: 'Pages · server islands · TS scripts' },
        { label: 'REST API', detail: 'API routes · Zod validation' },
        { label: 'Service layer', detail: 'Workflow · approvals · activity log' },
        { label: 'PostgreSQL', detail: 'Supabase · migration + seed' },
      ],
    },
    images: [
      {
        src: 'cinnabytehq/overview-dark.png',
        alt: 'CinnabyteHQ overview dashboard in dark mode with request counts, a request pipeline, items needing attention and recent activity.',
        caption: 'Overview dashboard',
        kind: 'desktop',
        theme: 'dark',
      },
      {
        src: 'cinnabytehq/overview-light.png',
        alt: 'CinnabyteHQ overview dashboard in light mode with request counts, a request pipeline, items needing attention and recent activity.',
        caption: 'Overview dashboard',
        kind: 'desktop',
        theme: 'light',
      },
      {
        src: 'cinnabytehq/request-detail.png',
        alt: 'A CinnabyteHQ request detail page showing the workflow stepper, the next-step approval card and the activity timeline.',
        caption: 'Request detail with workflow stepper',
        kind: 'desktop',
      },
      {
        src: 'cinnabytehq/approvals.png',
        alt: 'The CinnabyteHQ approvals page listing pending approvals with approve and reject actions.',
        caption: 'Approvals queue',
        kind: 'desktop',
      },
      {
        src: 'cinnabytehq/mobile-requests.png',
        alt: 'The CinnabyteHQ requests list at phone width, with view tabs, filters and request cards.',
        caption: 'Requests on mobile',
        kind: 'mobile',
      },
    ],
    links: {
      github: 'https://github.com/cinnabytehq/Internal-Operations-Tool-cinnabytehq-',
      demo: null,
    },
    cinnabyte: true,
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'hospital-outpatient-database',
    index: '02',
    title: 'Centralized Hospital Outpatient Services Database',
    shortTitle: 'Hospital Outpatient Database',
    category: 'Database Management System',
    headline: 'A relational model connecting outpatient care, appointments, and billing.',
    summary:
      'A relational database designed to centralize hospital outpatient service information, including patient, doctor, appointment, consultation, laboratory, prescription, and billing-related data.',
    status: 'Design Project',
    statusNote: 'A database and system design project. It is not deployed in a hospital.',
    year: '2026',
    presentation: 'schema',
    problem:
      'Hospital outpatient information can become fragmented when registration, appointments, consultations, laboratory records, prescriptions, and billing are managed separately.',
    solution:
      'Design a centralized relational database that connects the major entities and maintains structured relationships between them. The schema is normalized so each fact is stored once and referenced by key.',
    stack: [
      // Final database engine to confirm. Change this single entry when it is decided.
      { name: 'PostgreSQL / MySQL', note: 'Relational database engine' },
      { name: 'SQL' },
    ],
    concepts: [
      'Entity Relationship Diagram',
      'Relational schema',
      'Database normalization',
      '1NF',
      '2NF',
      '3NF',
      'Primary keys',
      'Foreign keys',
      'Relationships',
      'Data dictionary',
      'SQL',
    ],
    highlights: [
      {
        title: 'First normal form',
        body: 'Every field holds a single, atomic value, and there are no repeating groups.',
      },
      {
        title: 'Second normal form',
        body: 'Every non-key attribute depends on the whole primary key, not just part of it.',
      },
      {
        title: 'Third normal form',
        body: 'No transitive dependencies: non-key attributes depend on the key and nothing else.',
      },
      {
        title: 'Keys and relationships',
        body: 'Primary keys identify each record, and foreign keys connect patients, doctors, appointments, consultations and their outcomes.',
      },
    ],
    architecture: {
      title: 'Outpatient data flow',
      caption: 'How a visit moves through the core entities.',
      nodes: [
        { label: 'Patient', detail: 'Registration' },
        { label: 'Appointment', detail: 'Patient + doctor + schedule' },
        { label: 'Consultation', detail: 'Findings for the visit' },
        { label: 'Lab · Prescription', detail: 'Orders from the consultation' },
        { label: 'Billing', detail: 'Charges for the visit' },
      ],
    },
    schema: {
      note: 'Simplified overview of the core entities and how they relate. The full ERD, relational schema and data dictionary can be added below.',
      entities: [
        { name: 'Patient', keys: [{ name: 'patient_id', kind: 'PK' }] },
        { name: 'Doctor', keys: [{ name: 'doctor_id', kind: 'PK' }] },
        {
          name: 'Appointment',
          keys: [
            { name: 'appointment_id', kind: 'PK' },
            { name: 'patient_id', kind: 'FK' },
            { name: 'doctor_id', kind: 'FK' },
          ],
        },
        {
          name: 'Consultation',
          keys: [
            { name: 'consultation_id', kind: 'PK' },
            { name: 'appointment_id', kind: 'FK' },
          ],
        },
        {
          name: 'Laboratory',
          keys: [
            { name: 'lab_record_id', kind: 'PK' },
            { name: 'consultation_id', kind: 'FK' },
          ],
        },
        {
          name: 'Prescription',
          keys: [
            { name: 'prescription_id', kind: 'PK' },
            { name: 'consultation_id', kind: 'FK' },
          ],
        },
        {
          name: 'Billing',
          keys: [
            { name: 'billing_id', kind: 'PK' },
            { name: 'appointment_id', kind: 'FK' },
          ],
        },
      ],
      relations: [
        { from: 'Patient', to: 'Appointment', cardinality: '1 — N', label: 'books' },
        { from: 'Doctor', to: 'Appointment', cardinality: '1 — N', label: 'attends' },
        { from: 'Appointment', to: 'Consultation', cardinality: '1 — 1', label: 'results in' },
        { from: 'Consultation', to: 'Laboratory', cardinality: '1 — N', label: 'orders' },
        { from: 'Consultation', to: 'Prescription', cardinality: '1 — N', label: 'issues' },
        { from: 'Appointment', to: 'Billing', cardinality: '1 — 1', label: 'is billed by' },
      ],
    },
    images: [],
    imagePlaceholders: ['Entity Relationship Diagram', 'Relational schema', 'Data dictionary'],
    links: { github: null, demo: null },
    cinnabyte: false,
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'mobile-booking',
    index: '03',
    title: 'Mobile Booking Application',
    shortTitle: 'Mobile Booking',
    category: 'Mobile Application',
    headline: 'Check availability, book a service, and manage appointments.',
    summary:
      'A mobile booking application designed around availability checking, booking confirmation, and booking history. The full client-side flow is built with React Native and Expo; the backend is planned.',
    status: 'In Development',
    statusNote:
      'Front-end prototype running on local mock data. The REST API and PostgreSQL backend are planned, not built.',
    year: '2026',
    presentation: 'mobile',
    problem:
      'People booking appointment-based services need a simple way to see open dates and times on their phone, book a slot, and keep track of upcoming and past appointments.',
    solution:
      'A React Native app that covers the booking journey: browse services, check availability on a calendar and a time-slot grid, review and confirm, then view or cancel bookings in an Upcoming / Past history. Screens get their data through a single API module shaped like the planned REST endpoints, so the backend can be connected without rewriting screens.',
    stack: [
      { name: 'React Native' },
      { name: 'TypeScript', note: 'Strict mode' },
      { name: 'Expo', note: 'Expo Router navigation' },
      { name: 'REST API', status: 'planned', note: 'Endpoints mapped, not yet built' },
      { name: 'PostgreSQL', status: 'planned', note: 'Planned persistence layer' },
    ],
    concepts: [
      'File-based navigation',
      'Typed route params',
      'React Context state',
      'Availability modelling',
      'Data-access layer',
      'Design tokens',
    ],
    highlights: [
      {
        title: 'One seam for data',
        body: 'Screens read data through one API module whose functions mirror the planned REST endpoints, which keeps the move to a real backend contained.',
      },
      {
        title: 'Deterministic availability',
        body: 'Open slots are generated deterministically per date, so the same day always shows the same availability while the backend is being built.',
      },
      {
        title: 'A guarded booking flow',
        body: 'Continue stays disabled until a choice is made, unavailable slots can’t be picked, and confirming replaces the route so Back can’t resubmit.',
      },
      {
        title: 'Token-driven interface',
        body: 'Colors, spacing, type and radii come from shared design tokens, so every screen is styled from one system.',
      },
    ],
    scope: {
      implemented: [
        'Browse and search services by category',
        'Availability check on a date calendar and a time-slot grid (simulated data)',
        'Review and confirm a booking behind a three-step indicator',
        'Booking confirmation screen',
        'Booking history with Upcoming / Past tabs, details and cancellation',
      ],
      planned: [
        'REST API backend',
        'PostgreSQL persistence (bookings currently reset on reload)',
        'User accounts',
        'Real availability and conflict checking',
      ],
    },
    architecture: {
      title: 'Planned architecture',
      caption: 'The app and its data layer exist today. The API and database below it are planned.',
      nodes: [
        { label: 'React Native', detail: 'Expo Router screens' },
        { label: 'Data layer', detail: 'Typed API module · mock data' },
        { label: 'REST API', detail: 'Endpoints mapped', status: 'planned' },
        { label: 'PostgreSQL', detail: 'Persistence', status: 'planned' },
      ],
    },
    flow: [
      { label: 'Check Availability', detail: 'Calendar + time slots' },
      { label: 'Create Booking', detail: 'Review the details' },
      { label: 'Confirmation', detail: 'Booking confirmed' },
      { label: 'Booking History', detail: 'Upcoming & past' },
    ],
    images: [],
    imagePlaceholders: ['Availability screen', 'Booking confirmation', 'Booking history'],
    links: {
      github: 'https://github.com/enzmonz/Mobile-Booking-Cinnabyte-per-Booking-',
      demo: null,
    },
    cinnabyte: true,
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'sellbytes',
    index: '04',
    title: 'SellBytes',
    shortTitle: 'SellBytes',
    category: 'E-commerce Platform',
    headline: 'A storefront with checkout, inventory, and order management.',
    summary:
      'SellBytes is an e-commerce platform that connects product discovery, ordering, inventory, and payment workflows into one digital storefront: a server-rendered Astro app on a single PostgreSQL database, with an admin back office.',
    status: 'In Development',
    statusNote:
      'Runs locally on PostgreSQL with seeded sample data. Payments run through a built-in test gateway; a Stripe adapter is written but not yet verified.',
    year: '2026',
    presentation: 'storefront',
    problem:
      'An online store has to connect product browsing, carts, checkout, payment, stock levels and fulfilment. When these live in separate tools, stock gets oversold and orders can be marked paid before a payment is confirmed.',
    solution:
      'One Astro application on one PostgreSQL database. Checkout runs in a single transaction that re-prices the cart and reserves stock, and an order is only marked paid when a signed, idempotent payment event confirms it. Admins manage orders, products and inventory from the same system.',
    stack: [
      { name: 'Astro', note: 'Server-rendered storefront and admin' },
      { name: 'TypeScript', note: 'Strict mode' },
      { name: 'PostgreSQL', note: 'Raw SQL via node-postgres' },
      { name: 'REST API', note: 'Catalog, cart, orders, payments' },
      { name: 'Node.js', note: 'Server runtime, crypto, pg driver' },
      { name: 'Payments API', status: 'partial', note: 'Test gateway works end to end; Stripe adapter unverified' },
      { name: 'Zod', note: 'Shared validation' },
      { name: 'Tailwind CSS' },
    ],
    concepts: [
      'Transactional checkout',
      'Row-level locking',
      'Payment provider abstraction',
      'Signed webhooks (HMAC)',
      'Idempotent event handling',
      'Order state machine',
      'Full-text + trigram search',
      'Session authentication',
    ],
    highlights: [
      {
        title: 'No overselling',
        body: 'Checkout locks inventory rows, re-prices every line from the database and decrements stock in a single transaction.',
      },
      {
        title: 'Paid means verified',
        body: 'Only a signed, idempotent payment event can move an order from pending to processing. Replays and amount mismatches are rejected.',
      },
      {
        title: 'Search that forgives typos',
        body: 'PostgreSQL full-text search over weighted fields, combined with trigram similarity for misspellings.',
      },
      {
        title: 'History that stays put',
        body: 'Orders snapshot the customer, address and line items at checkout, so later edits never rewrite past orders.',
      },
    ],
    scope: {
      implemented: [
        'Catalog with category tree, filters, facets and search',
        'Product pages with variants and reviews',
        'Database-backed cart with discount codes',
        'Transactional checkout that reserves stock',
        'Test-mode payment flow, end to end',
        'Customer accounts and order tracking',
        'Admin dashboard, orders, products and inventory',
      ],
      planned: [
        'Verified Stripe integration',
        'Refunds through the payment provider',
        'Email notifications',
        'Automated tests and deployment',
      ],
    },
    architecture: {
      title: 'System architecture',
      caption: 'Pages and API routes share one service layer. Payments plug in behind a provider interface.',
      nodes: [
        { label: 'Astro', detail: 'Storefront · account · admin' },
        { label: 'Product / Order System', detail: 'Services · REST API' },
        { label: 'PostgreSQL', detail: 'Catalog · carts · orders' },
        { label: 'Payments API', detail: 'Test gateway · Stripe adapter', status: 'partial' },
      ],
    },
    flow: [
      { label: 'Product Discovery', detail: 'Catalog · search · filters' },
      { label: 'Product Database', detail: 'Products · variants · stock' },
      { label: 'Cart / Order', detail: 'Transactional checkout' },
      { label: 'Payment', detail: 'Test gateway · Stripe unverified', status: 'partial' },
      { label: 'Order Management', detail: 'Admin back office' },
    ],
    images: [
      {
        src: 'sellbytes/home.png',
        alt: 'The SellBytes storefront home page with a hero headline, product search and a featured gaming PC.',
        caption: 'Storefront',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/catalog.png',
        alt: 'The SellBytes catalog with a category tree, brand filters, sorting and product cards.',
        caption: 'Catalog and filters',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/product.png',
        alt: 'A SellBytes product page with an image gallery, variant picker, stock status and add-to-cart actions.',
        caption: 'Product page',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/cart.png',
        alt: 'The SellBytes cart with quantity controls, a free-shipping progress bar, an order summary and a discount code field.',
        caption: 'Cart',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/checkout.png',
        alt: 'The SellBytes checkout details step with contact and shipping forms and an order summary.',
        caption: 'Checkout',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/admin-dashboard.png',
        alt: 'The SellBytes admin dashboard with sales tiles, a daily revenue chart and orders by status, populated with seeded sample data.',
        caption: 'Admin dashboard (sample data)',
        kind: 'desktop',
      },
      {
        src: 'sellbytes/mobile-product.png',
        alt: 'A SellBytes product page at phone width with a compact header, search and image gallery.',
        caption: 'Product page on mobile',
        kind: 'mobile',
      },
    ],
    links: {
      github: 'https://github.com/enzmonz/Sellbytes',
      demo: null,
    },
    cinnabyte: true,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const statusTone: Record<ProjectStatus, 'accent' | 'warn' | 'info' | 'neutral'> = {
  Deployed: 'accent',
  'In Development': 'accent',
  'Academic Project': 'info',
  'Design Project': 'info',
  Concept: 'neutral',
};
