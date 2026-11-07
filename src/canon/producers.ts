import raw from "./producers.json";
import type { Producer } from "@/domain/types";

export const PRODUCERS: Producer[] = (raw as Producer[]).map((p) => ({
  id: p.id,
  num: p.num,
  name: p.name,
  tag: p.tag ?? "",
  internal: Boolean(p.internal),
  foundation: p.foundation ?? "",
  desc: p.desc,
}));

export function getProducer(id: string): Producer | undefined {
  return PRODUCERS.find((p) => p.id === id);
}

export const DEFAULT_PRODUCER_ID = "16-the-maestro";
