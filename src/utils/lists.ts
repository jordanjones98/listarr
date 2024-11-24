"use server";
import prisma from "./db";
import { Item } from "@prisma/client";

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
      items: true,
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
