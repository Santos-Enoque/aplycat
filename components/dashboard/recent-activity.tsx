"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getImprovements, deleteImprovement } from "@/lib/idb";
import { FileText, Clock, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RecentActivity() {
  const [improvements, setImprovements] = useState<any[]>([]);

  useEffect(() => {
    async function loadImprovements() {
      const items = await getImprovements();
      setImprovements(items);
    }
    loadImprovements();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteImprovement(id);
    setImprovements(improvements.filter((item) => item.id !== id));
  };

  if (improvements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No recent activity found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resume For</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {improvements.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link href={`/improved-resume/stream?id=${item.id}`}>
                    <div className="flex items-center gap-2 hover:underline">
                      <FileText className="h-4 w-4" />
                      <span>
                        {item.targetRole} at {item.targetIndustry}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 