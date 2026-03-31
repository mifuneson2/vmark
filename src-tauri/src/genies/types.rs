//! Genie type definitions.

use serde::Serialize;

/// A discovered genie file with name, path, source, and optional category.
#[derive(Debug, Serialize, Clone)]
pub struct GenieEntry {
    pub name: String,
    pub path: String,
    pub source: String, // "global"
    pub category: Option<String>,
}

/// Parsed genie file: metadata from frontmatter and prompt template body.
#[derive(Debug, Serialize)]
pub struct GenieContent {
    pub metadata: GenieMetadata,
    pub template: String,
}

/// Genie metadata extracted from YAML frontmatter (name, scope, model, etc.).
#[derive(Debug, Serialize)]
pub struct GenieMetadata {
    pub name: String,
    pub description: String,
    pub scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Suggestion type: "replace" (default) or "insert" (append after source).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
    /// Number of surrounding blocks to include as context (0–2).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<u8>,
    // === Genie Spec v1 fields (typed I/O for workflows) ===
    /// Spec version marker. Present only for v1+ genies.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    /// Typed input spec (v1 only).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<GenieIoSpec>,
    /// Typed output spec (v1 only).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<GenieIoSpec>,
    /// Tags for search and gallery (v1 only).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// Input/output type spec for Genie v1.
#[derive(Debug, Serialize, Clone)]
pub struct GenieIoSpec {
    #[serde(rename = "type")]
    pub io_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accept: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Entry returned by menu scanning — title derived from filename.
pub struct GenieMenuEntry {
    pub title: String,
    pub path: String,
    pub category: Option<String>,
}
