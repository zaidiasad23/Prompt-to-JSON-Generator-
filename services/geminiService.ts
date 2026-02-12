export const generatePromptsBatch = async (
  formState: any,
  quantity: number
): Promise<string[]> => {
  return Array.from({ length: quantity }, (_, i) =>
    `Generated prompt ${i + 1} for ${formState.keyword}`
  );
};
