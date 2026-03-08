/**
 * Command Layer
 *
 * Purpose: Pure decision logic for file operations — commands return action
 *   objects describing what to do, not side effects. Hooks call commands
 *   to determine intent, then execute the resulting actions.
 *
 * @module hooks/commands
 */
export { applyPathReconciliation } from "./applyPathReconciliation";
