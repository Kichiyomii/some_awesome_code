/**
 * v-text[align, decoration, transform]
 * Редактирование текста с помощью директивы
 */

const getTextHandler = (attribute) => (el, { arg, value }) => {
    el.style[`text${attribute}`] = arg || value || '';
};

export default (Vue) => {
    ['align', 'decoration', 'transform'].forEach((item) => {
        Vue.directive(`text-${item}`, {
            bind: getTextHandler(item),
            update: getTextHandler(item),
        });
    });
};