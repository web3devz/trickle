// components/InvestmentGoalCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CircularProgress from "@/components/ui/CircularProgress";

interface Props {
  current: number;
  target: number;
}

export function InvestmentGoalCard({ current, target }: Props) {
  const percent = Math.min((current / target) * 100, 100);

  return (
    <Card className="bg-lime-100 border border-black">
      <CardHeader>
        <CardTitle>Investment Goal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your progress toward your savings goal
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        <CircularProgress value={percent} />

        <div className="text-center mt-4">
          <p className="text-sm font-medium text-muted-foreground">
            ${current.toFixed(2)} of ${target.toFixed(2)} saved
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
