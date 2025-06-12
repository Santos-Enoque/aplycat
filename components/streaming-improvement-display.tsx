"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ArrowRight, Bot, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

// Updated interface to match the actual API response
interface ImprovedResumeResponse {
  personalInfo?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  professionalSummary?: string;
  experience?: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    achievements: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  skills?: {
    technical: string[];
    certifications: string[];
    languages: string[];
    methodologies: string[];
  };
  improvementsAnalysis?: {
    originalResumeEffectivenessEstimateForTarget: string;
    targetOptimizedResumeScore: string;
    analysisHeadline: string;
    keyRevisionsImplemented: string[];
    recommendationsForUser: string[];
  };
}

interface StreamingImprovementDisplayProps {
  improvement: Partial<ImprovedResumeResponse> | null;
  status: "streaming" | "completed";
}

export function StreamingImprovementDisplay({
  improvement,
}: StreamingImprovementDisplayProps) {
  const t = useTranslations("improvement");

  if (!improvement) {
    return <div>Loading...</div>;
  }

  const { improvementsAnalysis } = improvement;

  const originalScore =
    improvementsAnalysis?.originalResumeEffectivenessEstimateForTarget
      ? parseInt(
          improvementsAnalysis.originalResumeEffectivenessEstimateForTarget
        )
      : null;

  const newScore = improvementsAnalysis?.targetOptimizedResumeScore
    ? parseInt(improvementsAnalysis.targetOptimizedResumeScore.split("-")[0]) // Extract first number from "90-95"
    : null;

  const scoreChange =
    originalScore && newScore ? newScore - originalScore : null;

  return (
    <div className="space-y-6">
      {/* Improvement Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {improvementsAnalysis?.analysisHeadline || (
              <Skeleton className="h-5 w-3/4" />
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              {t("originalScore")}
            </h4>
            {originalScore ? (
              <p className="text-2xl font-bold">{originalScore}</p>
            ) : (
              <Skeleton className="h-8 w-16 mx-auto" />
            )}
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              {t("newScore")}
            </h4>
            {improvementsAnalysis?.targetOptimizedResumeScore ? (
              <p className="text-2xl font-bold text-green-600">
                {improvementsAnalysis.targetOptimizedResumeScore}
              </p>
            ) : (
              <Skeleton className="h-8 w-16 mx-auto" />
            )}
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              {t("scoreIncrease")}
            </h4>
            {scoreChange && scoreChange > 0 ? (
              <p className="text-2xl font-bold text-green-600">
                +{scoreChange}
              </p>
            ) : scoreChange !== null ? (
              <p className="text-2xl font-bold text-green-600">
                +{newScore ? newScore - (originalScore || 0) : 0}
              </p>
            ) : (
              <Skeleton className="h-8 w-16 mx-auto" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> {t("aiFeedback")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {improvementsAnalysis?.keyRevisionsImplemented ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-600">
                {t("keyRevisions")}
              </h4>
              <ul className="list-disc list-inside space-y-2">
                {improvementsAnalysis.keyRevisionsImplemented.map(
                  (revision, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{revision}</span>
                    </li>
                  )
                )}
              </ul>

              {improvementsAnalysis.recommendationsForUser && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    {t("importantRecommendations")}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {improvementsAnalysis.recommendationsForUser.map(
                      (rec, index) => (
                        <li key={index} className="text-yellow-700 text-sm">
                          {rec}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Skeleton className="h-16 w-full" />
          )}
        </CardContent>
      </Card>

      {/* Improved Resume Sections */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-center">
          {t("improvedSections")}
        </h3>

        {/* Personal Information */}
        {improvement.personalInfo && (
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>{t("name")}:</strong> {improvement.personalInfo.name}
              </p>
              <p>
                <strong>{t("email")}:</strong> {improvement.personalInfo.email}
              </p>
              <p>
                <strong>{t("phone")}:</strong> {improvement.personalInfo.phone}
              </p>
              <p>
                <strong>{t("location")}:</strong>{" "}
                {improvement.personalInfo.location}
              </p>
              {improvement.personalInfo.linkedin && (
                <p>
                  <strong>{t("linkedin")}:</strong>{" "}
                  {improvement.personalInfo.linkedin}
                </p>
              )}
              {improvement.personalInfo.website && (
                <p>
                  <strong>{t("website")}:</strong>{" "}
                  {improvement.personalInfo.website}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Professional Summary */}
        {improvement.professionalSummary && (
          <Card>
            <CardHeader>
              <CardTitle>{t("professionalSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {improvement.professionalSummary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {improvement.experience && improvement.experience.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("experience")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {improvement.experience.map((job, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{job.title}</h4>
                      <p className="text-purple-600 font-medium">
                        {job.company}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{job.location}</p>
                      <p>
                        {job.startDate} - {job.endDate}
                      </p>
                    </div>
                  </div>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {job.achievements.map((achievement, aIndex) => (
                      <li key={aIndex} className="text-gray-700">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {improvement.projects && improvement.projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {improvement.projects.map((project, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-lg">{project.name}</h4>
                  <p className="text-gray-600 mb-2">{project.description}</p>
                  {project.technologies && (
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>{t("technologies")}:</strong>{" "}
                      {project.technologies}
                    </p>
                  )}
                  <ul className="list-disc list-inside space-y-1">
                    {project.achievements.map((achievement, aIndex) => (
                      <li key={aIndex} className="text-gray-700">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {improvement.education && improvement.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("education")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {improvement.education.map((edu, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:justify-between"
                >
                  <div>
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-gray-600">{edu.institution}</p>
                    {edu.details && (
                      <p className="text-sm text-gray-500">{edu.details}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 md:text-right">
                    {edu.year}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {improvement.skills && (
          <Card>
            <CardHeader>
              <CardTitle>{t("skills")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {improvement.skills.technical &&
                improvement.skills.technical.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">
                      {t("technicalSkills")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {improvement.skills.technical.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {improvement.skills.languages &&
                improvement.skills.languages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">
                      {t("languages")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {improvement.skills.languages.map((lang, index) => (
                        <Badge key={index} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {improvement.skills.certifications &&
                improvement.skills.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">
                      {t("certifications")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {improvement.skills.certifications.map((cert, index) => (
                        <Badge key={index} variant="default">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* If no data is available yet, show skeletons */}
        {!improvement.personalInfo &&
          !improvement.professionalSummary &&
          !improvement.experience &&
          !improvement.skills &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
      </div>
    </div>
  );
}
