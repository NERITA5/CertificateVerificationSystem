import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 5 } })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;