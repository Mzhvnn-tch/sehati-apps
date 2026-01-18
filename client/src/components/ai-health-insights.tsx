import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";
import type { MedicalRecord } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface AIHealthInsightsProps {
    records: MedicalRecord[];
    userProfile?: {
        age?: number;
        bloodType?: string | null;
        allergies?: string[] | null;
    };
}

// Simulated AI insights based on medical records
const generateInsights = (records: MedicalRecord[], profile?: any) => {
    const insights = [];

    // Insight 1: Overall health trend
    if (records.length > 5) {
        insights.push({
            type: 'positive',
            title: 'Consistent Health Monitoring',
            description: `You have ${records.length} medical records, showing good engagement with healthcare.`,
            icon: TrendingUp,
            color: 'emerald',
            priority: 'low'
        });
    }

    // Insight 2: Lab results analysis
    const labResults = records.filter(r => r.recordType === 'lab_result');
    if (labResults.length > 0) {
        insights.push({
            type: 'info',
            title: 'Lab Work Up to Date',
            description: `${labResults.length} lab results on file. Consider scheduling routine checkup every 6 months.`,
            icon: Activity,
            color: 'blue',
            priority: 'medium'
        });
    }

    // Insight 3: Prescription tracking
    const prescriptions = records.filter(r => r.recordType === 'prescription');
    if (prescriptions.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Medication Compliance',
            description: `${prescriptions.length} active prescriptions. Ensure you're taking medications as directed.`,
            icon: AlertTriangle,
            color: 'amber',
            priority: 'high'
        });
    }

    // Insight 4: Profile-based recommendations
    if (profile?.age && profile.age > 40) {
        insights.push({
            type: 'info',
            title: 'Age-Related Screening',
            description: 'Based on your age, consider annual cardiovascular screening.',
            icon: Target,
            color: 'purple',
            priority: 'medium'
        });
    }

    // Insight 5: Allergy awareness
    if (profile?.allergies && profile.allergies.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Allergy Alert Active',
            description: `${profile.allergies.length} known allergies on file. Always inform medical staff.`,
            icon: AlertTriangle,
            color: 'red',
            priority: 'high'
        });
    }

    return insights;
};

const calculateWellnessScore = (records: MedicalRecord[]) => {
    // Simple scoring algorithm
    let score = 50; // Base score

    score += Math.min(records.length * 3, 30); // Up to +30 for having records

    const recentRecords = records.filter(r => {
        const recordDate = new Date(r.createdAt);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return recordDate > sixMonthsAgo;
    });

    score += Math.min(recentRecords.length * 5, 20); // Up to +20 for recent activity

    return Math.min(score, 95); // Cap at 95
};

export function AIHealthInsights({ records, userProfile }: AIHealthInsightsProps) {
    const insights = generateInsights(records, userProfile);
    const wellnessScore = calculateWellnessScore(records);

    return (
        <div className="space-y-6">
            {/* AI Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">AI Health Insights</h2>
                    <p className="text-sm text-muted-foreground">Powered by advanced health analytics</p>
                </div>
                <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Beta
                </Badge>
            </motion.div>

            {/* Wellness Score */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="diamond-card border-2 border-purple-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            Wellness Score
                        </CardTitle>
                        <CardDescription>AI-calculated health index</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-end gap-4">
                                <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {wellnessScore}
                                </div>
                                <div className="text-3xl font-bold text-muted-foreground mb-2">/100</div>
                            </div>
                            <Progress value={wellnessScore} className="h-3" />
                            <p className="text-sm text-muted-foreground">
                                {wellnessScore >= 80 ? '🎉 Excellent! Keep up the great work!' :
                                    wellnessScore >= 60 ? '👍 Good progress. A few areas to improve.' :
                                        '💪 Let\'s work on building healthier habits together!'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Insights Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    const bgColor = {
                        emerald: 'bg-emerald-50',
                        blue: 'bg-blue-50',
                        amber: 'bg-amber-50',
                        purple: 'bg-purple-50',
                        red: 'bg-red-50'
                    }[insight.color];

                    const borderColor = {
                        emerald: 'border-emerald-200',
                        blue: 'border-blue-200',
                        amber: 'border-amber-200',
                        purple: 'border-purple-200',
                        red: 'border-red-200'
                    }[insight.color];

                    const iconColor = {
                        emerald: 'text-emerald-600',
                        blue: 'text-blue-600',
                        amber: 'text-amber-600',
                        purple: 'text-purple-600',
                        red: 'text-red-600'
                    }[insight.color];

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <Card className={`${bgColor} ${borderColor} border-2 hover:shadow-lg transition-shadow`}>
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-5 h-5 ${iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-800 text-sm">{insight.title}</h4>
                                                {insight.priority === 'high' && (
                                                    <Badge variant="destructive" className="text-xs shrink-0">High</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {insight.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Health Recommendations */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="diamond-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            Personalized Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                <span>Schedule annual health checkup with your primary care physician</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                <span>Maintain regular exercise routine (30 min daily recommended)</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                                <span>Continue monitoring vital signs and updating medical records</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                <span>Review and organize your prescription medications monthly</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
