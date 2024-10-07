import { env, pipeline } from "@xenova/transformers";
import { useEffect, useState } from "react";
import { FeatureExtractionPipeline } from "../lib/types";

export const useModel = () => {
  const [model, setModel] = useState<FeatureExtractionPipeline | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        const featureExtractionPipeline = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2"
        );
        setModel(
          () => (input: string | string[]) =>
            featureExtractionPipeline(input, {
              pooling: "mean",
              normalize: true,
            })
        );
      } catch (error) {
        console.error("Error loading model:", error);
      }
    }
    loadModel();
  }, []);

  return model;
};
