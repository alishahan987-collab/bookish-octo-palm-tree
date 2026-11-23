import { Home } from "@/components/home/Home";
import { getConditionsList, getProcedures, getPublicGallery, getPublishedPosts } from "@/lib/server/data";

export const revalidate = 60;

export default async function HomePage() {
  const [treatments, conditions, posts, gallery] = await Promise.all([getProcedures(), getConditionsList(), getPublishedPosts(), getPublicGallery()]);
  return <Home initial={{ treatments, conditions, posts, gallery }} />;
}
