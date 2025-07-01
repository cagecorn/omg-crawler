export class Draggable {
    constructor(elementToDrag, handleElement) {
        this.elementToDrag = elementToDrag;
        this.handleElement = handleElement || elementToDrag;
        this.isDragging = false;
        this.initialX = 0;
        this.initialY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this.handleElement.addEventListener('mousedown', this._onMouseDown);
    }

    onMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.initialX = e.clientX;
        this.initialY = e.clientY;
        this.offsetX = this.elementToDrag.offsetLeft;
        this.offsetY = this.elementToDrag.offsetTop;
        this.bringToFront();
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        this.handleElement.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.initialX;
        const dy = e.clientY - this.initialY;
        this.elementToDrag.style.left = `${this.offsetX + dx}px`;
        this.elementToDrag.style.top = `${this.offsetY + dy}px`;
    }

    onMouseUp() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        this.handleElement.style.cursor = 'grab';
    }

    bringToFront() {
        document.querySelectorAll('.draggable-window').forEach(win => {
            win.style.zIndex = 100;
        });
        this.elementToDrag.style.zIndex = 101;
    }
}
