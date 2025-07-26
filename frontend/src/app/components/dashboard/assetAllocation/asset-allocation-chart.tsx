import { ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { TokenData } from "./asset-allocation-card";
const colors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

const getChartData = (tokens: TokenData[]) => {
  const total = tokens.reduce((sum, token) => sum + token.value_usd, 0);

  return {
    labels: tokens.map((t) => t.symbol),
    datasets: [
      {
        data: tokens.map((t) => ((t.value_usd / total) * 100).toFixed(2)),
        backgroundColor: tokens.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
      },
    ],
  };
};
export const AssetAllocationChart = ({ data }: { data: TokenData[] }) => {
  const chartData = getChartData(data);

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    cutout: "70%",
  };
  return <Doughnut data={chartData} options={options} />;
};
