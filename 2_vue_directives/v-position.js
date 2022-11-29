const positionHandler = (el, { value }) => {
    el.style.position = value || '';
};

/**
 * v-[absolute|fixed|relative]
 * Позиционирование
 *
 * v-position=[value]
 * Вариативное позиционирование
 * Создавалось вместе с тимлидом
 */
export default (Vue) => {
    ['absolute', 'fixed', 'relative', 'unset'].forEach((pos) => {
        const handler = (el, { value }) => {
            el.style.position = (value === undefined || !!value) ? pos : '';
        };
        Vue.directive(pos, {
            bind: handler,
            update: handler,
        });
    });

    Vue.directive('position', {
        bind: positionHandler,
        update: positionHandler,
    });
};
