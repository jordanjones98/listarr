"use server";
import prisma from "./db";

export async function purchaseItem(item: Item) {
  const { purchasedQuantity, id } = item;

  await prisma.item.update({
    where: {
      id,
    },
    data: {
      purchasedQuantity: purchasedQuantity + 1,
    },
  });
}
