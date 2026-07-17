import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Gift
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [leftEmployee, setLeftEmployee] = useState(0);
  const [leaveThisMonth, setLeaveThisMonth] = useState(0);
  const [monthlyHiringData, setMonthlyHiringData] = useState([]);
  const [designationData, setDesignationData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [statusRatio, setStatusRatio] = useState({ active: 0, left: 0 });
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback Logic
  const displayStats = {
    total: totalEmployee || 0,
    active: activeEmployee || 0,
    left: leftEmployee || 0,
    leaves: leaveThisMonth || 0
  };

  const displayMonthlyData = monthlyHiringData.length > 0 ? monthlyHiringData : [];
  const displayDeptData = departmentData.length > 0 ? departmentData : [];
  const displayDesigData = designationData.length > 0 ? designationData : [];

  const displayStatusData = useMemo(() => [
    { name: 'Active', value: statusRatio.active || 0, color: '#2563eb' },
    { name: 'Resigned', value: statusRatio.left || 0, color: '#cbd5e1' }
  ], [statusRatio]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const stats = await response.json();

        setTotalEmployee(stats.fullTimeCount);
        setActiveEmployee(stats.articleCount);
        setLeftEmployee(stats.internCount);
        setLeaveThisMonth(stats.totalActive);
        setStatusRatio({ active: stats.totalActive, left: stats.totalLeft });
        setDepartmentData(stats.departmentData);
        setDesignationData(stats.designationData);
        setMonthlyHiringData(stats.monthlyHiringData);
        setUpcomingBirthdays(stats.upcomingBirthdays);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110" />
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`p-2 rounded-lg bg-indigo-50 transition-colors group-hover:bg-indigo-100`}>
          <Icon size={18} className="text-indigo-600" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner message="Aggregating workforce metrics..." fullPage={true} />;
  }

  const handleGenerateReport = () => {
    window.print();
  };

  const handleExportAnalytics = () => {
    const csvRows = [];
    csvRows.push("Metric,Value");
    csvRows.push(`Total Employee (Full Time),${displayStats.total}`);
    csvRows.push(`Articles,${displayStats.active}`);
    csvRows.push(`Interns,${displayStats.left}`);
    csvRows.push(`Total Active,${displayStats.leaves}`);
    csvRows.push("");
    
    csvRows.push("Department,Employee Count");
    departmentData.forEach(d => csvRows.push(`"${d.department}",${d.employees}`));
    
    csvRows.push("");
    csvRows.push("Role,Employee Count");
    designationData.forEach(d => csvRows.push(`"${d.designation}",${d.employees}`));

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hr_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 font-outfit">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Real-time workforce intelligence & metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGenerateReport}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm"
          >
            Generate Report
          </button>
          <button 
            onClick={handleExportAnalytics}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            Export Analytics
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Total Employee (Full Time)" 
          value={displayStats.total} 
          icon={Briefcase} 
        />
        <StatCard 
          title="Articles" 
          value={displayStats.active} 
          icon={Users} 
        />
        <StatCard 
          title="Interns" 
          value={displayStats.left} 
          icon={UserCheck} 
        />
        <StatCard 
          title="Total Active" 
          value={displayStats.leaves} 
          icon={Layers} 
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Growth Chart */}
        <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Workforce Dynamics</h2>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayMonthlyData}>
                <defs>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hired" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorHired)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="left" 
                  stroke="#cbd5e1" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratio Pie */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Layers size={16} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Status Ratio</h2>
          </div>
          <div className="h-64 flex flex-col items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayStatusData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {displayStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#e2e8f0'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={30}
                  iconType="circle"
                  formatter={(val) => <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dept Horizontal Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Briefcase size={16} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Department Load</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayDeptData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="department" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  width={80}
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9', opacity: 0.4}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="employees" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 px-1">
            <ArrowUpRight size={16} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Role Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayDesigData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="designation" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="employees" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32}>
                  {displayDesigData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays Section */}
      <div className="mt-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6 px-1">
          <Gift size={16} className="text-rose-500" />
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Upcoming Birthdays (Next 5 Days)</h2>
        </div>
        
        {upcomingBirthdays.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No birthdays in the next 5 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {upcomingBirthdays.map((bday, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                 {bday.photo ? (
                    <img src={bday.photo} alt={bday.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                 ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-sm">
                       {bday.name.charAt(0)}
                    </div>
                 )}
                 <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-900 truncate">{bday.name}</p>
                    <p className="text-[10px] font-medium text-gray-500 truncate mb-1">{bday.department || 'Staff'}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                       bday.daysLeft === 0 ? 'bg-rose-500 text-white animate-pulse' : 
                       bday.daysLeft === 1 ? 'bg-orange-100 text-orange-600' : 
                       'bg-indigo-50 text-indigo-600'
                    }`}>
                       {bday.daysLeft === 0 ? 'Today!' : bday.daysLeft === 1 ? 'Tomorrow' : `In ${bday.daysLeft} days (${bday.dateStr})`}
                    </span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;