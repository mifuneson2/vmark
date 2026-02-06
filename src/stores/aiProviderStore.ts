/**
 * AI Provider Store
 *
 * Manages available AI providers (CLI + REST) and active selection.
 * Persists provider selection and REST API configurations.
 * API keys are ephemeral — not persisted to localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type {
  CliProviderInfo,
  RestProviderConfig,
  ProviderType,
  RestProviderType,
} from "@/types/aiPrompts";

// ============================================================================
// Types
// ============================================================================

interface AiProviderState {
  activeProvider: ProviderType | null;
  cliProviders: CliProviderInfo[];
  restProviders: RestProviderConfig[];
  detecting: boolean;
}

interface AiProviderActions {
  detectProviders(): Promise<void>;
  setActiveProvider(type: ProviderType): void;
  updateRestProvider(
    type: RestProviderType,
    updates: Partial<RestProviderConfig>
  ): void;
  getActiveProviderName(): string;
}

// ============================================================================
// Default REST providers
// ============================================================================

const DEFAULT_REST_PROVIDERS: RestProviderConfig[] = [
  {
    type: "anthropic",
    name: "Anthropic",
    endpoint: "https://api.anthropic.com",
    apiKey: "",
    model: "claude-sonnet-4-5-20250929",
    enabled: false,
  },
  {
    type: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com",
    apiKey: "",
    model: "gpt-4o",
    enabled: false,
  },
  {
    type: "google-ai",
    name: "Google AI",
    endpoint: "",
    apiKey: "",
    model: "gemini-2.0-flash",
    enabled: false,
  },
  {
    type: "ollama-api",
    name: "Ollama (API)",
    endpoint: "http://localhost:11434",
    apiKey: "",
    model: "llama3.2",
    enabled: false,
  },
];

// Race guard counter for detectProviders
let _detectId = 0;

// ============================================================================
// Store
// ============================================================================

export const useAiProviderStore = create<AiProviderState & AiProviderActions>()(
  persist(
    (set, get) => ({
      activeProvider: null,
      cliProviders: [],
      restProviders: DEFAULT_REST_PROVIDERS,
      detecting: false,

      detectProviders: async () => {
        const thisDetectId = ++_detectId;
        set({ detecting: true });
        try {
          type RawEntry = {
            type: string;
            name: string;
            command: string;
            available: boolean;
            path?: string;
          };
          const raw: RawEntry[] = await invoke("detect_ai_providers");

          // Stale check
          if (thisDetectId !== _detectId) return;

          const providers: CliProviderInfo[] = raw.map((r) => ({
            type: r.type as CliProviderInfo["type"],
            name: r.name,
            command: r.command,
            available: r.available,
            path: r.path,
          }));
          set({ cliProviders: providers, detecting: false });

          // Validate active provider is still available
          const { activeProvider, restProviders } = get();
          if (activeProvider) {
            const cliAvailable = providers.some(
              (p) => p.type === activeProvider && p.available
            );
            const restAvailable = restProviders.some(
              (p) => p.type === activeProvider && p.enabled
            );
            if (!cliAvailable && !restAvailable) {
              // Active provider is gone — pick first available or null
              const firstCli = providers.find((p) => p.available);
              const firstRest = restProviders.find((p) => p.enabled);
              set({
                activeProvider: firstCli?.type ?? firstRest?.type ?? null,
              });
            }
          } else {
            // No active provider — auto-select first available
            const first = providers.find((p) => p.available);
            if (first) {
              set({ activeProvider: first.type });
            }
          }
        } catch (e) {
          console.error("Failed to detect providers:", e);
          if (thisDetectId === _detectId) {
            set({ detecting: false });
          }
        }
      },

      setActiveProvider: (type) => {
        set({ activeProvider: type });
      },

      updateRestProvider: (type, updates) => {
        set((state) => ({
          restProviders: state.restProviders.map((p) =>
            p.type === type ? { ...p, ...updates } : p
          ),
        }));
      },

      getActiveProviderName: () => {
        const { activeProvider, cliProviders, restProviders } = get();
        if (!activeProvider) return "None";
        const cli = cliProviders.find((p) => p.type === activeProvider);
        if (cli) return cli.name;
        const rest = restProviders.find((p) => p.type === activeProvider);
        if (rest) return rest.name;
        return activeProvider;
      },
    }),
    {
      name: "vmark-ai-providers",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProvider: state.activeProvider,
        // Strip apiKey from persisted REST providers (ephemeral — Fix 7)
        restProviders: state.restProviders.map((p) => ({
          ...p,
          apiKey: "",
        })),
      }),
      migrate: (persisted, version) => {
        if (version === 0) {
          // v0 → v1: merge DEFAULT_REST_PROVIDERS by type, preserving user overrides
          const old = persisted as {
            activeProvider?: ProviderType | null;
            restProviders?: RestProviderConfig[];
          };
          const merged = DEFAULT_REST_PROVIDERS.map((def) => {
            const existing = old.restProviders?.find((p) => p.type === def.type);
            return existing
              ? { ...def, ...existing, apiKey: "" }
              : def;
          });
          return {
            activeProvider: old.activeProvider ?? null,
            restProviders: merged,
          };
        }
        return persisted as AiProviderState;
      },
    }
  )
);
