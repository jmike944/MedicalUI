// Generates the illustrated avatars in public/avatars from fixed seeds.
// Run with `npm run avatars`. Output is committed, so the app has no runtime avatar dependency.
// Style: DiceBear "Notionists" by Zoish, licensed CC0 1.0.
import { mkdir, writeFile } from "node:fs/promises"
import { createAvatar } from "@dicebear/core"
import { notionists } from "@dicebear/collection"

const people = [
  ["maria-lopez", "8fd3dc"],
  ["james-carter", "a9c1ff"],
  ["aisha-bello", "b9a8ff"],
  ["devon-price", "b7e39a"],
  ["carlos-mendes", "8fb4ff"],
  ["priya-raman", "ffc59e"],
  ["rosa-delgado", "7fcfc4"],
  ["tanya-brooks", "ffb3c4"],
  ["elena-ruiz", "ffd98a"],
  ["jordan-hale", "c3cae8"],
]

const outDir = new URL("../public/avatars/", import.meta.url)
await mkdir(outDir, { recursive: true })

for (const [id, background] of people) {
  const svg = createAvatar(notionists, {
    seed: id,
    backgroundColor: [background],
    scale: 110,
    translateY: 4,
  }).toString()
  await writeFile(new URL(`${id}.svg`, outDir), svg)
}

console.log(`Wrote ${people.length} avatars to public/avatars`)
