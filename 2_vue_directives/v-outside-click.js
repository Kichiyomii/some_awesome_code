export default (Vue) => {
  Vue.directive('outside-click', {
    bind(el, { value, arg }) {
      const save = [
        // Все datepicker
        (e) => Array.from(e.classList).reduce((prev, val) => prev || val.match(/^(dp-)+/), false),
        // Все sweetAlert
        (e) => Array.from(e.classList).reduce((prev, val) => prev || val.match(/^(swal2-)+/), false),
        // Для SelectionPopup
        (e) => !!e.closest('.billet'),
        (e) => e.tagName.toLowerCase() === 'input' && e.type.toLowerCase() === 'file',
        // Для PictureViewer
        (e) => !!e.closest('.picture-viewing'),
        // Для DateRange.new
        (e) => !!e.closest('.ant-calendar-picker-container'),
        ...['header', 'body'].map((part) => ['month', 'decade', 'year'].map((section) => (e) => !!e.closest(`.ant-calendar-${section}-panel-${part}`))).flat(),
      ];

      // eslint-disable-next-line no-underscore-dangle
      el.__outside_click = ({ target }) => {
        if (
          target === el
          || el.contains(target)
          || save.reduce(
            (previous, e) => previous || (
              e && (typeof e === 'function' ? e(target) : (target === e || e.contains(target)))
            ),
            false,
          )
        ) {
          return;
        }

        value();
      };
      // eslint-disable-next-line no-underscore-dangle
      document.addEventListener(arg || 'click', el.__outside_click);
    },

    unbind(el, { arg }) {
      // eslint-disable-next-line no-underscore-dangle
      document.removeEventListener(arg || 'click', el.__outside_click);
    },
  });
};
