"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  ClipboardCheck, 
  BookOpen, 
  GraduationCap, 
  MessageCircle, 
  Bus, 
  BarChart, 
  Sparkles 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Users,
    title: "Student & Teacher Management",
    description: "Complete profiles, enrollment, and staff management",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance & Fees",
    description: "Track attendance daily and manage fee payments seamlessly",
  },
  {
    icon: BookOpen,
    title: "Homework & Exams",
    description: "Assign homework, schedule exams, and track submissions",
  },
  {
    icon: GraduationCap,
    title: "Smart LMS",
    description: "Learning management with videos, syllabus, and progress tracking",
  },
  {
    icon: MessageCircle,
    title: "Parent Communication",
    description: "Real-time updates, messages, and announcements",
  },
  {
    icon: Bus,
    title: "Transport Tracking",
    description: "Live bus tracking and route management for parents",
  },
  {
    icon: BarChart,
    title: "Reports & Analytics",
    description: "Comprehensive insights and data-driven decision making",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Smart automation and intelligent insights",
    comingSoon: true,
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything Your School Needs
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Core modules designed to streamline school operations
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="rounded-lg bg-primary-100 w-12 h-12 flex items-center justify-center mb-2">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                      {feature.comingSoon && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

