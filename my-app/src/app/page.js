"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function TrackingVerification() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setError("");
    setResult(null);

    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/decline_or_not", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch verification results");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const renderVerificationItem = (label, value, evidence) => (
    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {value ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="font-medium">{label}</span>
        <span
          className={`ml-auto text-sm font-semibold ${
            value ? "text-green-600" : "text-red-600"
          }`}
        >
          {value ? "VERIFIED" : "NOT VERIFIED"}
        </span>
      </div>
      {evidence && (
        <div className="ml-7 text-sm text-gray-600">
          <span className="font-medium">Evidence:</span> {evidence}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Tracking Number Verification</CardTitle>
            <CardDescription>
              Enter a tracking number to verify payment status and eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  type="text"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Tracking Number"
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Verification Results</h3>

                {renderVerificationItem(
                  "First Full Month Paid",
                  result.first_full_month_paid,
                  result.first_full_month_paid_evidence
                )}

                {renderVerificationItem(
                  "First Month SDI Premium Paid",
                  result.first_month_sdi_premium_paid,
                  result.first_month_sdi_premium_paid_evidence
                )}
                {result.first_full_month_paid &&
                result.first_month_sdi_premium_paid ? (
                  <Button
                    onClick={() => {
                      /* your continue handler */
                    }}
                    className="w-full mt-4"
                  >
                    Continue
                  </Button>
                ) : (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Declined</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
