import { Article, articleMetadata, articleParams } from "@/components/Article";

type Props = { params: Promise<{ slug: string }> };

// Known slugs are prerendered at build; new ones render on first request, then stay cached.
export const generateStaticParams = () => articleParams("note");

export async function generateMetadata({ params }: Props) {
  return articleMetadata("note", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <Article kind="note" slug={(await params).slug} />;
}
