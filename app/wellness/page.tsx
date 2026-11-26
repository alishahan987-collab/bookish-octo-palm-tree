import { CategoryPage, categoryMetadata } from "@/components/site/CategoryPage";

export const revalidate = 60;
export const metadata = categoryMetadata("wellness");

export default function Page() {
  return <CategoryPage id="wellness" />;
}
