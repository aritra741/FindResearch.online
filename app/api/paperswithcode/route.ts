import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page");

  if (!query || !page) {
    return NextResponse.json(
      { error: "Missing query or page parameter" },
      { status: 400 }
    );
  }

  try {
    const url = `https://paperswithcode.com/api/v1/search/?q=${encodeURIComponent(
      query
    )}&page=${page}`;
    const response = await axios.get(url);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching Papers with Code articles:", error);
    return NextResponse.json(
      { error: "Error fetching articles" },
      { status: 500 }
    );
  }
}
