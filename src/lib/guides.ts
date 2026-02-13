import type { Guide } from "./model/guide";
import transportBusIcon from "$lib/assets/icons/transport-bus.png";
import documentsBigBenIcon from "$lib/assets/icons/documents-big-ben.png";
import communityBridgeIcon from "$lib/assets/icons/community-bridge.png";

export const londonGuides: Guide[] = [
  {
    id: "transport",
    title: "Set Up Transport Fast",
    icon: transportBusIcon,
    iconAlt: "Funny bus icon",
    difficulty: "Easy",
    whyItMatters:
      "London is easiest to navigate when your payment and route tools are ready.",
    quickWin:
      "Add your contactless card to your phone wallet and install Citymapper + TfL Go.",
    checklist: [
      "Enable contactless payment on your main card",
      "Download TfL Go for live Tube disruptions",
      "Learn the night bus routes near your home",
    ],
  },
  {
    id: "documents",
    title: "Sort Local Admin Basics",
    icon: documentsBigBenIcon,
    iconAlt: "Funny Big Ben icon",
    difficulty: "Medium",
    whyItMatters:
      "You will need local records for jobs, GP registration, and banking.",
    quickWin:
      "Keep proof of address ready and start your GP registration in week one.",
    checklist: [
      "Collect tenancy agreement or utility statement",
      "Register with a nearby GP surgery",
      "Store scans of passport and visa paperwork offline",
    ],
  },
  {
    id: "community",
    title: "Build Your Local Circle",
    icon: communityBridgeIcon,
    iconAlt: "Funny bridge icon",
    difficulty: "Easy",
    whyItMatters:
      "Settling in London is faster when you know your neighborhood and people.",
    quickWin:
      "Pick one local event this week and one place to become a regular.",
    checklist: [
      "Find a nearby library or community center",
      "Join one local WhatsApp/Meetup group",
      "Save emergency and non-emergency numbers in your phone",
    ],
  },
];
