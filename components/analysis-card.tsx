"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface AnalysisCardProps {
  title: string;
  items: string[] | any[];
  type: "positive" | "negative" | "neutral";
}

export function AnalysisCard({ title, items, type }: AnalysisCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case "positive":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "negative":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "neutral":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCardStyle = () => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      case "neutral":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTitleStyle = () => {
    switch (type) {
      case "positive":
        return "text-green-800";
      case "negative":
        return "text-red-800";
      case "neutral":
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  const getItemStyle = () => {
    switch (type) {
      case "positive":
        return "text-green-700";
      case "negative":
        return "text-red-700";
      case "neutral":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <Card className={`${getCardStyle()}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 ${getTitleStyle()}`}>
          {getIcon()}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className={`text-sm ${getItemStyle()}`}>
              <div className="flex items-start space-x-2">
                <span className="font-medium text-xs mt-1">•</span>
                <span>
                  {typeof item === "string" ? (
                    item
                  ) : (
                    <div>
                      <div className="font-medium">
                        {item.issue || item.title || "Item"}
                      </div>
                      {item.tip && (
                        <div className="text-xs opacity-75 mt-1">
                          {item.tip}
                        </div>
                      )}
                      {item.example && (
                        <div className="text-xs opacity-60 mt-1 italic">
                          Example: {item.example}
                        </div>
                      )}
                    </div>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
