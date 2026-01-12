/**
 * Central helper for Firestore subscriptions with consistent error handling
 * 
 * Provides a wrapper around onSnapshot to ensure all subscriptions have
 * proper error handling and logging.
 */

import { FirestoreError, onSnapshot as firestoreOnSnapshot, Query } from "firebase/firestore";

/**
 * Wrapper around onSnapshot with standardized error handling
 * 
 * @param query - Firestore query to subscribe to
 * @param label - Human-readable label for this subscription (e.g., "BookingsScreen appointments")
 * @param onNext - Callback for successful snapshot updates
 * @param onError - Optional custom error handler (in addition to default logging)
 * @returns Unsubscribe function
 */
export function onSnapshot(
  query: Query,
  label: string,
  onNext: (snapshot: any) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  return firestoreOnSnapshot(
    query,
    onNext,
    (error: FirestoreError) => {
      // Always log the error with the label for debugging
      console.error(`[firestore-subs] ${label} snapshot error:`, {
        code: error.code,
        message: error.message,
      });

      // Call custom error handler if provided
      if (onError) {
        onError(error);
      }
    }
  );
}
