import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
// TODO: Create uploadthing API route if needed
// import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<any>();
export const UploadDropzone = generateUploadDropzone<any>(); 