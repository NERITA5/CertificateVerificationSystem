import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define the route for document uploads
  documentUploader: f({ 
    pdf: { 
      maxFileSize: "4MB", 
      maxFileCount: 5 
    } 
  })
    .onUploadComplete(async ({ file }) => {
      // Return the new ufsUrl to avoid the deprecation warning
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;