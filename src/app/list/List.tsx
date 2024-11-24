"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { Item, List } from "@prisma/client";

export default function List(props: { list: List }) {
  const list = props.list;
  const [items, setItems] = React.useState(list.items);

  function handlePurchaseClick(e: any, item: Item) {
    console.log("purchased item");
    e.preventDefault();

    const newItems = items.map((mapItem: Item) =>
      mapItem.id === item.id
        ? { ...mapItem, purchasedQuantity: mapItem.purchasedQuantity + 1 }
        : mapItem,
    );
    setItems(newItems);
  }

  function purchased(item: Item) {
    return item.purchasedQuantity >= item.wantedQuantity;
  }

  function isUnlimitedQuantity(item: Item) {
    return item.wantedQuantity === -1;
  }

  return (
    <div key={list.id} className="mb-8">
      <h1 className="text-4xl font-bold mb-8 text-center">{list.name}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: Item) => (
          <Link
            key={item.id}
            href={item.url}
            target="_blank"
            className="block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
          >
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-700">
                  ${item.price}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  {isUnlimitedQuantity(item) ? (
                    <>No Purchase Limit</>
                  ) : (
                    <>
                      {item.purchasedQuantity} out of {item.wantedQuantity}{" "}
                      purchased
                    </>
                  )}
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                {!isUnlimitedQuantity(item) && (
                  <button
                    disabled={purchased(item)}
                    onClick={(event) => handlePurchaseClick(event, item)}
                    className={`w-full py-2 px-4 rounded-md text-white text-center transition-colors duration-200
                  ${
                    purchased(item)
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  >
                    {purchased(item) ? "Purchased!" : "Mark Purchased"}
                  </button>
                )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
