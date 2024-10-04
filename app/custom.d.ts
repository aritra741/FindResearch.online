declare module "@xenova/transformers";

type PipelineReturnType = ReturnType<typeof pipeline>;
declare module "@xenova/transformers" {
  export function sentence_transformers(modelName: string): Promise<unknown>;
}
