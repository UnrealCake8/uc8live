export type LiveRoom = {
  slug: string;
  title: string;
  creator: string;
  category: string;
  viewers: string;
  description: string;
  accent: string;
  initials: string;
  featured?: boolean;
};

export const rooms: LiveRoom[] = [
  { slug: "late-afternoon", title: "late afternoon hangout", creator: "uc8 studio", category: "Just Chatting", viewers: "1.2K", description: "Making things, sharing ideas, and seeing where the day goes.", accent: "forest", initials: "UC", featured: true },
  { slug: "pixel-workshop", title: "building a tiny pixel world", creator: "mossybyte", category: "Art", viewers: "847", description: "Cozy game art, tiny trees, and an unreasonable number of pixels.", accent: "violet", initials: "MB" },
  { slug: "midnight-runs", title: "midnight runs & rare finds", creator: "neonmiles", category: "Music", viewers: "603", description: "A late-night vinyl set for wherever you are.", accent: "orange", initials: "NM" },
  { slug: "slow-kitchen", title: "sunday pasta from scratch", creator: "olive & salt", category: "Food & Drink", viewers: "391", description: "Flour on the counter, sauce on the stove. Come cook with us.", accent: "gold", initials: "OS" },
  { slug: "ranked-reset", title: "the ranked reset begins", creator: "eightbit", category: "Strategy", viewers: "266", description: "Climbing carefully. Mostly carefully.", accent: "blue", initials: "8B" },
  { slug: "city-sketchbook", title: "drawing the city from memory", creator: "linebyline", category: "Creative", viewers: "184", description: "An open sketchbook and stories from the street.", accent: "rose", initials: "LL" },
];

export const roomSlugs = new Set(rooms.map((room) => room.slug));

export function getRoom(slug: string) {
  return rooms.find((room) => room.slug === slug);
}
