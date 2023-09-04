import { defineCollection } from "astro:content";
import { blogSchema } from "./_schemas";

const blog = defineCollection({
  schema: blogSchema,
});

export const collections = { blog };
