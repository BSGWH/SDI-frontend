"use client";
import Link from "next/link";
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
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function TrackingVerification() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatingClaim, setCalculatingClaim] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [claimResult, setClaimResult] = useState(null);

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    setClaimResult(null);

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

  const handleCalculateClaim = async () => {
    setError("");
    setCalculatingClaim(true);

    try {
      const response = await fetch("http://localhost:8000/calulate_amount", {
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
      setClaimResult(data);
    } catch (err) {
      setError(err.message || "Failed to calculate claim amount");
    } finally {
      setCalculatingClaim(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const calculateSMAPE = (predicted, actual) => {
    const numerator = Math.abs(predicted - actual);
    const denominator = (Math.abs(predicted) + Math.abs(actual)) / 2;

    if (denominator === 0) return 0;

    return (numerator / denominator) * 100;
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

  const renderClaimItem = (description, details) => (
    <div className="p-3 bg-gray-50 rounded-lg space-y-1">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium flex-1">{description}</span>
        <span className="text-sm font-semibold">
          ${details.amount.toFixed(2)}
        </span>
      </div>
      <div className="text-xs text-gray-600">
        <span className="font-medium">Category:</span>{" "}
        {details.category.replace(/_/g, " ")}
      </div>
      <div className="text-xs text-gray-500">{details.reasoning}</div>
    </div>
  );

  const renderClaimSummary = (items, title, bgColor) => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`p-4 ${bgColor} rounded-lg`}>
        <h5 className="font-medium text-sm mb-2">{title}</h5>
        <div className="text-sm text-gray-700">{items}</div>
      </div>
    );
  };

  const renderAccuracyComparison = () => {
    if (!claimResult || !claimResult.real_approved_benefit) return null;

    const calculated = claimResult.total_claim;
    const actual = claimResult.real_approved_benefit;
    const smape = calculateSMAPE(calculated, actual);
    const difference = calculated - actual;
    const differencePercentage = actual !== 0 ? (difference / actual) * 100 : 0;

    return (
      <Card className="mt-6 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Accuracy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Calculated Amount</p>
                <p className="text-xl font-semibold">
                  ${calculated.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Real Approved Benefit</p>
                <p className="text-xl font-semibold text-green-700">
                  ${actual.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Difference</span>
                <div className="flex items-center gap-2">
                  {difference >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span
                    className={`font-semibold ${
                      difference >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {difference >= 0 ? "+" : ""}$
                    {Math.abs(difference).toFixed(2)} (
                    {differencePercentage >= 0 ? "+" : ""}
                    {differencePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SMAPE Score</span>
                <span
                  className={`font-semibold ${
                    smape < 10
                      ? "text-green-600"
                      : smape < 20
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {smape.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  SMAPE (Symmetric Mean Absolute Percentage Error)
                </span>
                measures prediction accuracy. Lower values indicate better
                accuracy:
              </p>
              <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                <li>
                  • <span className="text-green-600">0-10%</span>: Excellent
                  accuracy
                </li>
                <li>
                  • <span className="text-yellow-600">10-20%</span>: Good
                  accuracy
                </li>
                <li>
                  • <span className="text-red-600">&gt;20%</span>: Needs
                  improvement
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button className="mb-2">
          <Link href="/batch_generate">Batch generation</Link>
        </Button>
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
                  disabled={loading || calculatingClaim}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || calculatingClaim}
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
                    onClick={handleCalculateClaim}
                    disabled={calculatingClaim}
                    className="w-full mt-4"
                  >
                    {calculatingClaim ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating Claim...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Calculate Claim Amount
                      </>
                    )}
                  </Button>
                ) : (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Claim Declined - Verification criteria not met
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {claimResult && (
              <div className="mt-6 space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-4">
                    Claim Calculation Details
                  </h3>

                  <Card className="mb-4 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          Total Claim Amount
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          ${claimResult.total_claim.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h4 className="font-medium">Itemized Charges</h4>
                    {Object.entries(claimResult)
                      .filter(
                        ([key, value]) =>
                          key !== "calculation_process" &&
                          key !== "covered_items" &&
                          key !== "partially_covered_items" &&
                          key !== "not_covered_items" &&
                          key !== "total_claim" &&
                          key !== "real_approved_benefit" &&
                          typeof value === "object" &&
                          value.amount
                      )
                      .map(([description, details]) => (
                        <div key={description}>
                          {renderClaimItem(description, details)}
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {renderClaimSummary(
                      claimResult.covered_items,
                      "Fully Covered Items",
                      "bg-green-50"
                    )}
                    {renderClaimSummary(
                      claimResult.partially_covered_items,
                      "Partially Covered Items",
                      "bg-yellow-50"
                    )}
                    {renderClaimSummary(
                      claimResult.not_covered_items,
                      "Not Covered Items",
                      "bg-red-50"
                    )}
                  </div>

                  {claimResult.calculation_process && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Calculation Process
                      </h5>
                      <div className="text-xs text-gray-700 font-mono break-all">
                        {claimResult.calculation_process}
                      </div>
                    </div>
                  )}

                  {/* Accuracy Comparison Section */}
                  {renderAccuracyComparison()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
