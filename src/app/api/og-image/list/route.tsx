import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/utils/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const listId = searchParams.get("listId");

  if (!listId) {
    return new Response("listId is required", { status: 400 });
  }

  const id = parseInt(listId, 10);
  if (isNaN(id)) {
    return new Response("Invalid listId", { status: 400 });
  }

  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      items: {
        where: {
          NOT: {
            purchasedQuantity: {
              equals: prisma.item.fields.wantedQuantity,
            },
          },
        },
      },
    },
  });

  if (!list) {
    return new Response("List not found", { status: 404 });
  }

  const itemCount = list.items.length;

  // Colors matching the app's theme
  const primary = "#c41e3a"; // rose/cranberry (350 75% 45%)
  const accent = "#2d8659"; // forest green (145 50% 35%)

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7f5",
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(45, 134, 89, 0.1) 0%, transparent 30%), radial-gradient(ellipse at bottom right, rgba(196, 30, 58, 0.05) 0%, transparent 25%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            borderRadius: "24px",
            padding: "60px 150px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            border: "2px solid rgba(45, 134, 89, 0.1)",
          }}
        >
          {/* Gift icon circle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "rgba(196, 30, 58, 0.1)",
              marginBottom: 20,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="8" width="18" height="4" rx="1" />
              <path d="M12 8v13" />
              <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
              <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
            </svg>
          </div>

          {/* List name with gradient effect */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
              backgroundClip: "text",
              color: "transparent",
              textAlign: "center",
              marginBottom: 24,
              maxWidth: 900,
              lineHeight: 1.2,
            }}
          >
            {list.name}
          </div>

          {/* Item count */}
          <div
            style={{
              fontSize: 28,
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(45, 134, 89, 0.15)",
                color: accent,
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              {itemCount}
            </span>
            <span>item{itemCount !== 1 ? "s" : ""} remaining</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
