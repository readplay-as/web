/**
 * All page copy and destinations live here. readplay.app is the company page:
 * 3steps.no sells the product, this page says who builds it and what else
 * they make. English throughout; Norwegian product names stay as proper nouns.
 */

export const CONTACT_EMAIL = "mkm@readplay.app";

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", active: true },
  { label: "3steps", href: "https://3steps.no" },
  { label: "News", href: "https://3steps.news" },
  { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
];

export const signIn = {
  label: "Sign in",
  href: "https://3steps.no/dashboard",
};

/**
 * The avatar stack beside the trust line. An entry with no `src` renders the
 * placeholder silhouette; give it a `src` (and `alt`) once we have portraits
 * we have permission to publish.
 */
export interface TrustAvatar {
  src?: string;
  alt?: string;
}

export const trustAvatars: TrustAvatar[] = [{}, {}, {}];

export const trustText = "Built with some of the world's best coaches";

/** Two lines, rendered in the display font. Each must stay short enough not to wrap. */
export const headlineLines = ["Read The Game", "Play It Better"];

export const subhead =
  "We make professional-grade analytics accessible to every club — not just the ones with an analyst on staff.";

export const cta = {
  label: "Get in touch",
  href: `mailto:${CONTACT_EMAIL}`,
};

export interface Product {
  name: string;
  /** Shown on desktop only — on mobile the row collapses to name + status. */
  description: string;
  /** Live products link out; unreleased ones carry a status instead. */
  href?: string;
  status?: string;
  delay: string;
}

export const products: Product[] = [
  {
    name: "3steps",
    description: "Match analytics and team management",
    href: "https://3steps.no",
    delay: "0.5s",
  },
  {
    name: "3steps.news",
    description: "European handball news, every day",
    href: "https://3steps.news",
    delay: "0.58s",
  },
  {
    name: "Partnerportalen",
    description: "Clubs and their sponsors, one network",
    status: "Launching soon",
    delay: "0.66s",
  },
];

/** Set orgNumber once we have it — the segment is omitted while it is empty. */
export const company = {
  legalName: "Readplay AS",
  orgNumber: "",
  country: "Norway",
};

export const meta = {
  title: "Read The Game. Play It Better.",
  description: subhead,
  ogImage: "/og.png",
};
