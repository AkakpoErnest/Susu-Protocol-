'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ContributionRecord } from '@/types';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

interface ReputationHistoryProps {
  history: ContributionRecord[];
  currentScore: number;
}

export function ReputationHistory({ history, currentScore }: ReputationHistoryProps) {
  // Build score timeline from history
  const chartData = (() => {
    let score = 500;
    return history.map((record, idx) => {
      if (record.defaulted) {
        score = Math.max(0, score - 50);
      } else if (record.onTime) {
        score = Math.min(1000, score + 10);
      } else {
        score = Math.min(1000, score + 3);
      }
      return {
        index: idx + 1,
        score,
        label: truncateAddress(record.poolAddress),
        type: record.defaulted ? 'default' : record.onTime ? 'ontime' : 'late',
      };
    });
  })();

  // Add current endpoint
  if (chartData.length > 0) {
    chartData.push({
      index: chartData.length + 1,
      score: currentScore,
      label: 'Current',
      type: 'current' as any,
    });
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h3 className="font-heading font-semibold text-lg mb-4">Score History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="index" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1000]} stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f3460',
                  border: '1px solid #1e3a5f',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                formatter={(value: any) => [value, 'Score']}
                labelFormatter={(label) => `Event #${label}`}
              />
              <ReferenceLine y={301} stroke="#60a5fa" strokeDasharray="3 3" label={{ value: 'Trusted', fill: '#60a5fa', fontSize: 11 }} />
              <ReferenceLine y={601} stroke="#a78bfa" strokeDasharray="3 3" label={{ value: 'Veteran', fill: '#a78bfa', fontSize: 11 }} />
              <ReferenceLine y={851} stroke="#e8c547" strokeDasharray="3 3" label={{ value: 'Champion', fill: '#e8c547', fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#e8c547"
                strokeWidth={2}
                dot={{ fill: '#e8c547', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History table */}
      <div className="card">
        <h3 className="font-heading font-semibold text-lg mb-4">Contribution History</h3>
        {history.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No contribution history yet. Join a pool to start building your reputation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-gray-400 font-medium">Pool</th>
                  <th className="pb-3 text-gray-400 font-medium">Cycle</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                  <th className="pb-3 text-gray-400 font-medium">Date</th>
                  <th className="pb-3 text-gray-400 font-medium text-right">Score Change</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((record, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="py-3">
                      <a
                        href={`https://blockscout.westend.asset-hub.paritytech.net/address/${record.poolAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-mono text-xs"
                      >
                        {truncateAddress(record.poolAddress)}
                      </a>
                    </td>
                    <td className="py-3 text-gray-300">#{Number(record.cycleNumber)}</td>
                    <td className="py-3">
                      {record.defaulted ? (
                        <span className="flex items-center gap-1 text-danger">
                          <XCircle size={14} /> Defaulted
                        </span>
                      ) : record.onTime ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle size={14} /> On Time
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Clock size={14} /> Late
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {formatTimestamp(record.timestamp)}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {record.defaulted ? (
                        <span className="text-danger">-50</span>
                      ) : record.onTime ? (
                        <span className="text-success">+10</span>
                      ) : (
                        <span className="text-yellow-400">+3</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
