import throttle from 'lodash.throttle';
export default function debounced(store, cooldown = 100) {
    return {
        subscribe: store.subscribe,
        set: throttle(store.set, cooldown),
        update: throttle(store.update, cooldown)
    };
}
