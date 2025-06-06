"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Star, Trash2, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

interface ModelConfiguration {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  modelName: string;
  temperature: number | null;
  maxTokens: number | null;
  topP: number | null;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  prompts: any[];
  _count: {
    prompts: number;
  };
}

interface ModelConfigEditorProps {
  configurations: ModelConfiguration[];
  onRefresh: () => Promise<void>;
  selectedConfigId: string | null;
  onSelectConfig: (configId: string) => void;
}

export default function ModelConfigEditor({
  configurations,
  onRefresh,
  selectedConfigId,
  onSelectConfig,
}: ModelConfigEditorProps) {
  const [editingConfig, setEditingConfig] = useState<ModelConfiguration | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedConfiguration = configurations.find(
    (c) => c.id === selectedConfigId
  );

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

      await onRefresh();
    } catch (err: any) {
      toast.error(`Failed to set default: ${err.message}`);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    // Show warning toast with confirmation
    toast.error("Delete configuration? This action cannot be undone.", {
      action: {
        label: "Delete",
        onClick: async () => {
          await performDelete(configId);
        },
      },
    });
  };

  const performDelete = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/models/${configId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete configuration");
      }

      await onRefresh();
    } catch (err: any) {
      toast.error(`Failed to delete configuration: ${err.message}`);
    }
  };

  const handleSaveConfig = async (configData: any) => {
    try {
      setSaving(true);

      const url = isCreating
        ? "/api/admin/models"
        : `/api/admin/models/${editingConfig?.id}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      setEditingConfig(null);
      setIsCreating(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(`Failed to save configuration: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configurations List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Model Configurations</CardTitle>
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {configurations.map((config) => (
              <div
                key={config.id}
                onClick={() => onSelectConfig(config.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedConfigId === config.id
                    ? "border-purple-200 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{config.name}</h3>
                  <div className="flex items-center gap-1">
                    {config.isDefault && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                    <Badge
                      variant={config.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <div>
                    {config.provider} • {config.modelName}
                  </div>
                  <div>{config._count.prompts} prompts</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details */}
      <div className="lg:col-span-2">
        {editingConfig || isCreating ? (
          <ConfigurationForm
            config={editingConfig}
            isCreating={isCreating}
            onSave={handleSaveConfig}
            onCancel={() => {
              setEditingConfig(null);
              setIsCreating(false);
            }}
            saving={saving}
          />
        ) : selectedConfiguration ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedConfiguration.name}
                  {selectedConfiguration.isDefault && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedConfiguration.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setEditingConfig(selectedConfiguration)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {!selectedConfiguration.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(selectedConfiguration.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Default
                  </Button>
                )}
                {!selectedConfiguration.isDefault && (
                  <Button
                    onClick={() =>
                      handleDeleteConfiguration(selectedConfiguration.id)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Provider
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedConfiguration.provider}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedConfiguration.modelName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Temperature
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedConfiguration.temperature || "Default"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Max Tokens
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedConfiguration.maxTokens || "Default"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Top P
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedConfiguration.topP || "Default"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Version
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    v{selectedConfiguration.version}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Status
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedConfiguration.isActive ? "default" : "secondary"
                      }
                    >
                      {selectedConfiguration.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {selectedConfiguration.isDefault && (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Created:{" "}
                    {new Date(
                      selectedConfiguration.createdAt
                    ).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Updated:{" "}
                    {new Date(
                      selectedConfiguration.updatedAt
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  Select a Configuration
                </h3>
                <p className="text-gray-600">
                  Choose a model configuration to view details
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ConfigurationForm({
  config,
  isCreating,
  onSave,
  onCancel,
  saving,
}: {
  config: ModelConfiguration | null;
  isCreating: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: config?.name || "",
    description: config?.description || "",
    provider: config?.provider || "openai",
    modelName: config?.modelName || "gpt-4o-mini",
    temperature: config?.temperature || 0.1,
    maxTokens: config?.maxTokens || 4000,
    topP: config?.topP || 1.0,
    isActive: config?.isActive ?? true,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {isCreating ? "Create" : "Edit"} Model Configuration
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            size="sm"
            disabled={saving || !formData.name || !formData.modelName}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Configuration name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={2}
            placeholder="Configuration description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Name
          </label>
          <input
            type="text"
            value={formData.modelName}
            onChange={(e) =>
              setFormData({ ...formData, modelName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., gpt-4o-mini, claude-3-sonnet-20240229"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.provider === "openai" &&
              "Examples: gpt-4o-mini, gpt-4o, gpt-3.5-turbo"}
            {formData.provider === "anthropic" &&
              "Examples: claude-3-sonnet-20240229, claude-3-haiku-20240307"}
            {formData.provider === "gemini" &&
              "Examples: gemini-1.5-flash, gemini-1.5-pro"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
            </label>
            <input
              type="number"
              value={formData.temperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
              max="2"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              value={formData.maxTokens}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTokens: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
              max="32000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Top P
            </label>
            <input
              type="number"
              value={formData.topP}
              onChange={(e) =>
                setFormData({ ...formData, topP: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>

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
            Active (available for use)
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
