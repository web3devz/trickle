import { Line } from "react-chartjs-2";

interface TransactionStatsProps {
  data: {
    stats: {
      count: number;
      items: Array<{
        date: string;
        count: number;
      }>;
    };
    metadata: {
      contract: string;
      protocol: string;
      network: string;
      timeRange: {
        from?: string;
        to?: string;
      };
    };
  };
  chain: string;
}

export function TransactionStats({ data, chain }: TransactionStatsProps) {
  const dates = data.stats.items.map(item => new Date(item.date).toLocaleDateString());
  
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Transaction Count',
        data: data.stats.items.map(item => item.count),
        fill: true,
        borderColor: '#CCFF00',
        backgroundColor: 'rgba(204, 255, 0, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Transaction Count'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="p-6 rounded-[30px] border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl">Transaction Statistics</h3>
          <div className="flex gap-2">
            <div className="text-sm bg-black/10 px-3 py-1 rounded-lg">
              Chain: <span className="font-medium">{data.metadata.protocol}</span>
            </div>
            <div className="text-sm bg-black/10 px-3 py-1 rounded-lg">
              Network: <span className="font-medium">{data.metadata.network}</span>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-60 mt-2">
          Contract: {data.metadata.contract}
        </p>
      </div>

      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-black/5 rounded-xl">
          <h4 className="text-sm opacity-60">Total Transactions</h4>
          <p className="text-xl font-bold">
            {data.stats.items.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-black/5 rounded-xl">
          <h4 className="text-sm opacity-60">Average Daily Transactions</h4>
          <p className="text-xl font-bold">
            {Math.round(data.stats.items.reduce((sum, item) => sum + item.count, 0) / data.stats.items.length).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}