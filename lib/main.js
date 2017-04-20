'use babel';
import PathrView from './pathr-view';
import * as provider from './provider';
export default {
    pathrView: null,
    modalPanel: null,
    subscriptions: null,
    activate(state) {
        this.pathrView = new PathrView(state.pathrViewState);
    },
    deactivate() {
        this.pathrView.destroy();
    },
    serialize() {
        return {
            pathrViewState: this.pathrView.serialize(),
        };
    },
    provide() {
        return provider;
    },
};
