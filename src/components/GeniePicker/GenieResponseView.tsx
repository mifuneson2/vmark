/**
 * GenieResponseView — Inline AI response display
 *
 * Purpose: Renders the AI response area within the GeniePicker overlay.
 * Shows thinking/streaming state during processing, response text with
 * accept/reject/retry actions in preview mode, and error state with retry.
 *
 * @module components/GeniePicker/GenieResponseView
 */

import { AlertTriangle, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PickerMode } from "@/stores/geniePickerStore";
import "./GenieResponseView.css";

interface GenieResponseViewProps {
  mode: PickerMode;
  responseText: string;
  elapsedSeconds: number;
  error: string | null;
  submittedPrompt: string | null;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

/** Renders the AI response area within the GeniePicker (processing, preview, or error state). */
export function GenieResponseView({
  mode,
  responseText,
  elapsedSeconds,
  error,
  submittedPrompt,
  onAccept,
  onReject,
  onRetry,
  onCancel,
}: GenieResponseViewProps) {
  const { t } = useTranslation("ai");

  if (mode === "search" || mode === "freeform") return null;

  if (mode === "processing") {
    return (
      <div className="genie-response-view">
        {submittedPrompt && (
          <div className="genie-response-prompt">{submittedPrompt}</div>
        )}
        {responseText ? (
          <div className="genie-response-text">
            {responseText}
            <span className="genie-response-cursor" />
          </div>
        ) : (
          <div className="genie-response-thinking">
            <Sparkles size={14} className="genie-response-spinner" />
            <span>{t("response.thinking", { seconds: elapsedSeconds })}</span>
          </div>
        )}
        <div className="genie-response-actions">
          <button
            className="genie-response-btn genie-response-btn--reject"
            onClick={onCancel}
            aria-label={t("response.cancel")}
          >
            <X size={12} />
            {t("response.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="genie-response-view">
        <div className="genie-response-error">
          <AlertTriangle size={14} />
          <span>{error ?? t("response.unknownError")}</span>
        </div>
        <div className="genie-response-actions">
          <button
            className="genie-response-btn genie-response-btn--retry"
            onClick={onRetry}
            aria-label={t("response.retry")}
          >
            <RotateCcw size={12} />
            {t("response.retry")}
          </button>
          <button
            className="genie-response-btn genie-response-btn--reject"
            onClick={onReject}
            aria-label={t("response.dismiss")}
          >
            <X size={12} />
            {t("response.dismiss")}
          </button>
        </div>
      </div>
    );
  }

  // mode === "preview"
  return (
    <div className="genie-response-view">
      {responseText && (
        <div className="genie-response-text">{responseText}</div>
      )}
      <div className="genie-response-actions">
        <button
          className="genie-response-btn genie-response-btn--accept"
          onClick={onAccept}
          aria-label={t("response.accept")}
        >
          <Check size={12} />
          {t("response.accept")}
        </button>
        <button
          className="genie-response-btn genie-response-btn--reject"
          onClick={onReject}
          aria-label={t("response.reject")}
        >
          <X size={12} />
          {t("response.reject")}
        </button>
        <button
          className="genie-response-btn genie-response-btn--retry"
          onClick={onRetry}
          aria-label={t("response.retry")}
        >
          <RotateCcw size={12} />
          {t("response.retry")}
        </button>
      </div>
    </div>
  );
}
