'use babel';
export default class PathrView {
    constructor(serializedState) {
        this.element = document.createElement('div');
        this.element.classList.add('pather');
        const message = document.createElement('div');
        message.textContent = 'The Pather package is Alive! It\'s ALIVE!';
        message.classList.add('message');
        this.element.appendChild(message);
    }
    serialize() { }
    destroy() {
        this.element.remove();
    }
    getElement() {
        return this.element;
    }
}
