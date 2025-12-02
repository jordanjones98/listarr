"use client";
import React from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Item } from "@prisma/client";
import { ListWithItems } from "@/utils/lists";
import { setItemPurchasedQuantity } from "@/utils/items";

function ItemImage({ item }: { item: Item }) {
  const [ogImage, setOgImage] = React.useState<string | null>(item.ogImage);
  const [loading, setLoading] = React.useState(!item.ogImage);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!item.ogImage && !ogImage) {
      fetch(`/api/og-image?itemId=${item.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ogImage) {
            setOgImage(data.ogImage);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [item.id, item.ogImage, ogImage]);

  if (loading) {
    return (
      <div className="w-full h-40 bg-gray-200 animate-pulse rounded-t-lg" />
    );
  }

  if (!ogImage || error) {
    return null;
  }

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-t-lg bg-gray-100">
      <Image
        src={ogImage}
        alt={item.name}
        fill
        className="object-contain"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

export default function List(props: { list: ListWithItems }) {
  const list = props.list;
  const [items, setItems] = React.useState(list.items);
  const [confirmItem, setConfirmItem] = React.useState<Item | null>(null);

  function handlePurchaseClick(e: React.MouseEvent, item: Item) {
    e.preventDefault();
    setConfirmItem(item);
  }

  function confirmPurchase() {
    if (!confirmItem) return;

    const purchasedQuantity = confirmItem.purchasedQuantity + 1;

    const newItems = items.map((mapItem: Item) =>
      mapItem.id === confirmItem.id
        ? { ...mapItem, purchasedQuantity }
        : mapItem,
    );

    setItemPurchasedQuantity(confirmItem, purchasedQuantity);

    setItems(newItems);
    setConfirmItem(null);
  }

  function purchased(item: Item) {
    return item.purchasedQuantity >= item.wantedQuantity;
  }

  function isUnlimitedQuantity(item: Item) {
    return item.wantedQuantity === -1;
  }

  return (
    <div key={list.id} className="mb-8">
      <Link
        href="/"
        className="inline-flex items-center text-primary hover:text-accent mb-4 transition-colors duration-200"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to All Lists
      </Link>
      <h1 className="text-4xl font-bold mb-8 text-center">{list.name}</h1>

      <AlertDialog
        open={confirmItem !== null}
        onOpenChange={(open) => !open && setConfirmItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark &quot;{confirmItem?.name}&quot; as
              purchased?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>
              Yes, Mark Purchased
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: Item) => (
          <Link
            key={item.id}
            href={item.url}
            target="_blank"
            className="block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
          >
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <ItemImage item={item} />
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
                      : "bg-primary hover:bg-accent"
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
