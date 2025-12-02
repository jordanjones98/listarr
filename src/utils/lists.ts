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
      items: {
        where: {
          NOT: {
            purchasedQuantity: {
              equals: prisma.item.fields.wantedQuantity,
            },
          },
        },
        orderBy: { name: "asc" },
      },
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

export async function createList(name: string) {
  return prisma.list.create({
    data: {
      name,
    },
  });
}

export async function deleteList(id: number) {
  // Delete all items in the list first
  await prisma.item.deleteMany({
    where: {
      listId: id,
    },
  });
  // Then delete the list
  return prisma.list.delete({
    where: {
      id,
    },
  });
}

export async function getListByIdWithAllItems(id: number) {
  return prisma.list.findFirst({
    where: {
      id,
    },
    include: {
      items: {
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function updateList(id: number, name: string) {
  return prisma.list.update({
    where: { id },
    data: { name },
  });
}
