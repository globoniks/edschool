"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  GraduationCap, 
  Users, 
  User 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const roles = [
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    features: [
      "Complete school dashboard with real-time metrics",
      "Manage teachers, students, and staff profiles",
      "Generate comprehensive reports and analytics",
      "Configure fees, timetables, and academic settings",
      "Monitor attendance and academic performance",
    ],
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: GraduationCap,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    features: [
      "Mark attendance with one click",
      "Assign and grade homework digitally",
      "Schedule exams and track student progress",
      "Send announcements to parents",
      "Access student profiles and academic history",
    ],
  },
  {
    id: "parent",
    label: "Parent",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    features: [
      "View child's attendance in real-time",
      "Track homework and exam schedules",
      "Receive instant notifications and updates",
      "Monitor fee payments and due dates",
      "Track school bus location live",
    ],
  },
  {
    id: "student",
    label: "Student",
    icon: User,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    features: [
      "Access homework and assignments",
      "View timetable and class schedules",
      "Check exam results and grades",
      "Download study materials and videos",
      "Track attendance and academic progress",
    ],
  },
];

export default function RoleDemoSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built for Every Role
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See what each role can do with School OS
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16"
        >
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <TabsTrigger key={role.id} value={role.id}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{role.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <TabsContent key={role.id} value={role.id} className="mt-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`rounded-lg ${role.iconBg} p-3`}>
                            <Icon className={`h-6 w-6 ${role.iconColor}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {role.label} Portal
                            </h3>
                            <p className="text-sm text-gray-600">
                              What {role.label.toLowerCase()}s can do
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-3">
                          {role.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-600" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <Icon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          {role.label} UI Preview
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Clean, intuitive interface
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

