"use client";
import React, { useState } from "react";
import { Item, List } from "@prisma/client";
import { ListWithItems } from "@/utils/lists";
import {
  createList,
  deleteList,
  getListByIdWithAllItems,
  updateList,
} from "@/utils/lists";
import { createItem, updateItem, deleteItem } from "@/utils/items";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Pencil, Copy, Check, X } from "lucide-react";

interface AdminProps {
  initialLists: List[];
}

interface ValidationErrors {
  name?: string;
  url?: string;
  price?: string;
  wantedQuantity?: string;
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Admin({ initialLists }: AdminProps) {
  const { toast } = useToast();
  const [lists, setLists] = useState<List[]>(initialLists);
  const [selectedList, setSelectedList] = useState<ListWithItems | null>(null);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // List editing state
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingListName, setEditingListName] = useState("");

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function validateItemForm(): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!itemForm.name.trim()) {
      errors.name = "Name is required";
    }

    if (!itemForm.url.trim()) {
      errors.url = "URL is required";
    } else if (!isValidUrl(itemForm.url.trim())) {
      errors.url = "Please enter a valid URL (starting with http:// or https://)";
    }

    if (!itemForm.price) {
      errors.price = "Price is required";
    } else {
      const price = parseFloat(itemForm.price);
      if (isNaN(price) || price < 0) {
        errors.price = "Price must be a positive number";
      }
    }

    const qty = parseInt(itemForm.wantedQuantity);
    if (isNaN(qty) || (qty < 1 && qty !== -1)) {
      errors.wantedQuantity = "Quantity must be at least 1 (or -1 for unlimited)";
    }

    return errors;
  }

  async function handleCreateList() {
    if (!newListName.trim()) {
      toast("Please enter a list name", "error");
      return;
    }
    setIsCreatingList(true);
    try {
      const newList = await createList(newListName.trim());
      setLists([...lists, newList]);
      setNewListName("");
      toast("List created successfully");
    } catch (error) {
      console.error("Failed to create list:", error);
      toast("Failed to create list", "error");
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
      toast("List deleted successfully");
    } catch (error) {
      console.error("Failed to delete list:", error);
      toast("Failed to delete list", "error");
    }
  }

  async function handleSelectList(list: List) {
    try {
      const fullList = await getListByIdWithAllItems(list.id);
      setSelectedList(fullList);
    } catch (error) {
      console.error("Failed to load list:", error);
      toast("Failed to load list", "error");
    }
  }

  function startEditingList(list: List, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingListId(list.id);
    setEditingListName(list.name);
  }

  async function saveListName(listId: number) {
    if (!editingListName.trim()) {
      toast("List name cannot be empty", "error");
      return;
    }
    try {
      const updated = await updateList(listId, editingListName.trim());
      setLists(lists.map((l) => (l.id === listId ? updated : l)));
      if (selectedList?.id === listId) {
        setSelectedList({ ...selectedList, name: updated.name });
      }
      setEditingListId(null);
      toast("List renamed successfully");
    } catch (error) {
      console.error("Failed to rename list:", error);
      toast("Failed to rename list", "error");
    }
  }

  function cancelEditingList() {
    setEditingListId(null);
    setEditingListName("");
  }

  function resetItemForm() {
    setItemForm({ name: "", url: "", price: "", wantedQuantity: "1", ogImage: "" });
    setEditingItem(null);
    setShowItemForm(false);
    setValidationErrors({});
  }

  async function fetchOgImageFromUrl(url: string): Promise<string | null> {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;

      const html = await response.text();

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
          if (imageUrl.startsWith("//")) {
            imageUrl = "https:" + imageUrl;
          } else if (!imageUrl.startsWith("http")) {
            imageUrl = new URL(imageUrl, url).href;
          }
          return imageUrl;
        }
      }

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

    const errors = validateItemForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast("Please fix the validation errors", "error");
      return;
    }

    setIsSaving(true);
    const price = parseFloat(itemForm.price);
    const wantedQuantity = parseInt(itemForm.wantedQuantity) || 1;
    let ogImage = itemForm.ogImage.trim() || null;

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
        toast("Item updated successfully");
      } else {
        await createItem({
          name: itemForm.name.trim(),
          url: itemForm.url.trim(),
          price,
          wantedQuantity,
          listId: selectedList.id,
          ogImage,
        });
        toast("Item created successfully");
      }
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
      resetItemForm();
    } catch (error) {
      console.error("Failed to save item:", error);
      toast("Failed to save item", "error");
    }
    setIsSaving(false);
  }

  async function handleDeleteItem(itemId: number) {
    if (!selectedList) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteItem(itemId);
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
      toast("Item deleted successfully");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast("Failed to delete item", "error");
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
    setValidationErrors({});
    setShowItemForm(true);
  }

  async function handleResetPurchased(item: Item) {
    if (!selectedList) return;
    try {
      await updateItem(item.id, { purchasedQuantity: 0 });
      const updatedList = await getListByIdWithAllItems(selectedList.id);
      setSelectedList(updatedList);
      toast("Purchase count reset");
    } catch (error) {
      console.error("Failed to reset item:", error);
      toast("Failed to reset item", "error");
    }
  }

  async function copyItemLink(item: Item, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      toast("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast("Failed to copy link", "error");
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl sm:text-5xl text-primary mb-5">Admin</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lists Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Lists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              {/* Create new list */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                  placeholder="New list name..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm min-w-0"
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
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors gap-2 ${
                      selectedList?.id === list.id
                        ? "bg-red-100 border border-red-300"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectList(list)}
                  >
                    {editingListId === list.id ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveListName(list.id);
                            if (e.key === "Escape") cancelEditingList();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-1 border rounded text-sm min-w-0"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveListName(list.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditingList();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium truncate flex-1">{list.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => startEditingList(list, e)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
                      </>
                    )}
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
                <CardTitle className="truncate">{selectedList.name} - Items</CardTitle>
                <Button
                  onClick={() => {
                    resetItemForm();
                    setShowItemForm(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {/* Item Form */}
                {showItemForm && (
                  <div className="mb-6 p-4 border rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-3">
                      {editingItem ? "Edit Item" : "Add New Item"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={itemForm.name}
                          onChange={(e) => {
                            setItemForm({ ...itemForm, name: e.target.value });
                            if (validationErrors.name) {
                              setValidationErrors({ ...validationErrors, name: undefined });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md ${
                            validationErrors.name ? "border-red-500" : ""
                          }`}
                          placeholder="Item name"
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">URL *</label>
                        <input
                          type="url"
                          value={itemForm.url}
                          onChange={(e) => {
                            setItemForm({ ...itemForm, url: e.target.value });
                            if (validationErrors.url) {
                              setValidationErrors({ ...validationErrors, url: undefined });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md ${
                            validationErrors.url ? "border-red-500" : ""
                          }`}
                          placeholder="https://..."
                        />
                        {validationErrors.url && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.url}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemForm.price}
                          onChange={(e) => {
                            setItemForm({ ...itemForm, price: e.target.value });
                            if (validationErrors.price) {
                              setValidationErrors({ ...validationErrors, price: undefined });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md ${
                            validationErrors.price ? "border-red-500" : ""
                          }`}
                          placeholder="0.00"
                        />
                        {validationErrors.price && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Wanted Quantity *
                        </label>
                        <input
                          type="number"
                          min="-1"
                          value={itemForm.wantedQuantity}
                          onChange={(e) => {
                            setItemForm({ ...itemForm, wantedQuantity: e.target.value });
                            if (validationErrors.wantedQuantity) {
                              setValidationErrors({ ...validationErrors, wantedQuantity: undefined });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md ${
                            validationErrors.wantedQuantity ? "border-red-500" : ""
                          }`}
                          placeholder="1 (or -1 for unlimited)"
                        />
                        {validationErrors.wantedQuantity && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.wantedQuantity}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">Use -1 for unlimited</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Image URL (optional)
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
                        <p className="text-gray-500 text-xs mt-1">Leave empty to auto-fetch from product URL</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <Button onClick={handleSaveItem} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? "Saving..." : editingItem ? "Update" : "Create"}
                      </Button>
                      <Button variant="outline" onClick={resetItemForm} className="w-full sm:w-auto">
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md bg-white gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
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
                          className="text-sm text-blue-600 hover:underline truncate block"
                        >
                          View Link
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => copyItemLink(item, e)}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span className="hidden sm:inline">Copy Link</span>
                        </Button>
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
                  Select a list from {typeof window !== "undefined" && window.innerWidth < 1024 ? "above" : "the left"} to manage its items.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
