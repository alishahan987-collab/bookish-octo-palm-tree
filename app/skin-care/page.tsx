import { CategoryPage, categoryMetadata } from "@/components/site/CategoryPage";

export const revalidate = 60;
export const metadata = categoryMetadata("skin");

export default function Page() {
  return <CategoryPage id="skin" />;
}
