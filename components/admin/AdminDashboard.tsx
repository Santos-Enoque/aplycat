import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Code,
  Cpu,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Star,
  Activity,
  Database,
  Clock,
} from "lucide-react";
import ServicePromptManager from "./ServicePromptManager";
import ModelConfigEditor from "./ModelConfigEditor";

interface ModelConfiguration {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  modelName: string;
  modelVersion: string | null;
  temperature: number | null;
  maxTokens: number | null;
  topP: number | null;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  prompts: ModelPrompt[];
  _count: {
    prompts: number;
  };
}

interface ModelPrompt {
  id: string;
  name: string;
  promptType: "SYSTEM" | "USER" | "TEMPLATE";
  systemPrompt: string | null;
  userPrompt: string | null;
  description: string | null;
  templateVariables: any;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"models" | "services">("models");
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/models");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load configurations");
      }

      setConfigurations(data.configurations);

      // Auto-select first configuration
      if (data.configurations.length > 0 && !selectedConfig) {
        setSelectedConfig(data.configurations[0].id);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const response = await fetch(
        `/api/admin/models/${configId}/set-default`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set default");
      }

      await loadConfigurations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this model configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/models/${configId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete configuration");
      }

      await loadConfigurations();
      if (selectedConfig === configId) {
        setSelectedConfig(configurations[0]?.id || null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/seed", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to seed database");
      }

      await loadConfigurations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfiguration = configurations.find(
    (c) => c.id === selectedConfig
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-lg">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🛠️ Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage AI models, prompts, and system configuration
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={loadConfigurations} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSeedDatabase} variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Seed DB
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab("models")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "models"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Cpu className="h-4 w-4 inline mr-2" />
            Model Configurations
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "services"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Code className="h-4 w-4 inline mr-2" />
            Service Prompts
          </button>
        </div>

        {activeTab === "models" && (
          <ModelConfigEditor
            configurations={configurations}
            onRefresh={loadConfigurations}
            selectedConfigId={selectedConfig}
            onSelectConfig={setSelectedConfig}
          />
        )}

        {activeTab === "services" && <ServicePromptManager />}
      </div>
    </div>
  );
}

// Prompt Editor Component
function PromptEditor({
  prompt,
  onSave,
  onCancel,
}: {
  prompt: ModelPrompt;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: prompt.name,
    description: prompt.description || "",
    promptType: prompt.promptType,
    systemPrompt: prompt.systemPrompt || "",
    userPrompt: prompt.userPrompt || "",
    isActive: prompt.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      onSave();
      onCancel();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Edit Prompt: {prompt.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={formData.promptType}
            onChange={(e) =>
              setFormData({ ...formData, promptType: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="SYSTEM">System</option>
            <option value="USER">User</option>
            <option value="TEMPLATE">Template</option>
          </select>
        </div>

        {formData.promptType === "SYSTEM" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>
        )}

        {(formData.promptType === "USER" ||
          formData.promptType === "TEMPLATE") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Prompt{" "}
              {formData.promptType === "TEMPLATE" &&
                "(with template variables)"}
            </label>
            <textarea
              value={formData.userPrompt}
              onChange={(e) =>
                setFormData({ ...formData, userPrompt: e.target.value })
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
            {formData.promptType === "TEMPLATE" && (
              <p className="text-xs text-gray-500 mt-1">
                Use {"{{}}"} syntax for variables (e.g., {"{{targetRole}}"})
              </p>
            )}
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}
