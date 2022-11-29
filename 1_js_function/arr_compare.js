/**
 * Сравнивает объекты по определенному ключу
 * @return {Boolean} — true если объекты одинаковы, false если есть различия
 */
export const compareObjectArraysByKey = (arrA, arrB, keyToCompare, keyToFind = 'id') => {
    let isDifferent = false;
    if (arrA.length !== arrB.length) return false;

    arrA.forEach((recordA) => {
        const recordB = (arrB.find((e) => e[keyToFind] === recordA[keyToFind]) || {});
        if (recordA[keyToCompare] !== recordB[keyToCompare]) {
            isDifferent = true;
        }
    });

    return !isDifferent;
};