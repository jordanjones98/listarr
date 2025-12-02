"use client";
import React, { useState } from "react";
import { Item, List } from "@prisma/client";
import { ListWithItems } from "@/utils/lists";
import {
  createList,
  deleteList,
  getListByIdWithAllItems,
} from "@/utils/lists";
import { createItem, updateItem, deleteItem } from "@/utils/items";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminProps {
  initialLists: List[];
}

export default function Admin({ initialLists }: AdminProps) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [selectedList, setSelectedList] = useState<ListWithItems | null>(null);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    url: "",
    price: "",
    wantedQuantity: "1",
    ogImage: "",
  });

  async function handleCreateList() {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const newList = await createList(newListName.trim());
      setLists([...lists, newList]);
      setNewListName("");
    } catch (error) {
      console.error("Failed to create list:", error);
    }
    setIsCreatingList(false);
  }

  async function handleDeleteList(id: number) {
    if (!confirm("Are you sure you want to delete this list and all its items?")) {
      return;
    }
    try {
      await deleteList(id);
      setLists(lists.filter((l) => l.id !== id));
      if (selectedList?.id === id) {
        setSelectedList(null);
      }
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  }

  async function handleSelectList(list: List) {
    try {
      const fullList = await getListByIdWithAllItems(list.id);
      setSelectedList(fullList);
    } catch (error) {
      console.error("Failed to load list:", error);
    }
  }

  function resetItemForm() {
    setItemForm({ name: "", url: "", price: "", wantedQuantity: "1", ogImage: "" });
    setEditingItem(null);
    setShowItemForm(false);
  }

  async function fetchOgImageFromUrl(url: string): Promise<string | null> {
    try {
      // Use a CORS proxy to fetch the page client-side
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;

      const html = await response.text();

      // Try various meta tag patterns
      const patterns = [
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
        /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i,
        /<meta[^>]*(?:name|property)=["']_fbImage["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']_fbImage["']/i,
        /<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i,
        /<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          let imageUrl = match[1];
          // Resolve relative URLs
          if (imageUrl.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          } else if (!imageUrl.startsWith("http")) {
            imageUrl = new URL(imageUrl, url).href;
          }
          return imageUrl;
        }
      }

      // Try JSON-LD
      const jsonLdMatch = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
      );
      if (jsonLdMatch) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          if (data.image) {
            if (typeof data.image === "string") return data.image;
            if (Array.isArray(data.image) && data.image[0]) {
              return typeof data.image[0] === "string" ? data.image[0] : data.image[0].url;
            }
            if (data.image.url) return data.image.url;
          }
        } catch {
          // Invalid JSON
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch OG image:", error);
      return null;
    }
  }

  async function handleSaveItem() {
    if (!selectedList) return;
    if (!itemForm.name.trim() || !itemForm.url.trim() || !itemForm.price) return;

    const price = parseFloat(itemForm.price);
    const wantedQuantity = parseInt(itemForm.wantedQuantity) || 1;
    let ogImage = itemForm.ogImage.trim() || null;

    // If no image URL provided, try to fetch it client-side
    if (!ogImage && itemForm.url.trim()) {
      ogImage = await fetchOgImageFromUrl(itemForm.url.trim());
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          name: itemForm.name.trim(),
          url: itemForm.url.trim(),
          price,
          wantedQuantity,
          ogImage,
        });
      } else {
        await createItem({
          name: itemForm.name.trim(),
          url: itemForm.url.trim(),
          price,
          wantedQuantity,
          listId: selectedList.id,
          ogImage,
        });
      }
      // Refresh the list
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
      resetItemForm();
    } catch (error) {
      console.error("Failed to save item:", error);
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!selectedList) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteItem(itemId);
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      url: item.url,
      price: item.price.toString(),
      wantedQuantity: item.wantedQuantity.toString(),
      ogImage: item.ogImage || "",
    });
    setShowItemForm(true);
  }

  async function handleResetPurchased(item: Item) {
    if (!selectedList) return;
    try {
      await updateItem(item.id, { purchasedQuantity: 0 });
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
    } catch (error) {
      console.error("Failed to reset item:", error);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-5xl text-primary mb-5">Admin</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create new list */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                  placeholder="New list name..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button
                  onClick={handleCreateList}
                  disabled={isCreatingList || !newListName.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>

              {/* List of lists */}
              <div className="space-y-2">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                      selectedList?.id === list.id
                        ? "bg-red-100 border border-red-300"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectList(list)}
                  >
                    <span className="font-medium">{list.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {lists.length === 0 && (
                  <p className="text-gray-500 text-sm">No lists yet. Create one above.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Panel */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedList.name} - Items</CardTitle>
                <Button
                  onClick={() => {
                    resetItemForm();
                    setShowItemForm(true);
                  }}
                >
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {/* Item Form */}
                {showItemForm && (
                  <div className="mb-6 p-4 border rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-3">
                      {editingItem ? "Edit Item" : "Add New Item"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Item name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input
                          type="url"
                          value={itemForm.url}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, url: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={itemForm.price}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, price: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Wanted Quantity (-1 for unlimited)
                        </label>
                        <input
                          type="number"
                          value={itemForm.wantedQuantity}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, wantedQuantity: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Image URL (optional - auto-fetched if empty)
                        </label>
                        <input
                          type="url"
                          value={itemForm.ogImage}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, ogImage: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="https://... (leave empty to auto-fetch)"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveItem}>
                        {editingItem ? "Update" : "Create"}
                      </Button>
                      <Button variant="outline" onClick={resetItemForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {selectedList.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-md bg-white"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.price} |{" "}
                          {item.wantedQuantity === -1
                            ? "Unlimited"
                            : `${item.purchasedQuantity}/${item.wantedQuantity} purchased`}
                        </p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Link
                        </a>
                      </div>
                      <div className="flex gap-2">
                        {item.purchasedQuantity > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPurchased(item)}
                          >
                            Reset
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedList.items.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No items in this list. Click &quot;Add Item&quot; to add one.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-gray-500 text-center">
                  Select a list from the left to manage its items.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
