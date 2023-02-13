function moveUpOneLine() {
    process.stdout.moveCursor(0, -1)
}

export function eraseLine() {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
}

export function eraseLastLine() {
    moveUpOneLine()
    eraseLine()
}