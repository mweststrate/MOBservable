import {
    $mobx,
    asObservableObject,
    AnnotationsMap,
    endBatch,
    startBatch,
    CreateObservableOptions,
    ObservableObjectAdministration,
    collectStoredAnnotations,
    isPlainObject,
    isObservableObject,
    die,
    ownKeys,
    inferredAnnotationsSymbol,
    extendObservable,
    addHiddenProp
} from "../internal"

// Hack based on https://github.com/Microsoft/TypeScript/issues/14829#issuecomment-322267089
// We need this, because otherwise, AdditionalKeys is going to be inferred to be any
// set of superfluous keys. But, we rather want to get a compile error unless AdditionalKeys is
// _explicity_ passed as generic argument
// Fixes: https://github.com/mobxjs/mobx/issues/2325#issuecomment-691070022
type NoInfer<T> = [T][T extends any ? 0 : never]

export function makeObservable<T extends object, AdditionalKeys extends PropertyKey = never>(
    target: T,
    annotations?: AnnotationsMap<T, NoInfer<AdditionalKeys>>,
    options?: CreateObservableOptions
): T {
    const adm: ObservableObjectAdministration = asObservableObject(target, options)[$mobx]
    startBatch()
    try {
        // Default to decorators
        annotations ??= collectStoredAnnotations(target)

        // Annotate
        ownKeys(annotations).forEach(key => adm.make_(key, annotations![key]))
    } finally {
        endBatch()
    }
    return target
}

// TODO warn if there is an override for non-existent key
export function makeAutoObservable<T extends object, AdditionalKeys extends PropertyKey = never>(
    target: T,
    overrides?: AnnotationsMap<T, NoInfer<AdditionalKeys>>,
    options?: CreateObservableOptions
): T {
    if (__DEV__) {
        if (!isPlainObject(target) && !isPlainObject(Object.getPrototypeOf(target)))
            die(`'makeAutoObservable' can only be used for classes that don't have a superclass`)
        if (isObservableObject(target))
            die(`makeAutoObservable can only be used on objects not already made observable`)
    }

    // Optimization (avoids visiting protos)
    // assumes that annotation.make_/.extend_ works the same for plain objects
    if (isPlainObject(target)) {
        return extendObservable(target, target, overrides, options)
    }

    const adm: ObservableObjectAdministration = asObservableObject(target, options)[$mobx]
    startBatch()
    try {
        // Following is possible because makeAutoObservable
        // can be called only once per object and allows max 1 prototype
        if (target[inferredAnnotationsSymbol]) {
            target[inferredAnnotationsSymbol].forEach(key =>
                adm.make_(
                    key,
                    // must pass "undefined" for { key: undefined }
                    !overrides ? true : key in overrides ? overrides[key] : true
                )
            )
        } else {
            // prepare cache
            const proto = Object.getPrototypeOf(target)
            addHiddenProp(proto, inferredAnnotationsSymbol, [])

            const ignoreKeys = { [$mobx]: 1, [inferredAnnotationsSymbol]: 1, constructor: 1 }
            const make = key => {
                // ignore
                if (ignoreKeys[key]) return
                ignoreKeys[key] = 1
                // cache
                proto[inferredAnnotationsSymbol].push(key)
                // make
                adm.make_(
                    key,
                    // must pass "undefined" for { key: undefined }
                    !overrides ? true : key in overrides ? overrides[key] : true
                )
            }
            ownKeys(target).forEach(make)
            ownKeys(proto).forEach(make)
        }
    } finally {
        endBatch()
    }
    return target
}
