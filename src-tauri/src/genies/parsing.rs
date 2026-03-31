//! Genie frontmatter parser.
//!
//! Parses YAML-like frontmatter from genie markdown files into
//! structured metadata and template content.

use super::types::{GenieContent, GenieMetadata};
use std::collections::HashMap;
use std::path::Path;

/// Derive a display name from a file path's stem, stripping control characters.
fn name_from_path(path: &str) -> String {
    Path::new(path)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .chars()
        .filter(|c| !c.is_control())
        .collect()
}

/// Parse genie content and extract metadata.
///
/// `path` must be an absolute or canonical filesystem path — the filename stem
/// is used as the display name. Callers (`read_genie`, `scan_genies_dir`) always
/// provide paths from filesystem enumeration or `fs::canonicalize`.
pub(crate) fn parse_genie(content: &str, path: &str) -> Result<GenieContent, String> {
    // Strip UTF-8 BOM if present
    let content = content.trim_start_matches('\u{FEFF}');
    let trimmed = content.trim_start();

    // Require opening fence to be exactly "---" on its own line (not "----" or "--- extra")
    let has_frontmatter = trimmed.starts_with("---")
        && trimmed[3..].starts_with(|c: char| c == '\n' || c == '\r');
    if !has_frontmatter {
        // No frontmatter — use filename as name
        let name = name_from_path(path);
        return Ok(GenieContent {
            metadata: GenieMetadata {
                name,
                description: String::new(),
                scope: "selection".to_string(),
                category: None,
                model: None,
                action: None,
                context: None,
                version: None,
                input: None,
                output: None,
                tags: None,
            },
            template: content.to_string(),
        });
    }

    // Find closing ---
    let after_first = &trimmed[3..];
    let closing = after_first
        .find("\n---")
        .ok_or_else(|| format!("No closing --- in frontmatter: {}", path))?;

    let frontmatter_block = &after_first[..closing];
    let template = after_first[closing + 4..].trim_start().to_string();

    // Parse key: value lines
    let mut fields: HashMap<String, String> = HashMap::new();
    for line in frontmatter_block.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Some((key, value)) = line.split_once(':') {
            fields.insert(
                key.trim().to_lowercase(),
                value.trim().trim_matches(|c| c == '"' || c == '\'').to_string(),
            );
        }
    }

    // Always derive name from filename — renaming the file changes the display name.
    // Frontmatter `name:` is intentionally ignored for this field.
    let name = name_from_path(path);

    // Check for Genie v1 spec
    let version = fields.get("genie").cloned();
    let (input, output, tags) = if version.as_deref() == Some("v1") {
        // For v1, parse input/output from frontmatter key:value pairs.
        // Full nested YAML parsing (serde_yaml) deferred to a future release —
        // this simple parser handles the flat `input_type:`, `output_type:` form.
        let input = fields.get("input_type").map(|t| super::types::GenieIoSpec {
            io_type: t.clone(),
            accept: fields.get("input_accept").cloned(),
            description: fields.get("input_description").cloned(),
        });
        let output = fields.get("output_type").map(|t| super::types::GenieIoSpec {
            io_type: t.clone(),
            accept: None,
            description: fields.get("output_description").cloned(),
        });
        let tags = fields.get("tags").map(|t| {
            t.split(',').map(|s| s.trim().to_string()).collect()
        });
        (input, output, tags)
    } else {
        (None, None, None)
    };

    Ok(GenieContent {
        metadata: GenieMetadata {
            name,
            description: fields.get("description").cloned().unwrap_or_default(),
            scope: fields
                .get("scope")
                .cloned()
                .unwrap_or_else(|| "selection".to_string()),
            category: fields.get("category").cloned(),
            model: fields.get("model").cloned(),
            action: fields.get("action").filter(|v| v.as_str() == "replace" || v.as_str() == "insert").cloned(),
            context: fields.get("context")
                .and_then(|v| v.parse::<u8>().ok())
                .filter(|&v| v <= 2),
            version,
            input,
            output,
            tags,
        },
        template,
    })
}
