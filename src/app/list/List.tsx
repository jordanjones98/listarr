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
import { ChevronLeft, Package, ExternalLink, Check } from "lucide-react";
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
      <div className="w-full h-48 bg-gradient-to-br from-secondary to-muted animate-pulse rounded-t-xl" />
    );
  }

  if (!ogImage || error) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-secondary to-muted rounded-t-xl flex items-center justify-center">
        <Package className="w-12 h-12 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-t-xl bg-gradient-to-br from-secondary to-muted">
      <Image
        src={ogImage}
        alt={item.name}
        fill
        className="object-contain p-2"
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
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-6 transition-colors duration-200 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to All Lists</span>
      </Link>
      <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {list.name}
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        {items.filter((i) => !purchased(i)).length} items remaining
      </p>

      <AlertDialog
        open={confirmItem !== null}
        onOpenChange={(open) => !open && setConfirmItem(null)}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to mark &quot;{confirmItem?.name}&quot; as
              purchased?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase} className="rounded-lg bg-primary hover:bg-primary/90">
              Yes, Mark Purchased
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item: Item) => (
          <Link
            key={item.id}
            href={item.url}
            target="_blank"
            className="group block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          >
            <Card className={`flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-2 ${
              purchased(item)
                ? "border-accent/30 bg-accent/5"
                : "border-transparent hover:border-primary/20 hover:shadow-primary/10"
            }`}>
              <div className="relative">
                <ItemImage item={item} />
                {purchased(item) && (
                  <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                    <Check className="w-3 h-3" />
                    Purchased
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-foreground">
                  ${item.price}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isUnlimitedQuantity(item) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      No limit
                    </span>
                  ) : (
                    <>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (item.purchasedQuantity / item.wantedQuantity) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {item.purchasedQuantity}/{item.wantedQuantity}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto pt-0">
                {!isUnlimitedQuantity(item) ? (
                  <button
                    disabled={purchased(item)}
                    onClick={(event) => handlePurchaseClick(event, item)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                      purchased(item)
                        ? "bg-accent/20 text-accent cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                    }`}
                  >
                    {purchased(item) ? (
                      <>
                        <Check className="w-4 h-4" />
                        All Purchased
                      </>
                    ) : (
                      "Mark Purchased"
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3 px-4 rounded-lg font-medium text-center bg-secondary text-secondary-foreground flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Item
                  </div>
                )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
