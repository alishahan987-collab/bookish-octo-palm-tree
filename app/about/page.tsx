import type { Metadata } from "next";
import { AboutView } from "@/components/site/Details";
import { getSite } from "@/lib/server/data";

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSite();
  return { title: `About ${content.doctor.name}`, description: content.doctor.shortIntro };
}
export default function AboutPage() {
  return <AboutView />;
}
