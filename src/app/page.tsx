import React from "react";
import { getLists } from "@/utils/lists";
import { ListWithItems } from "@/utils/lists";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function LaurenGrid() {
  const lists = await getLists({ includeItems: true });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-5xl text-primary mb-5">Christmas Lists</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list: ListWithItems) => (
          <Link
            key={list.id}
            href={`lists/${list.id}`}
            className="block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
          >
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl">{list.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-700">
                  {list.items.length} Items
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
