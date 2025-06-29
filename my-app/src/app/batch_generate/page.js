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
import {
  Loader2,
  AlertCircle,
  PlayCircle,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function BatchTrackingVerification() {
  const [trackingNumbers, setTrackingNumbers] = useState({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState("");

  const handleTrackingNumberChange = (index, value) => {
    setTrackingNumbers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const processTrackingNumber = async (trackingNumber) => {
    if (!trackingNumber.trim()) {
      return {
        trackingNumber,
        status: "empty",
        totalAmount: 0,
        realApprovedBenefit: 0,
      };
    }

    try {
      // First API call - verification
      const verifyResponse = await fetch(
        "http://localhost:8000/decline_or_not",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tracking_number: trackingNumber }),
        }
      );

      if (!verifyResponse.ok) {
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }

      const verifyData = await verifyResponse.json();

      // Check if declined
      if (
        !verifyData.first_full_month_paid ||
        !verifyData.first_month_sdi_premium_paid
      ) {
        return {
          trackingNumber,
          status: "declined",
          totalAmount: 0,
          realApprovedBenefit: 0,
          firstFullMonthPaid: verifyData.first_full_month_paid,
          firstMonthSdiPaid: verifyData.first_month_sdi_premium_paid,
        };
      }

      // Second API call - calculate amount
      const claimResponse = await fetch(
        "http://localhost:8000/calulate_amount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tracking_number: trackingNumber }),
        }
      );

      if (!claimResponse.ok) {
        throw new Error(`Claim calculation failed: ${claimResponse.status}`);
      }

      const claimData = await claimResponse.json();

      return {
        trackingNumber,
        status: "approved",
        totalAmount: claimData.total_claim || 0,
        realApprovedBenefit: claimData.real_approved_benefit || 0,
        firstFullMonthPaid: verifyData.first_full_month_paid,
        firstMonthSdiPaid: verifyData.first_month_sdi_premium_paid,
      };
    } catch (err) {
      return {
        trackingNumber,
        status: "error",
        totalAmount: 0,
        realApprovedBenefit: 0,
        error: err.message,
      };
    }
  };

  const handleProcessAll = async () => {
    setError("");
    setResults({});
    setProcessing(true);

    const trackingNumbersList = Object.values(trackingNumbers).filter((tn) =>
      tn.trim()
    );

    if (trackingNumbersList.length === 0) {
      setError("Please enter at least one tracking number");
      setProcessing(false);
      return;
    }

    try {
      // Process all tracking numbers
      const processedResults = {};

      for (let i = 1; i <= 5; i++) {
        if (trackingNumbers[i].trim()) {
          const result = await processTrackingNumber(trackingNumbers[i]);
          processedResults[i] = result;
        }
      }

      setResults(processedResults);
    } catch (err) {
      setError("An unexpected error occurred while processing");
    } finally {
      setProcessing(false);
    }
  };

  const calculateSMAPE = (predicted, actual) => {
    const numerator = Math.abs(predicted - actual);
    const denominator = (Math.abs(predicted) + Math.abs(actual)) / 2;

    if (denominator === 0) return 0;

    return (numerator / denominator) * 100;
  };

  const calculateOverallSMAPE = () => {
    const approvedResults = Object.values(results).filter(
      (r) => r.status === "approved" && r.realApprovedBenefit > 0
    );

    if (approvedResults.length === 0) return null;

    let totalSMAPE = 0;

    approvedResults.forEach((result) => {
      const smape = calculateSMAPE(
        result.totalAmount,
        result.realApprovedBenefit
      );
      totalSMAPE += smape;
    });

    return totalSMAPE / approvedResults.length;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      declined: { color: "bg-red-100 text-red-800", label: "Declined" },
      error: { color: "bg-yellow-100 text-yellow-800", label: "Error" },
      empty: { color: "bg-gray-100 text-gray-800", label: "Empty" },
    };

    const config = statusConfig[status] || statusConfig.error;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getTotalSum = () => {
    return Object.values(results).reduce((sum, result) => {
      return sum + (result.totalAmount || 0);
    }, 0);
  };

  const getRealTotalSum = () => {
    return Object.values(results).reduce((sum, result) => {
      return sum + (result.realApprovedBenefit || 0);
    }, 0);
  };

  const getProcessedCount = () => {
    return Object.values(results).filter((r) => r.status !== "empty").length;
  };

  const getApprovedCount = () => {
    return Object.values(results).filter((r) => r.status === "approved").length;
  };

  const renderAccuracyAnalysis = () => {
    const overallSMAPE = calculateOverallSMAPE();
    if (overallSMAPE === null) return null;

    const calculatedTotal = getTotalSum();
    const realTotal = getRealTotalSum();
    const difference = calculatedTotal - realTotal;
    const differencePercentage =
      realTotal !== 0 ? (difference / realTotal) * 100 : 0;

    return (
      <Card className="mt-6 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Batch Accuracy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Calculated Amount</p>
                <p className="text-xl font-semibold">
                  ${calculatedTotal.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Total Real Approved Benefits
                </p>
                <p className="text-xl font-semibold text-green-700">
                  ${realTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Difference</span>
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
                <span className="text-sm font-medium">Average SMAPE Score</span>
                <span
                  className={`font-semibold ${
                    overallSMAPE < 10
                      ? "text-green-600"
                      : overallSMAPE < 20
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {overallSMAPE.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  SMAPE (Symmetric Mean Absolute Percentage Error)
                </span>
                measures prediction accuracy across all approved claims. Lower
                values indicate better accuracy:
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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Batch Tracking Number Processing</CardTitle>
            <CardDescription>
              Enter up to 5 tracking numbers to process verification and claim
              calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`tracking-${index}`}>
                      Tracking Number {index}
                    </Label>
                    <Input
                      id={`tracking-${index}`}
                      type="text"
                      placeholder={`Enter tracking number ${index}`}
                      value={trackingNumbers[index]}
                      onChange={(e) =>
                        handleTrackingNumberChange(index, e.target.value)
                      }
                      disabled={processing}
                    />
                  </div>
                ))}
              </div>

              {/* Process Button */}
              <Button
                onClick={handleProcessAll}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Process All Tracking Numbers
                  </>
                )}
              </Button>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Results Table */}
              {Object.keys(results).length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Processing Results</h3>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {getProcessedCount()}
                          </div>
                          <div className="text-sm text-gray-600">Processed</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {getApprovedCount()}
                          </div>
                          <div className="text-sm text-gray-600">Approved</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">
                            ${getTotalSum().toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Calculated
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">#</th>
                          <th className="text-left p-3">Tracking Number</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">First Month Paid</th>
                          <th className="text-left p-3">SDI Premium Paid</th>
                          <th className="text-right p-3">Calculated</th>
                          <th className="text-right p-3">Real Approved</th>
                          <th className="text-right p-3">SMAPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((index) => {
                          const result = results[index];
                          if (!result || result.status === "empty") return null;

                          const smape =
                            result.status === "approved" &&
                            result.realApprovedBenefit > 0
                              ? calculateSMAPE(
                                  result.totalAmount,
                                  result.realApprovedBenefit
                                )
                              : null;

                          return (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">{index}</td>
                              <td className="p-3 font-mono text-sm">
                                {result.trackingNumber}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(result.status)}
                              </td>
                              <td className="p-3 text-center">
                                {result.status !== "error" ? (
                                  result.firstFullMonthPaid ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {result.status !== "error" ? (
                                  result.firstMonthSdiPaid ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-semibold">
                                ${result.totalAmount.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-semibold text-green-700">
                                ${result.realApprovedBenefit.toFixed(2)}
                              </td>
                              <td className="p-3 text-right">
                                {smape !== null ? (
                                  <span
                                    className={`font-medium ${
                                      smape < 10
                                        ? "text-green-600"
                                        : smape < 20
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {smape.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Error Details */}
                  {Object.entries(results).some(
                    ([_, r]) => r.status === "error"
                  ) && (
                    <Alert variant="warning" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Some tracking numbers encountered errors during
                        processing.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Accuracy Analysis */}
                  {renderAccuracyAnalysis()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
