function array(len, fn) {
    var ret = [ ]
    for (var i = 0; i < len; i ++)
        ret.push(fn())
    return ret
}

Buffer.TYPES = {
    Char: ['UInt8', 1],
    UShort: ['UInt16LE', 2],
    UInt: ['UInt32LE', 4],
    Short: ['Int16LE', 2],
    Int: ['Int32LE', 4],
}

Buffer.prototype.step = function(type, count) {
    if (count >= 0)
        return array(count, this.step.bind(this, type))

    var typ = Buffer.TYPES[type],
        name = typ[0],
        size = typ[1],
        offset = this.currentOffset || 0,
        result = buf['read' + name](offset)
    this.currentOffset = offset + size
    return result
}

Buffer.prototype.stepString = function(length) {
    var begin = this.currentOffset
    this.stepChar(length)
    return this.toString('utf8', begin, this.currentOffset)
}

Object.keys(Buffer.TYPES).forEach(function(name) {
    Buffer.prototype['step' + name] = function(count) {
        return this.step(name, count)
    }
})

function parsePat(buf) {
    buf.stepFileName = function() {
        var type = buf.stepChar()
        if (type === 0) {
            return {
                type: 'effect',
                name: buf.stepString(buf.stepInt())
            }
        }
        else if (type === 2) {
            var type = buf.stepString(4) // usually 'TFBM'

            // have no idea what these bytes are
            buf.stepShort(1)
            buf.stepInt(3)

            buf.stepChar(buf.stepInt())

            return {
                type: type,
            }
        }
        else if (type === 4) {
            return {
                type: 'sprite',
                name: buf.stepString(buf.stepInt()),
                l: buf.stepInt(),
                t: buf.stepInt(),
                w: buf.stepInt(),
                h: buf.stepInt(),
            }
        }
        else {
            throw 'unexpected byte'
        }
    }

    buf.stepBox = function() {
        return {
            l: buf.stepInt(),
            t: buf.stepInt(),
            r: buf.stepInt(),
            b: buf.stepInt(),
            a: buf.stepShort(),
        }
    }

    buf.stepPos = function() {
        return [
            buf.stepInt(),
            buf.stepInt()
        ]
    }

    buf.stepFig = function() {
        var fig = { }
        fig.fileIndex = buf.stepInt()

        var type1 = buf.stepChar()
        if (type1 === 0) {
            fig.flag = buf.stepInt()
            fig.w = buf.stepShort()
            fig.h = buf.stepShort()
            fig.x = buf.stepShort()
            fig.y = buf.stepShort()
        }
        else if (type1 === 3) {
            fig.flag1 = buf.stepInt()
            fig.w = buf.stepShort()
            fig.h = buf.stepShort()
            fig.flag2 = buf.stepInt()
            fig.x = buf.stepShort()
            fig.y = buf.stepShort()
        }
        // TODO: find out what these bytes are
        else if (type1 === 1)
            buf.stepChar(18)
        else if (type1 === 2)
            buf.stepChar(20)
        else
            throw 'invalid fig type1 ' + type1

        var type2 = buf.stepChar()
        if (type2 === 0)
            buf.stepChar(2)
        else if (type2 === 1)
            buf.stepChar(2)
        else if (type2 === 2)
            buf.stepChar(18)
        else
            throw 'invalid fig type2 ' + type2

        return fig
    }

    buf.stepFrame = function() {
        buf.currentFrameAddr = buf.currentOffset

        var frame = {
            a: buf.currentOffset.toString(16),
            s1: buf.stepShort(),
        }

        // usually 0, 1 or 2
        buf.stepChar(buf.stepChar())

        // figures
        frame.figs = array(buf.stepChar(), function() {
            return buf.stepFig()
        })

        // unknown chunk, usually all zeros
        buf.stepChar(56)

        // total box length
        buf.stepChar()
        //
        frame.boxes = array(3, function(i) {
            return array(buf.stepChar(), function() {
                return buf.stepBox()
            })
        })

        // no sure
        frame.pos = array(buf.stepChar(), function() {
            return buf.stepPos()
        })

        return frame
    }

    buf.stepAnim = function() {
        buf.currentAnimAddr = buf.currentOffset

        var anim = {
            a: buf.currentOffset.toString(16),
            c1: buf.stepChar(),
            i1: buf.stepInt(),
            s1: buf.stepShort(),
            s2: buf.stepShort(),
            c2: buf.stepChar(),
            c3: buf.stepChar(),
        }

        if (anim.i1 === -1) {
            buf.stepShort()

            // just ignore it
            anim.frames = [ ]
        }
        else {
            // unknown chunk
            if (anim.c1 === 1)
                buf.stepChar(66)

            anim.frames = array(buf.stepInt(), function() {
                return buf.stepFrame()
            })
        }

        return anim
    }

    buf.currentAnimAddr = buf.currentFrameAddr = 0

    // check the beginning bytes
    if (buf.stepShort() !== 0x0410)
        throw 'seems not a th14 pat file'

    buf.stepChar(20)

    // start parsing
    var parsed = { }

    parsed.files = array(buf.stepShort(), function() {
        return buf.stepFileName()
    })

    parsed.bmbs = array(buf.stepShort(), function() {
        var s = buf.stepString(0x80)
        for (var j = 0; s[j] && s[j] !== '\0'; j ++);
        return s.substr(0, j)
    })

    parsed.anims = array(buf.stepInt(), function() {
        return buf.stepAnim()
    })

    return parsed
}

try {
    var fs = require('fs'),

        patFile = process.argv[2],
        outFile = process.argv[3],

        buf = fs.readFileSync(patFile),
        data = parsePat(buf)

    fs.writeFile(outFile, JSON.stringify(data, null, 2))
}
catch (e) {
    throw e
    console.error('Error: died at ' + buf.currentOffset.toString(16) +
        ' (frame' + buf.currentFrameAddr.toString(16) + ', anim' + buf.currentAnimAddr.toString(16) + ')')
}
