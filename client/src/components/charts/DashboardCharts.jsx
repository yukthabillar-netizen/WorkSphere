import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const StatusDonutChart = ({ data = [] }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-text-muted">
        <span>No task data to display</span>
      </div>
    );
  }

  return (
    <div className="h-64 flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-surface border border-border shadow-md rounded-lg p-2 text-xs">
                      <span className="font-semibold text-text">{d.name}: </span>
                      <span className="text-primary font-bold">{d.count} tasks</span>
                      <span className="text-text-muted ml-1">
                        ({Math.round((d.count / (total || 1)) * 100)}%)
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs pt-2">
        {data.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-text-muted">{item.name}</span>
            <span className="font-semibold text-text">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CompletionTrendChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="label"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-surface border border-border shadow-md rounded-lg p-2.5 text-xs">
                    <p className="text-text-muted font-medium mb-1">{item.date}</p>
                    <p className="text-primary font-bold text-sm">
                      {item.completed} task{item.completed !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#6366F1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#completionGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MemberWorkloadChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-surface border border-border shadow-md rounded-lg p-2.5 text-xs">
                    <p className="font-semibold text-text">{item.name}</p>
                    <p className="text-primary font-bold mt-1">
                      {item.openTasks} active task{item.openTasks !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="openTasks" fill="#818CF8" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
