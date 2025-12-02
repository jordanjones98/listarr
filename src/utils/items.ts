"use server";
import prisma from "./db";
import { Item } from "@prisma/client";

export async function setItemPurchasedQuantity(
  item: Item,
  purchasedQuantity: number,
) {
  const { id } = item;

  await prisma.item.update({
    where: {
      id,
    },
    data: {
      purchasedQuantity,
    },
  });
}

export async function createItem(data: {
  name: string;
  url: string;
  price: number;
  wantedQuantity: number;
  listId: number;
}) {
  return prisma.item.create({
    data,
  });
}

export async function updateItem(
  id: number,
  data: {
    name?: string;
    url?: string;
    price?: number;
    wantedQuantity?: number;
    purchasedQuantity?: number;
  },
) {
  return prisma.item.update({
    where: { id },
    data,
  });
}

export async function deleteItem(id: number) {
  return prisma.item.delete({
    where: { id },
  });
}
