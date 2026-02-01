'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SeverityChartProps {
  data: Array<{ name: string; value: number; color: string }>
}

const COLORS = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#2563eb',
  info: '#64748b'
}

export default function SeverityChart({ data }: SeverityChartProps) {
  const filteredData = data.filter(item => item.value > 0)

  if (filteredData.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: '14px'
      }}>
        No findings to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={70}
          fill="#8884d8"
          dataKey="value"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

