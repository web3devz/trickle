import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { PortfolioChart } from "./portfolio-chart";

interface PortfolioPoint {
  timestamp: number;
  value_usd: number;
}

export const PortfolioCard = ({
  address,
  chain_id,
  timerange,
  setTimerange,
}: {
  address: string;
  chain_id: string;
  timerange: string;
  setTimerange: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [currentProfitAndLoss, setCurrentProfitAndLoss] = useState<
    number | null
  >(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchPortfolioGeneral() {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.append("address", address);
      params.append("chain_id", chain_id);
      params.append("timerange", timerange);
      params.append("use_cache", "false");

      try {
        const res = await fetch(
          `/api/1inch/portfolio/general?${params.toString()}`
        );
        const { value, profitAndLoss, chart } = await res.json();

        if (value?.result?.length > 0) {
          setCurrentValue(value.result[0].value_usd);
        }

        if (profitAndLoss?.result?.length > 0) {
          const match = profitAndLoss.result.find(
            (data: { chain_id: number }) => data.chain_id === parseInt(chain_id)
          );
          if (match) setCurrentProfitAndLoss(match.roi);
        }

        if (chart?.result) {
          const data: PortfolioPoint[] = chart.result;
          const labels = data.map((point) =>
            new Date(point.timestamp * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          );
          const values = data.map((point) => point.value_usd);

          const newData = {
            labels,
            datasets: [
              {
                label: "Portfolio Value",
                data: values,
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.5)",
                fill: true,
              },
            ],
          };

          setChartData(newData);
        }
      } catch (err) {
        console.error("Error fetching portfolio data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolioGeneral();
  }, [address, chain_id, timerange]);

  return (
    <Card className="col-span-full bg-[#F3F3F3] lg:col-span-2 max-w-md lg:max-w-7xl">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>
          Your total portfolio value and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {currentValue ? `${formatCurrency(currentValue)}` : "-"}
                  </h2>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      currentProfitAndLoss !== null
                        ? currentProfitAndLoss >= 0
                          ? "text-green-500"
                          : "text-red-500"
                        : ""
                    }`}
                  >
                    {currentProfitAndLoss !== null &&
                      `${formatPercentage(currentProfitAndLoss)}`}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Select value={timerange} onValueChange={setTimerange}>
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="3years">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <PortfolioChart chartData={chartData} isLoading={isLoading} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
