import React from "react";
import { getLists } from "@/utils/lists";
import { ListWithItems } from "@/utils/lists";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Item } from "@prisma/client";
import { Gift, ChevronRight } from "lucide-react";

export default async function LaurenGrid() {
  const lists = await getLists({ includeItems: true });

  function getListItemCount(items: Item[]) {
    let itemCount = 0;

    items.map((item) => {
      if (item.purchasedQuantity !== item.wantedQuantity) {
        itemCount++;
      }
    });
    return itemCount;
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
          Christmas Lists
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Find the perfect gift for everyone
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {lists.map((list: ListWithItems) => (
          <Link
            key={list.id}
            href={`lists/${list.id}`}
            className="group block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          >
            <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-semibold group-hover:text-primary transition-colors">
                  {list.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
                    {getListItemCount(list.items)}
                  </span>
                  <span className="text-muted-foreground">
                    {getListItemCount(list.items) === 1 ? "item" : "items"} remaining
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
