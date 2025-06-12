"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingData {
  detectedCountry: {
    country: string;
    countryCode: string;
    isMozambique: boolean;
  };
  currentPricing: {
    currency: string;
    symbol: string;
    trialPrice: number;
    proPrice: number;
    exchangeRate: number;
  };
  allPricingOptions: {
    mozambique: any;
    international: any;
  };
}

export function PricingTestPanel() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [packages, setPackages] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<"auto" | "mz" | "us">("auto");
  const [loading, setLoading] = useState(false);

  const fetchPricingData = async (countryOverride?: string) => {
    setLoading(true);
    try {
      const url = countryOverride
        ? `/api/test-pricing?country=${countryOverride}`
        : "/api/test-pricing";

      const response = await fetch(url);
      const data = await response.json();
      setPricingData(data);

      // Also fetch packages
      const packagesUrl = countryOverride
        ? `/api/payments/packages?country=${countryOverride}`
        : "/api/payments/packages";

      const packagesResponse = await fetch(packagesUrl);
      const packagesData = await packagesResponse.json();
      setPackages(packagesData);
    } catch (error) {
      console.error("Failed to fetch pricing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const testScenario = (scenario: "auto" | "mz" | "us") => {
    setCurrentTest(scenario);
    if (scenario === "auto") {
      fetchPricingData();
    } else {
      fetchPricingData(scenario);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🧪 Pricing Test Panel
            <Badge variant="outline" className="text-xs">
              DEV
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={currentTest === "auto" ? "default" : "outline"}
              onClick={() => testScenario("auto")}
              disabled={loading}
            >
              Auto
            </Button>
            <Button
              size="sm"
              variant={currentTest === "mz" ? "default" : "outline"}
              onClick={() => testScenario("mz")}
              disabled={loading}
            >
              🇲🇿 MZ
            </Button>
            <Button
              size="sm"
              variant={currentTest === "us" ? "default" : "outline"}
              onClick={() => testScenario("us")}
              disabled={loading}
            >
              🇺🇸 US
            </Button>
          </div>

          {/* Current Detection */}
          {pricingData && (
            <div className="text-xs space-y-2">
              <div className="font-medium">
                📍 Detected: {pricingData.detectedCountry.country} (
                {pricingData.detectedCountry.countryCode})
              </div>

              <div className="bg-white p-2 rounded text-xs">
                <div className="font-medium mb-1">Current Pricing:</div>
                <div>Currency: {pricingData.currentPricing.currency}</div>
                <div>
                  Trial: {pricingData.currentPricing.symbol}
                  {pricingData.currentPricing.trialPrice}
                </div>
                <div>
                  Pro: {pricingData.currentPricing.symbol}
                  {pricingData.currentPricing.proPrice}
                </div>
              </div>

              {packages && (
                <div className="bg-white p-2 rounded text-xs">
                  <div className="font-medium mb-1">Package API Response:</div>
                  <div>Country: {packages.country?.name}</div>
                  <div>Currency: {packages.pricing?.currency}</div>
                  {packages.packages?.map((pkg: any, idx: number) => (
                    <div key={idx}>
                      {pkg.name}: {packages.pricing?.symbol || "$"}
                      {pkg.price}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && <div className="text-xs text-gray-500">Loading...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
