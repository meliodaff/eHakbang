import type { LifeEvent } from "./types";

/**
 * Predefined life-event shortcut cards (PRD FR-02).
 * The first 8 (`common: true`) show by default in a 2-column grid; the rest
 * appear under a "More events" expansion.
 */
export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: "got-married",
    emoji: "💍",
    label: "Bagong Kasal",
    sublabel: "Got Married",
    description: "I recently got married and need to update my government records.",
    common: true,
  },
  {
    id: "had-a-baby",
    emoji: "👶",
    label: "Bagong Panganak",
    sublabel: "Had a Baby",
    description: "I just had a baby and want to register the birth and claim benefits.",
    common: true,
  },
  {
    id: "lost-a-job",
    emoji: "💼",
    label: "Nawalan ng Trabaho",
    sublabel: "Lost a Job",
    description: "I lost my job and want to know what benefits I can claim.",
    common: true,
  },
  {
    id: "retired",
    emoji: "🏖️",
    label: "Nagretiro",
    sublabel: "Retired",
    description: "I am retiring and need to claim my pension and benefits.",
    common: true,
  },
  {
    id: "started-a-business",
    emoji: "🏪",
    label: "Nagnegosyo",
    sublabel: "Started a Business",
    description: "I am starting a business and need to register it with the government.",
    common: true,
  },
  {
    id: "became-senior",
    emoji: "🧓",
    label: "Senior Citizen",
    sublabel: "Became a Senior Citizen",
    description: "I just turned 60 and want to claim my senior citizen benefits.",
    common: true,
  },
  {
    id: "became-pwd",
    emoji: "♿",
    label: "Naging PWD",
    sublabel: "Became a PWD",
    description: "I became a person with disability and want to register and claim benefits.",
    common: true,
  },
  {
    id: "death-in-family",
    emoji: "🕊️",
    label: "Pagpanaw sa Pamilya",
    sublabel: "Death in the Family",
    description: "A family member passed away and I need to process death and claim benefits.",
    common: true,
  },
  // --- More events ---
  {
    id: "just-graduated",
    emoji: "🎓",
    label: "Bagong Graduate",
    sublabel: "Just Graduated",
    description: "I just graduated and am preparing to look for my first job.",
    common: false,
  },
  {
    id: "first-job",
    emoji: "🧑‍💼",
    label: "Unang Trabaho",
    sublabel: "Started First Job",
    description: "I am starting my first job and need to register with government agencies.",
    common: false,
  },
  {
    id: "moved-residence",
    emoji: "🏠",
    label: "Lumipat ng Bahay",
    sublabel: "Moved Residence",
    description: "I moved to a new address and need to update my records.",
    common: false,
  },
];

export const COMMON_LIFE_EVENTS = LIFE_EVENTS.filter((e) => e.common);
export const MORE_LIFE_EVENTS = LIFE_EVENTS.filter((e) => !e.common);

export function getLifeEventById(id: string): LifeEvent | undefined {
  return LIFE_EVENTS.find((e) => e.id === id);
}
