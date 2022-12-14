/**
 * Функция сортирует массив по алфавиту.
 * Перед сортировкой производится деструктуризация, чтобы отвязать
 * переменную от состояния компонента и сделать
 * итоговый массив нереактивным (но не его элементы).
 *
 * @param {array} arr – входной массив
 * @param {string} attrName – название атрибута элемента массива,
 *  значение которого необходимо сравнивать.
 *  Если не указан, то сравнение применяется для самого элемента.
 * @param {string} locale – локализация
 */
export const sortByAlphabet = (arr, attrName, locale = 'ru') => {
    arr = [...arr];

    return arr.sort((a, b) => {
        let x = attrName !== undefined ? getDotNotatedProp(a, attrName) : a;
        let y = attrName !== undefined ? getDotNotatedProp(b, attrName) : b;

        x = x ? String(x).toLowerCase() : '';
        y = y ? String(y).toLowerCase() : '';

        return x.localeCompare(y, locale, { ignorePunctuation: true });
    });
};

