import type { BulkOperation } from "@/types/resume-library";

export async function processBulkOperation(operation: BulkOperation) {
  const response = await fetch("/api/dashboard/bulk-operations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(operation),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Bulk operation failed");
  }

  return response.json();
}

export async function checkBulkOperationStatus(jobId: string) {
  const response = await fetch(`/api/dashboard/bulk-operations/${jobId}`);
  
  if (!response.ok) {
    throw new Error("Failed to check operation status");
  }

  return response.json();
}