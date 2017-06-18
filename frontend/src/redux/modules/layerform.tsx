import * as dotProp from "dot-prop-immutable"
import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const SUBMITTED = "ealgis/layerform/SUBMITTED"
const PUBLISH = "ealgis/layerform/PUBLISH"
const RESTORE_MASTER = "ealgis/layerform/RESTORE_MASTER"
const LOAD_CHIPS = "ealgis/layerform/LOAD_CHIPS"
const VALIDATION_ERRORS = "ealgis/layerform/VALIDATION_ERRORS"

const initialState: IModule = {
    submitting: false,
    chips: [],
}

// Reducer
export default function reducer(state = initialState, action: IAction) {
    switch (action.type) {
        case RESTORE_MASTER:
        case PUBLISH:
            return dotProp.set(state, "submitting", true)
        case SUBMITTED:
            return dotProp.set(state, "submitting", false)
        case LOAD_CHIPS:
            return dotProp.set(state, "chips", action.chips)
        default:
            return state
    }
}

export const reduxFormReducer = (state: {}, action: any) => {
    switch (action.type) {
        case VALIDATION_ERRORS:
            state = dotProp.set(state, "submitSucceeded", false)
            return dotProp.merge(state, "syncErrors", action.errors)
        default:
            return state
    }
}

// Action Creators
export function beginPublish(): IAction {
    return {
        type: PUBLISH,
        meta: {
            analytics: {
                category: "LayerForm",
            },
        },
    }
}

export function beginRestoreMaster(): IAction {
    return {
        type: RESTORE_MASTER,
        meta: {
            analytics: {
                category: "LayerForm",
            },
        },
    }
}

export function finishedSubmitting(): IAction {
    return {
        type: SUBMITTED,
    }
}

export function loadChips(chips: Array<string>): IAction {
    return {
        type: LOAD_CHIPS,
        chips,
    }
}

export function loadValidationErrors(errors: object): IAction {
    return {
        type: VALIDATION_ERRORS,
        errors,
    }
}

// Models
export interface IModule {
    submitting: boolean
    chips: Array<string>
}

export interface IAction {
    type: string
    meta?: {
        analytics: IAnalyticsMeta
    }
    chips?: Array<string>
    errors?: object
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
