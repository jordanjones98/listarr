import { getLists } from "@/utils/lists";
import Admin from "./Admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const lists = await getLists({ includeItems: false });

  return <Admin initialLists={lists} />;
}
