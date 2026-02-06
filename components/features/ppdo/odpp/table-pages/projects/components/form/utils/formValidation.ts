
/**
 * @deprecated These utilities have been moved to @/components/features/ppdo/odpp/common/utils
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { projectSchema, ProjectFormValues } from "./utils/formValidation";
 * After:  import { baseProjectSchema, BaseProjectFormValues } from "@/components/features/ppdo/odpp/common/utils";
 */

export {
    baseProjectSchema as projectSchema,
    type BaseProjectFormValues as ProjectFormValues,
} from "@/components/features/ppdo/odpp/utilities/common/utils/formValidation";