"use client";

import { useState, useEffect } from "react";
import { trpc as api } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExchangeRatePage() {
  const { data, isLoading } = api.tenant.getExchangeRate.useQuery();
  const [rate, setRate] = useState("4100");

  useEffect(() => {
    if (data?.usdToKhr) setRate(String(data.usdToKhr));
  }, [data]);

  const utils = api.useUtils();
  const setRateMutation = api.tenant.setExchangeRate.useMutation({
    onSuccess: () => {
      toast.success("Exchange rate saved");
      void utils.tenant.getExchangeRate.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-2xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rate Settings</h1>
        <p className="text-muted-foreground">Configure currency rates for KHR billing and KHQR payments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>USD → KHR Rate</CardTitle>
          <CardDescription>Set how many Khmer Riel equal 1 US Dollar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="rate">1 USD =</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rate"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="max-w-[180px]"
                    min="1"
                    step="1"
                  />
                  <span className="text-sm font-medium">KHR</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Preview: $100 USD = {(Number(rate) * 100).toLocaleString()} KHR
              </p>
              <Button
                onClick={() => setRateMutation.mutate({ usdToKhr: rate })}
                disabled={setRateMutation.isPending || !rate}
              >
                {setRateMutation.isPending ? "Saving..." : "Save Rate"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KHQR Merchant Setup</CardTitle>
          <CardDescription>
            Configure Bakong KHQR credentials. Contact ABA, Wing, or your bank for merchant approval from NBC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Merchant ID</Label>
            <Input placeholder="Enter Bakong merchant ID" />
          </div>
          <div className="space-y-2">
            <Label>Merchant Name</Label>
            <Input placeholder="Enter merchant name (English)" />
          </div>
          <div className="space-y-2">
            <Label>Merchant City</Label>
            <Input placeholder="e.g. Phnom Penh" defaultValue="Phnom Penh" />
          </div>
          <p className="text-xs text-muted-foreground">
            Full KHQR requires the <code>bakong-khqr</code> npm package and NBC merchant approval.
          </p>
          <Button variant="outline" disabled>Save KHQR Settings (coming soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
