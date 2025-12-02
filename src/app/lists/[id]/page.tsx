"use server";

import List from "@/app/list/List";
import { getListById } from "@/utils/lists";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const list = await getListById(Number(id));

  if (!list) {
    return {
      title: "List Not Found",
    };
  }

  const itemCount = list.items.length;
  const description = `${itemCount} item${itemCount !== 1 ? "s" : ""} remaining on ${list.name}`;

  return {
    title: list.name,
    description,
    openGraph: {
      title: list.name,
      description,
      images: [
        {
          url: `/api/og-image/list?listId=${list.id}`,
          width: 1200,
          height: 630,
          alt: list.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: list.name,
      description,
      images: [`/api/og-image/list?listId=${list.id}`],
    },
  };
}

export default async function Page({ params }: Props) {
  const id = (await params).id;
  const list = await getListById(Number(id));
  return (
    <div className="container mx-auto p-6">
      {list ? (
        <List list={list} />
      ) : (
        <h1 className="text-5xl">List Not Found</h1>
      )}
    </div>
  );
}
