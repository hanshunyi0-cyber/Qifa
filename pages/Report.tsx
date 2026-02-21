
import React, { useEffect, useRef } from 'react';
import type { UserProfile, Task, TaskCategory } from '../types';
import { Icons } from '../components/Icon';

interface ReportProps {
  user: UserProfile;
  tasks: Task[];
  getProgress: (cat?: TaskCategory) => number;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export const Report: React.FC<ReportProps> = ({ user, tasks, getProgress }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const donutInstance = useRef<any>(null);

  const totalProgress = getProgress();

  useEffect(() => {
    if (window.Chart && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['行前准备', '抵达法国', '我的生活', '学习中心'],
          datasets: [{
            label: '完成度 (%)',
            data: [
              getProgress('PRE_DEPARTURE'),
              getProgress('ARRIVAL'),
              getProgress('LIFE'),
              getProgress('STUDY')
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)', // Blue
              'rgba(16, 185, 129, 0.8)', // Green
              'rgba(249, 115, 22, 0.8)', // Orange
              'rgba(139, 92, 246, 0.8)'  // Violet
            ],
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    if (window.Chart && donutRef.current) {
        if (donutInstance.current) donutInstance.current.destroy();
        const ctx = donutRef.current.getContext('2d');
        
        const doneCount = tasks.filter(t => t.status === 'DONE').length;
        const todoCount = tasks.length - doneCount;

        donutInstance.current = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['已完成', '待办'],
                datasets: [{
                    data: [doneCount, todoCount],
                    backgroundColor: ['#3b82f6', '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    return () => {
        chartInstance.current?.destroy();
        donutInstance.current?.destroy();
    };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">进度报告</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">全面掌握你的留学准备情况</p>
      </div>

      {/* Summary Card - Stack on mobile */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
         <div className="mb-6 md:mb-0 text-center md:text-left">
             <h2 className="text-gray-500 font-medium">总完成度</h2>
             <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-5xl md:text-6xl font-bold text-primary">{totalProgress}%</span>
                <span className="text-gray-400">已准备就绪</span>
             </div>
             <p className="mt-2 text-sm text-gray-500">距离开学还有一些时间，保持这个节奏！</p>
         </div>
         <div className="w-40 h-40 md:w-48 md:h-48 relative">
            <canvas ref={donutRef}></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Icons.Check className="text-primary w-8 h-8 md:w-10 md:h-10 opacity-50" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">模块进度对比</h3>
                <Icons.Report className="text-gray-400" />
            </div>
            <canvas ref={chartRef}></canvas>
        </div>

        {/* Analysis */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">AI 分析报告</h3>
            <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg flex gap-3">
                    <div className="bg-green-100 p-2 rounded-full h-fit">
                        <Icons.Check className="text-green-600" size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">优势领域</h4>
                        <p className="text-xs text-gray-600 mt-1">
                            你的 {getProgress('PRE_DEPARTURE') > getProgress('ARRIVAL') ? '行前准备' : '抵达适应'} 完成度较高，基础很扎实。
                        </p>
                    </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg flex gap-3">
                    <div className="bg-orange-100 p-2 rounded-full h-fit">
                        <Icons.Alert className="text-orange-600" size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">需关注</h4>
                        <p className="text-xs text-gray-600 mt-1">
                            {tasks.find(t => t.status !== 'DONE' && t.priority === 'HIGH') 
                                ? `"${tasks.find(t => t.status !== 'DONE' && t.priority === 'HIGH')?.title}" 是当前最高优先级的待办事项。`
                                : '目前没有高优先级的滞后任务，非常好！'
                            }
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-2">
                    <p className="text-sm text-gray-500 italic">
                        "建议你接下来重点关注 {user.targetCity} 的租房市场，近期房源紧张。"
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
