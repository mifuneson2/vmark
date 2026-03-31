//! Workflow execution engine.
//!
//! Parses and executes YAML workflow files with step-by-step execution,
//! event emission to the frontend, and built-in action support.

pub mod commands;
pub mod runner;
pub mod snapshots;
pub mod types;
