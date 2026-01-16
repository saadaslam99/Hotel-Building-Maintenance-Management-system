'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IssuesOverviewData {
    name: string;
    value: number;
}

interface ChartProps {
    data: IssuesOverviewData[];
}

export function IssuesOverviewChart({ data }: ChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888888', fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888888', fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                >
                    {
                        // We'll customize colors in the parent usage or map them here if data contains color info.
                        // But for a dynamic categorized barchart where each bar is a category, we can use Cell or just a single color if it was one series.
                        // The requirement says: Open (Red/Orange), Pending (Yellow), Resolved (Blue), Verified (Green).
                        // Since the input `data` likely comes as [{name: 'Open', value: 10}, ...], we can map colors to cells if we use <Cell>.
                        // However, Recharts <Bar> doesn't take a function for fill easily without mapping <Cell> children.
                        // Let's implement that.
                    }
                </Bar>
                {/* We need to use Cell to color individual bars differently if they are in the same series */}
            </BarChart>
        </ResponsiveContainer>
    );
}

// Re-implementing with proper color mapping
import { Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    'Total': '#8884d8', // Default backup
    'Open': '#f97316', // Orange
    'Pending': '#eab308', // Yellow
    'Resolved': '#3b82f6', // Blue
    'Verified': '#22c55e', // Green
};

export function IssuesOverviewChartWithColors({ data }: ChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
