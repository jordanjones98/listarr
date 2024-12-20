"use server";

import List from "@/app/list/List";
import { getListById } from "@/utils/lists";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
