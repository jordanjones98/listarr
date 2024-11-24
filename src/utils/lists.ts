"use server";
import prisma from "./db";
import { Item, List } from "@prisma/client";

export type ListWithItems = List & { items: Item[] };

export async function getLists(
  options: { includeItems: boolean } = { includeItems: false },
) {
  const { includeItems } = options;
  return prisma.list.findMany({
    include: {
      items: includeItems,
    },
  });
}

export async function getListById(id: number) {
  return prisma.list.findFirst({
    where: {
      id,
    },
    include: {
      items: { orderBy: { name: "asc" } },
    },
  });
}

export async function addItemToList(item: Item) {
  const { name, url, price, listId } = item;
  await prisma.item.create({
    data: {
      name,
      url,
      price,
      listId,
    },
  });
}
