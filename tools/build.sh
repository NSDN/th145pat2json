# build typings
tsd install

# build typescript
tsc

# update sprites (may take some time)
for char in `cat res/characters.txt`; do
    node tools/parseActorPat.js res/$char/$char.pat res/$char.pat.json && \
        node tools/makeSpriteSheet.js res/$char.pat.json res/$char res/$char.json
done
