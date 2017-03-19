import Promise from 'promise-polyfill'
import 'whatwg-fetch'
import { browserHistory } from 'react-router';
import cookie from 'react-cookie'
import { compileLayerStyle } from '../utils/OLStyle'
import { SubmissionError } from 'redux-form'

export const RECEIVE_APP_LOADED = 'RECEIVE_APP_LOADED'
export const REQUEST_USER = 'REQUEST USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const REQUEST_MAPS = 'REQUEST MAPS'
export const RECEIVE_MAPS = 'RECEIVE_MAPS'
export const REQUEST_MAP_DEFINITION = 'REQUEST_MAP_DEFINITION'
export const RECEIVE_MAP_DEFINITION = 'RECEIVE_MAP_DEFINITION'
export const DELETE_MAP = 'DELETE_MAP'
export const CREATE_MAP = 'CREATE_MAP'
export const COMPILED_LAYER_STYLE = 'COMPILED_LAYER_STYLE'
export const CHANGE_LAYER_VISIBILITY = 'CHANGE_LAYER_VISIBILITY'
export const REQUEST_DATA_INFO = 'REQUEST_DATA_INFO'
export const RECEIVE_DATA_INFO = 'RECEIVE_DATA_INFO'
export const REQUEST_COLOUR_INFO = 'REQUEST_COLOUR_INFO'
export const RECEIVE_COLOUR_INFO = 'RECEIVE_COLOUR_INFO'
export const RECEIVE_UPDATED_MAP = 'RECEIVE_UPDATED_MAP'
export const RECEIVE_LAYER_UPSERT = 'RECEIVE_LAYER_UPSERT'
export const RECEIVE_DELETE_MAP_LAYER = 'RECEIVE_DELETE_MAP_LAYER'

export function requestUser() {
    return {
        type: REQUEST_USER
    }
}

export function receiveUser(json: any) {
    return {
        type: RECEIVE_USER,
        json
    }
}

export function requestMaps() {
    return {
        type: REQUEST_MAPS
    }
}

export function receiveMaps(maps: object) {
    return {
        type: RECEIVE_MAPS,
        maps
    }
}

export function requestMapDefinition() {
    return {
        type: REQUEST_MAP_DEFINITION
    }
}

export function receiveChangeLayerVisibility(mapId: number, layerId: number) {
    return {
        type: CHANGE_LAYER_VISIBILITY,
        mapId,
        layerId,
    }
}

export function changeLayerVisibility(map: object, layerId: number) {
    return (dispatch: any, getState: Function) => {
        dispatch(receiveChangeLayerVisibility(map["id"], layerId))
        dispatch(updateMap(getState().maps[map["id"]]))
    }
}

export function receiveDeleteMap(mapId: number) {
    return (dispatch: any) => {
        dispatch({
            type: DELETE_MAP,
            mapId
        })
    }
}

export function receiveCreatedMap(map: object) {
    return (dispatch: any) => {
        dispatch({
            type: CREATE_MAP,
            map
        })
    }
}

export function receiveCompiledLayerStyle(json: any) {
    return {
        type: COMPILED_LAYER_STYLE,
        json
    }
}

export function requestDataInfo() {
    return {
        type: REQUEST_DATA_INFO
    }
}

export function receiveDataInfo(json: any) {
    return {
        type: RECEIVE_DATA_INFO,
        json
    }
}

export function receiveColourInfo(json: any) {
    return {
        type: RECEIVE_COLOUR_INFO,
        json
    }
}

export function requestColourInfo() {
    return {
        type: REQUEST_COLOUR_INFO
    }
}

export function receiveLayerUpsert(mapId: number, layerId: number, layer: object) {
    return {
        type: RECEIVE_LAYER_UPSERT,
        mapId,
        layerId,
        layer
    }
}

export function receieveUpdatedMap(map: object) {
    return {
        type: RECEIVE_UPDATED_MAP,
        map
    }
}

export function receiveDeleteMapLayer(mapId: number, layerId: number) {
    return {
        type: RECEIVE_DELETE_MAP_LAYER,
        mapId,
        layerId
    }
}

export function receiveAppLoaded() {
    return {
        type: RECEIVE_APP_LOADED,
    }
}

export function updateMap(map: object) {
    return (dispatch: any) => {
        return fetch('/api/0.1/maps/' + map["id"] + "/", {
                method: "PUT",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookie.load("csrftoken")
                },
                body: JSON.stringify(map),
            })
            .then((response: any) => response.json().then((json: any) => ({
                response: response,
                json: json,
            }))
            .then(({ response, json }: any) => {
                // FIXME Cleanup and decide how to handle error at a component and application-level
                
                if(response.status === 200) {
                    // dispatch(receieveUpdatedMap(json))
                    
                } else if(response.status === 400) {
                    // We expect that the server will return the shape:
                    // {
                    //   username: 'User does not exist',
                    //   password: 'Wrong password',
                    //   non_field_errors: 'Some sort of validation error not relevant to a specific field'
                    // }
                    throw new SubmissionError({...json, _error: json.non_field_errors || null})

                } else {
                    // We're not sure what happened, but handle it:
                    // our Error will get passed straight to `.catch()`
                    throw new Error('Unhandled error creating map. Please report. (' + response.status + ') ' + JSON.stringify(json));
                }
            })
            .catch((error: any) => {
                // if(error instanceof SubmissionError) {
                throw error;
                // } else {
                    // throw new SubmissionError({_error: error.message});
                // }
            })
    }
}

export function layerUpsert(map: object, layerId: number, layer: object) {
    return (dispatch: any) => {
        // Upsert
        let mapCopy: object = JSON.parse(JSON.stringify(map))
        if(layerId === undefined) {
            mapCopy["json"]["layers"].push(layer)
        } else {
            mapCopy["json"]["layers"][layerId] = layer
        }

        fetch('/api/0.1/maps/' + mapCopy["id"] + "/", {
                method: "PUT",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookie.load("csrftoken")
                },
                body: JSON.stringify(mapCopy),
            })
            .then((response: any) => response.json().then((json: any) => ({
                response: response,
                json: json,
            }))
            .then(({ response, json }: any) => {
                if(response.status === 200) {
                    dispatch(receieveUpdatedMap(json))
                    
                    if(layerId === undefined) {
                        browserHistory.push("/map/" + json.id)
                    }
                    
                } else if(response.status === 400) {
                    // We expect that the server will return the shape:
                    // {
                    //   username: 'User does not exist',
                    //   password: 'Wrong password',
                    //   non_field_errors: 'Some sort of validation error not relevant to a specific field'
                    // }
                    throw new SubmissionError({...json, _error: json.non_field_errors || null})

                } else {
                    // We're not sure what happened, but handle it:
                    // our Error will get passed straight to `.catch()`
                    throw new Error('Unhandled error creating map. Please report. (' + response.status + ') ' + JSON.stringify(json));
                }
            })
            .catch((error: any) => {
                // if(error instanceof SubmissionError) {
                throw error;
                // } else {
                    // throw new SubmissionError({_error: error.message});
                // }
            })
    }
}

export function deleteMapLayer(map: object, layerId: number) {
    return (dispatch: any) => {
        let mapCopy: object = JSON.parse(JSON.stringify(map))
        if(mapCopy["json"]["layers"][layerId] !== undefined) {
            mapCopy["json"]["layers"].splice(layerId, 1);
        }

        fetch('/api/0.1/maps/' + mapCopy["id"] + "/", {
                method: "PUT",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookie.load("csrftoken")
                },
                body: JSON.stringify(mapCopy),
            })
            .then((response: any) => response.json().then((json: any) => ({
                response: response,
                json: json,
            }))
            .then(({ response, json }: any) => {
                // FIXME Cleanup and decide how to handle error at a component and application-level
                if(response.status === 200) {
                    dispatch(receiveDeleteMapLayer(map.id, layerId))
                    // browserHistory.push("/map/" + json.id)
                    
                } else if(response.status === 400) {
                    // We expect that the server will return the shape:
                    // {
                    //   username: 'User does not exist',
                    //   password: 'Wrong password',
                    //   non_field_errors: 'Some sort of validation error not relevant to a specific field'
                    // }
                    throw new SubmissionError({...json, _error: json.non_field_errors || null})

                } else {
                    // We're not sure what happened, but handle it:
                    // our Error will get passed straight to `.catch()`
                    throw new Error('Unhandled error creating map. Please report. (' + response.status + ') ' + JSON.stringify(json));
                }
            })
            .catch((error: any) => {
                // if(error instanceof SubmissionError) {
                throw error;
                // } else {
                    // throw new SubmissionError({_error: error.message});
                // }
            })
    }
}

export function fetchCompiledLayerStyle(l: Object) {
    return (dispatch: any) => {
        let do_fill = (l['fill']['expression'] != '')
        if(do_fill) {
            // Ugly as sin, but apparently fetch doesn't natively support attaching a params object?!
            // https://github.com/github/fetch/issues/256
            let url = new URL("https://localhost:8443/api/0.1/maps/compileStyle/"), params = {
                "opacity": fill.opacity,
                "scale_max": fill.scale_max,
                "scale_min": fill.scale_min,
                "expression": fill.expression,
                "scale_flip": fill.scale_flip,
                "scale_name": fill.scale_name,
                "scale_nlevels": fill.scale_nlevels,
            }
            Object.keys(params).forEach((key, value) => { url.searchParams.append(key, params[key]) })

            fetch(url, {
                credentials: "same-origin",
            })
                .then((response: any) => response.json())
                .then((json: any) => {
                    l.olStyleDef = json
                    return compileLayerStyle(l)
                })
                .then((json: any) => dispatch(receiveCompiledLayerStyle(json)))
        }
    }
}

export function fetchUserMapsDataAndColourInfo() {
    // https://github.com/reactjs/redux/issues/1676
    // Again, Redux Thunk will inject dispatch here.
    // It also injects a second argument called getState() that lets us read the current state.
    return (dispatch: any, getState: Function) => {
        // Remember I told you dispatch() can now handle thunks?
        return dispatch(fetchUser()).then(() => {
            // And we can dispatch() another thunk now!
            return dispatch(fetchMaps()).then(() => {
                return dispatch(fetchDataInfo()).then(() => {
                    return dispatch(fetchColourInfo()).then(() => {
                        dispatch(receiveAppLoaded())
                    })
                })
            })
        })
    }
}

export function fetchUser() {
    return (dispatch: any) => {
        dispatch(requestUser())
        return fetch('/api/0.1/self', {
            credentials: "same-origin",
        })
            .then((response: any) => response.json())
            .then((json: any) => dispatch(receiveUser(json)))
    }
}

export function fetchMaps() {
    return (dispatch: any) => {
        dispatch(requestMaps())
        return fetch('/api/0.1/maps/', {
            credentials: "same-origin",
        })
        .then((response: any) => response.json().then((json: any) => ({
            response: response,
            json: json,
        }))
        .then(({ response, json }: any) => {
            // FIXME Cleanup and decide how to handle error at a component and application-level
            if(response.status === 200) {
                // Map maps from an array of objects to a dict keyed by mapId
                const maps = Object.assign(...json.map(d => ({[d.id: d})))
                dispatch(receiveMaps(maps))
            }
            // throw new Error(`Error ${response.status}: Failed to retrieve maps.`)
            // return json
        })
        .catch((error: any) => {
            // if(error instanceof SubmissionError) {
            throw error;
            // } else {
                // throw new SubmissionError({_error: error.message});
            // }
        })
            // .then((response: any) => response.json())
            // .then((json: any) => dispatch(receiveMaps(json)))
    }
}

export function createMap(map: object) {
    return (dispatch: any) => {
        let mapCopy: object = JSON.parse(JSON.stringify(map))
        mapCopy["json"] = {
            // FIXME
            "map_defaults": {
                "lat": "-27.121915157767",
                "lon": "133.21253738715",
                "zoom": "4"
            }
        }

        return fetch('/api/0.1/maps/', {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookie.load("csrftoken")
                },
                body: JSON.stringify(mapCopy),
            })
            .then((response: any) => response.json().then((json: any) => ({
                response: response,
                json: json,
            }))
            .then(({ response, json }: any) => {
                // FIXME Cleanup and decide how to handle error at a component and application-level
                
                if(response.status === 201) {
                    dispatch(receiveCreatedMap(json))
                    browserHistory.push("/map/" + json.id)
                    
                } else if(response.status === 400) {
                    // We expect that the server will return the shape:
                    // {
                    //   username: 'User does not exist',
                    //   password: 'Wrong password',
                    //   non_field_errors: 'Some sort of validation error not relevant to a specific field'
                    // }
                    throw new SubmissionError({...json, _error: json.non_field_errors || null})

                } else {
                    // We're not sure what happened, but handle it:
                    // our Error will get passed straight to `.catch()`
                    throw new Error('Unhandled error creating map. Please report. (' + response.status + ') ' + JSON.stringify(json));
                }
            })
            .catch((error: any) => {
                if(error instanceof SubmissionError) {
                    throw error;
                } else {
                    throw new SubmissionError({_error: error.message});
                }
            })
    }
}

/*
So, there seems to be two approaches to handling the "How do I do some action on the site (like using React-Router to change pages)?" question.

1. Pass a callback function in and call that from the action.

2. Call react-router directly from the action.

Some further reading on the subject:

- https://github.com/reactjs/redux/issues/291
- http://stackoverflow.com/questions/36886506/redux-change-url-when-an-async-action-is-dispatched
*/
export function deleteMapSuccess(mapId: number) {
  return (dispatch: any) => {
    dispatch(receiveDeleteMap(mapId))
    browserHistory.push("/");
  };
}

export function deleteMap(mapId: number/*, cb: Function*/) {
    return (dispatch: any) => {
        return fetch('/api/0.1/maps/' + encodeURIComponent(mapId.toString()) + '/', {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": cookie.load("csrftoken")
            },
        })
            .then(((response: any) => {
                if(response.status == 204) {
                    dispatch(deleteMapSuccess(mapId))
                } else {
                    var error = new Error(response.statusText)
                    error.response = response
                    // dispatch(deleteMapError(error));
                    throw error
                }
            }))
            .catch(error => { console.log('request failed', error); }); // This could be handled at a higher level through a factory (as per early examples we investigated)
    }
}

export function fetchDataInfo() {
    return (dispatch: any) => {
        dispatch(requestDataInfo())
        return fetch('/api/0.1/datainfo/', {
            credentials: "same-origin",
        })
            .then((response: any) => response.json())
            .then((json: any) => {
                const ordered = {};
                Object.keys(json).sort().forEach(function(key) {
                    ordered[key] = json[key];
                });
                return ordered
            })
            .then((json: any) => dispatch(receiveDataInfo(json)))
    }
}

export function fetchColourInfo() {
    return (dispatch: any) => {
        dispatch(requestColourInfo())
        return fetch('/api/0.1/colours/', {
            credentials: "same-origin",
        })
            .then((response: any) => response.json())
            .then((json: any) => dispatch(receiveColourInfo(json)))
    }
}