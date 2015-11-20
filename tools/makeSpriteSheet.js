function zeroPad(num, size) {
    return (num + 1e9 + '').substr(-size)
}

var fs = require('fs'),
    path = require('path'),
    spriteSheet = require('spritesheet-js'),

    Canvas = require('canvas'),
    Image = Canvas.Image,

    patPath = process.argv[2],
    resDir = process.argv[3],
    outPath = process.argv[4],

    patData = JSON.parse(fs.readFileSync(patPath)),
    outData = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath)) : { }

patData.anims.forEach((anim, animIndex) => {
    anim.files = { }

    anim.frames.forEach(frame => {
        frame.figs.forEach(fig => {
            var file = patData.files[fig.fileIndex]
            if (file.type === 'sprite' && file.w < 500) {
                file.isUsed = true
                file.realName = file.name.replace(/.bmp$/i, '.png')

                fig.spriteFile = file

                var m = /(.+)\d\d\d\d\./.exec(file.name)
                if (m) anim.files[ m[1] ] = true
            }
        })
    })

    var files = Object.keys(anim.files)
    anim.name = (files.length === 1 ? files[0] : 'anim') + '-' + animIndex
})

var files = patData.files
        .filter(file => file.isUsed)
        .map(file => path.join(resDir, file.realName))
spriteSheet(files, {
    trim: true,
    powerOfTwo: true,
    padding: 2,
    path: path.dirname(resDir),
    name: path.basename(resDir) + '.atlas'
}, function(err) {
    if (err) throw err
    var sheet = JSON.parse(fs.readFileSync(resDir + '.atlas.json'))

    var atlasData = {
        meta: sheet.meta,
        frames: [ ],
        anims: [ ],
    }

    outData.atlasUrl = resDir + '.atlas'
    outData.states = outData.states || { }
    outData.boxes = [ ]
    outData.anims = [ ]

    patData.anims.forEach((anim, animIndex) => {
        var animData = {
            name: anim.name,
            begin: atlasData.frames.length,
        }

        anim.frames.forEach((frame, frameIndex) => {
            var fig = frame.figs.filter(fig => fig.spriteFile)[0],
                file = fig && fig.spriteFile,
                sheetFrame = file && sheet.frames[file.realName]

            if (!sheetFrame) return

            outData.boxes.push(frame.boxes)

            atlasData.frames.push({
                filename: animData.name + zeroPad(frameIndex, 4),
                rotated: false,
                trimmed: true,
                frame: sheetFrame.frame,
                spriteSourceSize: {
                    x: file.l,
                    y: file.t,
                    w: file.w,
                    h: file.h,
                },
                sourceSize: {
                    w: (file.l + fig.x) * 2,
                    h: (file.t + fig.y) * 2,
                },
            })
        })

        if (atlasData.frames.length > animData.begin) {
            animData.end = atlasData.frames.length - 1
            animData.length = atlasData.frames.length - animData.begin
            outData.anims.push(animData)
        }
    })

    fs.writeFile(resDir + '.atlas.json', JSON.stringify(atlasData, null, 2))
    fs.writeFile(outPath, JSON.stringify(outData, null, 2))
})
