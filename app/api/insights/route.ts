"use server";

import { env, pipeline } from "@xenova/transformers";
import { NextRequest, NextResponse } from "next/server";

env.backends.onnx.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

type QuestionAnsweringPipeline = {
  (question: string, context: string): Promise<{ answer: string }>;
};

let qa: QuestionAnsweringPipeline | null = null;

async function setupModel(): Promise<void> {
  if (!qa) {
    qa = (await pipeline(
      "question-answering",
      "Xenova/distilbert-base-cased-distilled-squad"
    )) as QuestionAnsweringPipeline;
  }
}

async function extractFeature(
  abstract: string,
  question: string
): Promise<string> {
  if (!qa) {
    await setupModel();
  }
  const result = await qa!(question, abstract);
  return result.answer;
}

async function extractFeatures(
  abstract: string
): Promise<{ [key: string]: string }> {
  const features = {
    main_outcome: "What is the main finding or outcome of this research?",
    methodology: "What methodology or approach was used in this research?",
  };

  const results: { [key: string]: string } = {};

  for (const [feature, question] of Object.entries(features)) {
    results[feature] = await extractFeature(abstract, question);
  }

  return results;
}

function validateAndCleanFeatures(features: { [key: string]: string }): {
  [key: string]: string;
} {
  const cleanFeatures: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(features)) {
    const cleanedValue = value.replace(/<\/?s>/g, "").trim();

    if (cleanedValue && !/^[^\w\s]+$/.test(cleanedValue)) {
      cleanFeatures[key] = cleanedValue;
    }
  }

  return cleanFeatures;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abstract } = body;

    if (!abstract) {
      return NextResponse.json(
        { error: "Abstract is required" },
        { status: 400 }
      );
    }

    await setupModel(); // Ensure model is set up before processing
    const rawFeatures = await extractFeatures(abstract);
    const cleanFeatures = validateAndCleanFeatures(rawFeatures);

    return NextResponse.json(cleanFeatures);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
