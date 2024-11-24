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
