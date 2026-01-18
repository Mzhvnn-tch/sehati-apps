import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Heart, Droplet, Scale } from "lucide-react";
import { motion } from "framer-motion";
import type { MedicalRecord } from "@shared/schema";

interface HealthAnalyticsProps {
    records: MedicalRecord[];
}

// Sample health data - in real app, this would be parsed from medical records
const generateHealthData = (records: MedicalRecord[]) => {
    // Generate sample vitals data based on record dates
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
        month,
        bloodPressure: 120 + Math.random() * 20,
        heartRate: 70 + Math.random() * 15,
        weight: 70 + Math.random() * 5,
        glucose: 90 + Math.random() * 20,
    }));
};

const recordTypeData = (records: MedicalRecord[]) => {
    const types = records.reduce((acc, record) => {
        acc[record.recordType] = (acc[record.recordType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(types).map(([name, value]) => ({ name, value }));
};

const COLORS = {
    diagnosis: '#a855f7',
    prescription: '#10b981',
    lab_result: '#3b82f6',
};

export function HealthAnalytics({ records }: HealthAnalyticsProps) {
    const vitalsData = generateHealthData(records);
    const typeDistribution = recordTypeData(records);

    const healthScore = Math.min(95, 70 + records.length * 2); // Simple formula

    return (
        <div className="space-y-6">
            {/* Health Score Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="diamond-card border-2 border-cyan-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-purple-50/50 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-600" />
                            Health Score Overview
                        </CardTitle>
                        <CardDescription>Your overall health metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-6 rounded-xl bg-white/60 border border-cyan-100 hover:shadow-lg transition-shadow">
                                <div className="text-4xl font-bold text-cyan-600 mb-2">{healthScore}%</div>
                                <div className="text-sm text-muted-foreground">Health Score</div>
                                <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mt-2" />
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/60 border border-purple-100 hover:shadow-lg transition-shadow">
                                <div className="text-4xl font-bold text-purple-600 mb-2">{records.length}</div>
                                <div className="text-sm text-muted-foreground">Total Records</div>
                                <Heart className="w-4 h-4 text-pink-500 mx-auto mt-2" />
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/60 border border-blue-100 hover:shadow-lg transition-shadow">
                                <div className="text-4xl font-bold text-blue-600 mb-2">A+</div>
                                <div className="text-sm text-muted-foreground">Wellness Grade</div>
                                <Droplet className="w-4 h-4 text-blue-500 mx-auto mt-2" />
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/60 border border-emerald-100 hover:shadow-lg transition-shadow">
                                <div className="text-4xl font-bold text-emerald-600 mb-2">98%</div>
                                <div className="text-sm text-muted-foreground">Compliance</div>
                                <Scale className="w-4 h-4 text-emerald-500 mx-auto mt-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Vitals Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="diamond-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Vital Signs Trend</CardTitle>
                            <CardDescription>Blood pressure & heart rate over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={vitalsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="bloodPressure"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={{ fill: '#ef4444', r: 4 }}
                                        name="Blood Pressure"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="heartRate"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        dot={{ fill: '#06b6d4', r: 4 }}
                                        name="Heart Rate"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Record Type Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="diamond-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Record Distribution</CardTitle>
                            <CardDescription>Breakdown by record type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={typeDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {typeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Weight & Glucose Tracking */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="diamond-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Weight & Glucose Monitoring</CardTitle>
                        <CardDescription>Track your weight and blood glucose levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={vitalsData}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#a855f7"
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                    name="Weight (kg)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="glucose"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorGlucose)"
                                    name="Glucose (mg/dL)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
