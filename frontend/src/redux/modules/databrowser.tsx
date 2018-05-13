import * as dotProp from "dot-prop-immutable";
import { parse } from "mathjs";
import { loadColumns as loadColumnsToAppCache, loadTables as loadTablesToAppCache } from "../../redux/modules/ealgis";
import { sendNotification as sendSnackbarNotification } from "../../redux/modules/snackbars";
import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics";
import { IEALGISApiClient } from "../../shared/api/EALGISApiClient";
import { IColumn, IColumnInfo, IGeomTable, IStore, ITable, eEalUIComponent, eLayerFilterExpressionMode, eLayerValueExpressionMode } from "./interfaces";

// Actions
const START = "ealgis/databrowser/START"
const FINISH = "ealgis/databrowser/FINISH"
const ADD_TABLES = "ealgis/databrowser/ADD_TABLES"
const ADD_COLUMNS = "ealgis/databrowser/ADD_COLUMNS"
const SELECT_COLUMN = "ealgidatabrowser/SELECT_COLUMN"

const initialState: Partial<IModule> = {
    active: false,
    config: { showColumnNames: false, closeOnFinish: true },
    tables: [],
    columns: [],
    selectedColumns: [],
}

// Reducer
export default function reducer(state = initialState, action: IAction) {
    switch (action.type) {
        case START:
            state = dotProp.set(state, "active", true)
            state = dotProp.set(state, "tables", [])
            state = dotProp.set(state, "columns", [])
            state = dotProp.set(state, "selectedColumns", [])
            state = dotProp.set(state, "component", action.component)
            state = dotProp.set(state, "config", { ...state.config, ...action.config })
            return dotProp.set(state, "message", action.message)
        case FINISH:
            return dotProp.set(state, "active", false)
        case ADD_TABLES:
            return dotProp.set(state, "tables", action.tables)
        case ADD_COLUMNS:
            return dotProp.set(state, "columns", action.columns)
        case SELECT_COLUMN:
            return dotProp.set(state, "selectedColumns", [...state.selectedColumns!, action.column])
        default:
            return state
    }
}

// Action Creators
export function startBrowsing(component: eEalUIComponent, message: string, config: Partial<IDataBrowserConfig> = {}): IAction {
    return {
        type: START,
        component,
        message,
        config,
        meta: {
            analytics: {
                category: "DataBrowser",
            },
        },
    }
}
export function finishBrowsing(): IAction {
    return {
        type: FINISH,
        meta: {
            analytics: {
                category: "DataBrowser",
            },
        },
    }
}
export function addTables(tables: Array<Partial<ITable>>): IAction {
    return {
        type: ADD_TABLES,
        tables,
        meta: {
            analytics: {
                category: "DataBrowser",
            },
        },
    }
}
export function addColumns(columns: Array<string>): IAction {
    return {
        type: ADD_COLUMNS,
        columns,
        meta: {
            analytics: {
                category: "DataBrowser",
            },
        },
    }
}
export function selectColumn(column: IColumn): IAction {
    return {
        type: SELECT_COLUMN,
        column,
        meta: {
            analytics: {
                category: "DataBrowser",
            },
        },
    }
}

// Models
export interface IModule {
    active: boolean
    component: eEalUIComponent
    message: string
    config: IDataBrowserConfig
    tables: Array<Partial<ITable>>
    columns: Array<string>
    selectedColumns: Array<IColumn>
}

export interface IAction {
    type: string
    component?: eEalUIComponent
    message?: string
    config?: Partial<IDataBrowserConfig>
    tables?: Array<Partial<ITable>>
    columns?: Array<string>
    column?: IColumn
    meta?: {
        analytics: IAnalyticsMeta
    }
}

export interface IDataBrowserConfig {
    showColumnNames: boolean
    closeOnFinish: boolean
}

export interface ISelectedSchemas {
    schemas: Array<string> // e.g. [General Community Profile]
    families: Array<string> // e.g. [ABS Census 2016]
}

export interface ITablesBySchemaAndFamily {
    [key: string]: ITableFamily
}

export interface ITableFamily {
    family: string
    type: string
    tables: Array<ITable>
}

export interface ITableColumns {
    // columnUID = schema_name.column_id
    [key: string]: IColumn
}

export interface IDataBrowserResult {
    valid: boolean
    message?: string
    columns?: Array<IColumn>
}
export enum eTableChooserLayout {
    LIST_LAYOUT = 1,
    GRID_LAYOUT = 2,
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchTablesForSchema(schema_name: string, geometry: IGeomTable) {
    return async (dispatch: Function, getState: Function, ealapi: IEALGISApiClient) => {
        const { response, json } = await ealapi.get("/api/0.1/tableinfo/", dispatch, {
            schema: schema_name,
            geo_source_id: geometry._id,
        })
        if (response.status === 404) {
            dispatch(sendSnackbarNotification(`This schema contains no tables for '${geometry.description}' geometries.`))
        } else if (response.status === 200) {
            dispatch(loadTablesToAppCache(json))

            const tablePartials: Array<Partial<ITable>> = Object.keys(json).map((tableUID: string) => {
                return { id: json[tableUID]["id"], schema_name: json[tableUID]["schema_name"] }
            })
            dispatch(addTables(tablePartials))
        }
    }
}

export function searchTables(
    searchStrings: Array<string>,
    searchStringsExcluded: Array<string>,
    geometry: IGeomTable,
    selectedSchemas?: ISelectedSchemas
) {
    return async (dispatch: Function, getState: Function, ealapi: IEALGISApiClient) => {
        let params: any = {
            search: searchStrings.join(","),
            search_excluded: searchStringsExcluded.join(","),
            geo_source_id: geometry._id,
        }
        if (selectedSchemas !== undefined) {
            if (selectedSchemas.families.length > 0) {
                params["schema_families"] = JSON.stringify(selectedSchemas.families)
            }
            if (selectedSchemas.schemas.length > 0) {
                params["schemas"] = JSON.stringify(selectedSchemas.schemas)
            }
        }

        const { response, json } = await ealapi.get("/api/0.1/tableinfo/search/", dispatch, params)

        if (response.status === 404) {
            dispatch(sendSnackbarNotification("No tables found matching your search criteria."))
        } else if (response.status === 200) {
            dispatch(loadTablesToAppCache(json))

            const tablePartials: Array<Partial<ITable>> = Object.keys(json).map((tableUID: string) => {
                return { id: json[tableUID]["id"], schema_name: json[tableUID]["schema_name"] }
            })
            dispatch(addTables(tablePartials))
        }
    }
}

export function fetchColumns(schema_name: string, tableinfo_id: number) {
    return async (dispatch: Function, getState: Function, ealapi: IEALGISApiClient) => {
        const { response, json } = await ealapi.get("/api/0.1/columninfo/fetch_for_table/", dispatch, {
            schema: schema_name,
            tableinfo_id: tableinfo_id,
        })

        dispatch(loadColumnsToAppCache(json["columns"]))
        dispatch(addColumns(Object.keys(json["columns"])))
    }
}

export function emptySelectedTables() {
    return (dispatch: Function) => {
        dispatch(addTables([]))
    }
}
export function emptySelectedColumns() {
    return (dispatch: Function) => {
        dispatch(addColumns([]))
    }
}

// @FIXME Lazy person's redux selectors
export function fetchResultForComponent(component: eEalUIComponent, state: IStore): IDataBrowserResult {
    const { databrowser } = state

    if (databrowser.active === false && databrowser.component === component && databrowser.selectedColumns.length > 0) {
        return {
            valid: true,
            message: databrowser.message,
            columns: databrowser.selectedColumns,
        }
    }
    return { valid: false }
}

export function parseColumnsFromExpression(expression: string, expression_mode: eLayerValueExpressionMode | eLayerFilterExpressionMode) {
    const parsed: any = parse(expression)
    return parsed.filter((node: any) => node.isAccessorNode).map((node: any) => node.toString())
}

export function getValueExpressionWithColumns(expression: any, expression_mode: eLayerValueExpressionMode, columninfo: IColumnInfo) {
    const columns: Array<string> = parseColumnsFromExpression(expression, expression_mode)

    // FIXME Hacky for proof of concept component
    if (expression_mode === eLayerValueExpressionMode.SINGLE) {
        return {
            col1: getColumnByName(columns[0], columninfo),
        }
    } else if (expression_mode === eLayerValueExpressionMode.PROPORTIONAL) {
        return {
            col1: getColumnByName(columns[0], columninfo),
            col2: getColumnByName(columns[1], columninfo),
        }
    } else if (expression_mode === eLayerValueExpressionMode.ADVANCED) {
        // throw Error("Umm, we can't do that yet.")
    }
    return {}
}

export function parseFilterExpression(expression: string, expression_mode: eLayerFilterExpressionMode) {
    // FIXME Hacky for proof of concept component
    if (expression_mode === eLayerFilterExpressionMode.SIMPLE) {
        let matches = /([a-z0-9$()<>*/]*?)([>=<!]{1,2})([a-z0-9]+)/g.exec(expression)
        return {
            col1: matches![1],
            operator: matches![2],
            col2: matches![3],
        }
    } else if (expression_mode === eLayerFilterExpressionMode.ADVANCED) {
        // throw Error("Umm, we can't do that yet.")
    }
    return {}
}

export function getFilterExpressionWithColumns(expression: any, expression_mode: eLayerFilterExpressionMode, columninfo: IColumnInfo) {
    // FIXME Hacky for proof of concept component
    if (expression_mode === eLayerFilterExpressionMode.SIMPLE) {
        const parsed: any = parseFilterExpression(expression, expression_mode)
        return {
            col1: getColumnByName(parsed.col1, columninfo) || parsed.col1,
            operator: parsed.operator,
            col2: getColumnByName(parsed.col2, columninfo) || parsed.col2,
        }
    } else if (expression_mode === eLayerFilterExpressionMode.ADVANCED) {
        // throw Error("Umm, we can't do that yet.")
    }
    return {}
}

// @FIXME Assumes column names are unique within a schema (which works OK for Census data). There's no guarnatee that they are, though.
function getColumnByName(column_schema_and_name: string, columninfo: IColumnInfo) {
    const [schema_name, column_name] = column_schema_and_name.split(".")
    for (let key in columninfo) {
        const col: IColumn = columninfo[key]
        if (col.name === column_name) {
            return col
        }
    }
    return null
}
