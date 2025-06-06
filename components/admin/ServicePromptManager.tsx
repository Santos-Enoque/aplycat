"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Edit,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ServicePrompt {
  id: string;
  name: string;
  promptType: "SYSTEM" | "USER" | "TEMPLATE";
  systemPrompt: string | null;
  userPrompt: string | null;
  description: string | null;
  isActive: boolean;
  version: number;
}

interface ServiceData {
  service: string;
  displayName: string;
  systemPrompt: ServicePrompt | null;
  userPrompt: ServicePrompt | null;
  isComplete: boolean;
}

interface ActiveConfiguration {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export default function ServicePromptManager() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [activeConfiguration, setActiveConfiguration] =
    useState<ActiveConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<ServicePrompt | null>(
    null
  );
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/prompts");

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setServices(data.services);
        setActiveConfiguration(data.activeConfiguration);
        setError(null);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    // Show warning toast first
    toast.warning(
      "This will reset all configurations and prompts to defaults. Continuing in 3 seconds...",
      {
        duration: 3000,
        action: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss();
            return;
          },
        },
      }
    );

    // Wait 3 seconds then proceed
    setTimeout(async () => {
      try {
        setResetting(true);
        const response = await fetch("/api/admin/reset-defaults", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`Failed to reset: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          await fetchServices(); // Refresh data
          toast.success(
            "Successfully reset to default configuration and prompts!"
          );
        } else {
          throw new Error(data.error || "Reset failed");
        }
      } catch (err: any) {
        console.error("Error resetting to defaults:", err);
        toast.error(`Failed to reset: ${err.message}`);
      } finally {
        setResetting(false);
      }
    }, 3000);
  };

  const handleEditPrompt = (prompt: ServicePrompt) => {
    setEditingPrompt(prompt);
  };

  const handleSavePrompt = async (updatedPrompt: ServicePrompt) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/prompts/${updatedPrompt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedPrompt.name,
          promptType: updatedPrompt.promptType,
          systemPrompt: updatedPrompt.systemPrompt,
          userPrompt: updatedPrompt.userPrompt,
          description: updatedPrompt.description,
          isActive: updatedPrompt.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save prompt: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setEditingPrompt(null);
        await fetchServices(); // Refresh data
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (err: any) {
      console.error("Error saving prompt:", err);
      toast.error(`Failed to save prompt: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading service prompts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
          <Button onClick={fetchServices} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Active Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Service Prompt Management</span>
              </CardTitle>
              {activeConfiguration && (
                <p className="text-sm text-gray-600 mt-1">
                  Active Configuration:{" "}
                  <strong>{activeConfiguration.name}</strong>(
                  {activeConfiguration.provider} -{" "}
                  {activeConfiguration.modelName})
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={fetchServices}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleResetToDefaults}
                variant="destructive"
                size="sm"
                disabled={resetting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resetting ? "Resetting..." : "Reset to Defaults"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.service}
            service={service}
            onEditPrompt={handleEditPrompt}
          />
        ))}
      </div>

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <PromptEditModal
          prompt={editingPrompt}
          onSave={handleSavePrompt}
          onCancel={() => setEditingPrompt(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function ServiceCard({
  service,
  onEditPrompt,
}: {
  service: ServiceData;
  onEditPrompt: (prompt: ServicePrompt) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{service.displayName}</CardTitle>
          <Badge variant={service.isComplete ? "default" : "destructive"}>
            {service.isComplete ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Incomplete
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Prompt */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">System Prompt</span>
            {service.systemPrompt ? (
              <Button
                onClick={() => onEditPrompt(service.systemPrompt!)}
                variant="outline"
                size="sm"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <Badge variant="secondary">Missing</Badge>
            )}
          </div>
          {service.systemPrompt ? (
            <div className="text-xs text-gray-600">
              <p className="truncate">
                {service.systemPrompt.description || "No description"}
              </p>
              <p className="mt-1">Version: {service.systemPrompt.version}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No system prompt configured</p>
          )}
        </div>

        {/* User Prompt */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">User Prompt</span>
            {service.userPrompt ? (
              <Button
                onClick={() => onEditPrompt(service.userPrompt!)}
                variant="outline"
                size="sm"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <Badge variant="secondary">Missing</Badge>
            )}
          </div>
          {service.userPrompt ? (
            <div className="text-xs text-gray-600">
              <p className="truncate">
                {service.userPrompt.description || "No description"}
              </p>
              <p className="mt-1">
                Type: {service.userPrompt.promptType} | Version:{" "}
                {service.userPrompt.version}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No user prompt configured</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PromptEditModal({
  prompt,
  onSave,
  onCancel,
  saving,
}: {
  prompt: ServicePrompt;
  onSave: (prompt: ServicePrompt) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState(prompt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit {prompt.promptType} Prompt</CardTitle>
            <Button onClick={onCancel} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Brief description of this prompt"
            />
          </div>

          {/* Prompt Content */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {prompt.promptType === "SYSTEM" ? "System Prompt" : "User Prompt"}{" "}
              Content
            </label>
            <textarea
              value={
                prompt.promptType === "SYSTEM"
                  ? formData.systemPrompt || ""
                  : formData.userPrompt || ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [prompt.promptType === "SYSTEM"
                    ? "systemPrompt"
                    : "userPrompt"]: e.target.value,
                })
              }
              rows={15}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              placeholder="Enter prompt content..."
            />
            {prompt.promptType !== "SYSTEM" && (
              <p className="text-xs text-gray-500 mt-1">
                Use {"{{variable}}"} syntax for template variables
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              Active (used in production)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={onCancel} variant="outline" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => onSave(formData)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
