module MyGame.Utils {

    export function id(x: any): any {
        return x
    }

    var uidCounter = 0
    export function uid(): number {
        return uidCounter ++
    }

    export function debounced(callback: Function, interval: number, data = null): Function {
        var timeout = 0
    	return () => {
    		if (timeout)
    			clearTimeout(timeout)
    		timeout = setTimeout(() => {
    			callback.call(this, data)
    			timeout = 0
    		}, interval)
    	}
    }

    export function keach(object: any, callback: Function) {
        object && Object.keys(object).forEach(key => callback(key, object[key]))
    }

    export function kmap(object: any, callback: Function): any {
        var dict = { }
        keach(object, (k, v) => dict[k] = callback(k, v))
        return dict
    }

    function getRange(n: number | number[]): number[] {
        return typeof n === 'number' ? [0, 1, n] : [0, 0, 0].concat(n).slice(-3)
    }
    export function range(n: number | number[], func: Function = id): any[] {
        var [start, step, end] = getRange(n),
            results = [ ]
        for (var i = start; i < end; i += step)
            results.push(func(i))
        return results
    }

    export function padzero(num: number, length: number) {
        var chars = num.toString()
        while (chars.length < length)
            chars = '0' + chars
        return chars
    }

}
