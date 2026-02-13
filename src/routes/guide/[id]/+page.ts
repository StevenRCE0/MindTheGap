import { error } from "@sveltejs/kit";
import { londonGuides } from "$lib/guides";

export function load({ params }) {
  const guide = londonGuides.find((item) => item.id === params.id);

  if (!guide) {
    throw error(404, "Guide not found or not yet cached");
  }

  return { guide };
}
