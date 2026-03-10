
/**
 * Common Modal Components
 * 
 * Reusable modal dialogs for confirmations, warnings, and alerts.
 */

export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { FormResizableModal } from "./FormResizableModal";
export type { FormResizableModalProps } from "./FormResizableModal";

export { ConfirmationModal } from "./ConfirmationModal";
export type { ConfirmationModalProps } from "./ConfirmationModal";

export { BudgetViolationModal } from "./BudgetViolationModal";
export type { 
    BudgetViolationModalProps, 
    ViolationData, 
    ViolationDetail 
} from "./BudgetViolationModal";
