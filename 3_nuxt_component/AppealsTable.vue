<template>
  <div>
    <div
      v-if="isDataLoading"
      v-height="150"
      v-width="'100%'"
      v-d-flex="{align:'center',justify:'center'}"
    >
      <Loading />
    </div>

    <div
      v-else-if="!records.length"
      v-height="150"
      v-width="'100%'"
      v-d-flex="{align:'center',justify:'center'}"
    >
      <Empty>
        Нет данных по выбранным фильтрам
      </Empty>
    </div>

    <Table
      v-else
      :columns="columns"
      :data="[{ records }]"
      head-color="black"
      is-responsive
      disable-highlight
      is-drag-scrollable
      :draggable-elements="['td','tr']"
      :sticky-sides="stickySides"
      :state="state"
      :get-column-style="getColumnStyle"
      :get-header-text-align="setHeaderTextAlign"
      :is-server-sorting="true"
      :is-paint-even="false"
      :get-rowspan="getRowspan"
      :get-colspan="getColspan"
      :get-show-td="getShowTd"
      :get-th-style="getThStyle"
      :get-td-style="getTdStyle"
      :is-some-rows-head="isSomeRowsHead"
      @toggle-sorting="toggleSorting"
    >
      <div
        slot="index"
        slot-scope="{ row: { index }}"
        v-text="index + 1"
      />

      <template v-if="!isSortble">
        <div
          v-for="{key,label} in attributes"
          :slot="`c-${key}`"
          :key="key"
          v-text="label"
        />
      </template>

      <div
        slot="percent"
        slot-scope="{ row: { raw: {percent: {value: percent} }}}"
        v-text="`${percent}%`"
      />

      <div
        slot="title"
        slot-scope="{ row, row: { raw: {
          id: { value: id },
          depthLevel: { value: depthLevel },
          title: { value: title },
          key,
          isOpen,
          field,
          bold,
          icon,
          children,
          has_child,
          isLoading,
        }}}"
        v-p-l="depthLevel * 16 + 30"
        v-c="`rgba(0,0,0,${1 - depthLevel * 0.25})`"
        v-cursor="children && children.value && children.value.length > 0
          || has_child && has_child.value ? 'pointer' : 'auto'"
        v-bg="getRowBgColor(null, null, {title: { value: title }})"
        class="title-cell"
        data-dragscroll

        @click="toggleGroup(id, {title, index: row.index, field, key, depthLevel})"
      >
        <Icon
          v-if="icon"
          v-m-r="6"
          :type="icon.value"
        />

        <div
          :style="{
            whiteSpace: 'nowrap',
            maxWidth: `${320 - depthLevel * 16}px`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: bold && bold.value ? 600 : 500,
          }"
          v-text="title"
        />
        <Loading
          v-if="isLoading && isLoading.value"
          v-m-l="8"
          :image-width="22"
          :image-height="22"
        />

        <Icon
          v-else-if="children && children.value && children.value.length > 0 ||
            has_child && has_child.value"
          v-m-t="2"
          v-m-l="8"
          v-m-r="12"
          :type="isOpen && isOpen.value ? 'chevron-up' : 'chevron-down'"
          size="xs"
          style="color: #AEAEAE;"
        />
      </div>

      <div
        v-for="{key} in computedListTd"
        :key="key"
        :slot="key"
        slot-scope="{row: {raw}, row: { raw: {
          values: {value: values},
        }}}"
        v-height="'100%'"
        data-dragscroll
        :set="value = (values.find(e => e.column_title === key) || {})"
        @click="tdClicked(key, raw)"
      >
        <template v-if="value.isLoading">
          <div v-height="'100%'" v-bg="getRowBgColor(values, value, raw)">
            <Loading
              v-height="'100%'"
              image-height="20px"
              image-width="20px"
            />
          </div>
        </template>
        <template
          v-else-if="![null, undefined].includes(value.value)"
        >
          <div
            v-cursor="!getCellDisabledClick(value.column_title) ? 'pointer' : ''"
            v-align="{items: 'baseline'}"
            v-bg="getRowBgColor(values, value, raw)"
            v-tooltip="key === '@all' ? getTextTooltip(raw.title.value) : null"
            class="highlight-on-hover value-cell"
            :class="{
              'highlight-on-select':
                (values.find(e =>e.column_title === key) || {}).isHighLighted
            }"
          >
            <span
              v-width="value.delta && calculationMode === 'absolute' ? '50%' : '100%'"
              v-text-align="value.delta && calculationMode === 'absolute' ? 'right' : 'center'"
              v-text="getFormatedValueWithRoundedDecimals(value, 2)"
            />
            <span
              v-if="value.delta && calculationMode === 'absolute'"
              v-width="'50%'"
              v-c="value.arrow_color === 'red' ? colors.red : colors.green"
              v-f-size="12"
              v-m-l="4"
              v-text-align:left
              v-text="`${value.arrow} ${value.delta}`"
            />
          </div>
        </template>

        <div
          v-else
          v-bg="getRowBgColor(values, value, raw)"
          class="value-cell"
        >
          <Empty>
            —
          </Empty>
        </div>
      </div>
    </Table>
  </div>
</template>

<script>
import { raiseChildrenRecursively } from '@darkfighter/fabrique-core/utils/helpers/arrayHelpers';
import { isFloat } from '@darkfighter/fabrique-core/utils/helpers/numberHelpers';
import { getValueInFormat } from '@darkfighter/fabrique-core/utils/helpers/objectHelpers';
import { mapState } from 'vuex';
import chroma from 'chroma-js';
import { deltaColorMinus, deltaColorPlus } from '@/helpers/colors';

export default {
  props: {
    data: { type: Array, default: () => [] },
    attributes: { type: Array, default: () => [] },
    filters: { type: Array, default: () => [] },
    isDataLoading: Boolean,
    isRudeness: Boolean,
    isSortble: { type: Boolean, default: false },
    calculationMode: String,
    stickySides: { type: Object, default: () => ({ left: 1 }) },
    state: { type: Array, default: () => ['fullwidth', 'condensed'] },
    titleTable: { type: String, default: 'Категория' },
    disableRowSort: { type: String, default: null },
    columnDisabledClick: { type: Array, default: () => [] },
    getThStyle: { type: [Function, null], default: null },
    isSomeRowsHead: { type: Boolean, default: false },
    getTdStyle: { type: [Function, null], default: null },
  },
  data: () => ({
    activeAccidentsList: null,
    rudenessRecords: [],
    colors: {
      red: deltaColorMinus,
      green: deltaColorPlus,
    },
    sortableColumn: null,
  }),
  computed: {
    ...mapState('reports/appeals', {
      filterPriorityList: (state) => state.filterPriorityList,
    }),
    columns() {
      if (this.isSomeRowsHead) {
        return this.attributes.map((item, index) => {
          if (index === 0) {
            return [
              { field: 'title', label: this.isRudeness ? 'Дивизион' : this.titleTable },
              ...item.map((element) => ({
                ...element,
                field: element.key,
                childrens: element.childrens,
                allowSorting: this.isSortble,
              })),
            ];
          }
          return [...item.map((element) => ({
            ...element,
            field: element.key,
            childrens: element.childrens,
            allowSorting: this.isSortble,
          }))];
        });
      }
      return [
        { field: 'title', label: this.isRudeness ? 'Дивизион' : this.titleTable },
        ...this.attributes.map((item) => ({
          field: item.key,
          label: item.label,
          colspan: item.colspan,
          childrens: item.childrens,
          allowSorting: this.isSortble,
        })),
      ];
    },

    records() {
      const sortArray = (array) => {
        const arr = array.map((item) => ({ ...item }));
        arr.sort((a, b) => {
          const index = a.values
            .findIndex((value) => value.column_title === this.sortableColumn?.field);
          return a.values[index].value - b.values[index].value;
        });
        arr.forEach((a) => {
          if (a.children && a.children.length > 0) a.children = sortArray(a.children);
        });
        if (this.sortableColumn?.desc) arr.reverse();
        arr.push(arr.splice(arr.findIndex((item) => item.title === this.disableRowSort), 1)[0]);

        return arr;
      };

      if (this.isSortble && this.sortableColumn) {
        const sortData = raiseChildrenRecursively(JSON.parse(JSON.stringify(sortArray(this.data))), 'children', 0, null, 'isOpen');
        return sortData;
      }
      return raiseChildrenRecursively(JSON.parse(JSON.stringify(this.data)), 'children', 0, null, 'isOpen');
    },

    selectedDataSet() {
      let result = 'territoria';
      this.filters.forEach((filter, index) => {
        if (filter.value) {
          result = (this.filterPriorityList[index + 1] === 'theme_tag'
            ? false : this.filterPriorityList[index + 1]) || filter.field;
        }
      });
      return result;
    },
    computedListTd() {
      if (!this.isSomeRowsHead) {
        return this.attributes;
      }
      const list = this.columns.reduce((prev, current) => {
        current.forEach((item, index) => {
          if (!item.parent) {
            prev.splice(item.colPosition || index, 0, item);
          }
        });
        return prev;
      }, []);
      return list;
    },
  },
  created() {
    this.$on('subtable-loaded', this.openSubTable);
  },
  beforeDestroy() {
    this.$off('subtable-loaded', this.openSubTable);
  },
  methods: {
    getRowBgColor(values, value, raw) {
      let result = 'transparent';

      if (this.calculationMode === 'relative' && ![null, undefined].includes(value?.value)) {
        const vals = values.map((obj) => obj.value);
        const extremums = vals.reduce((acc, val) => {
          if (val === null) return acc;
          acc.min = val < acc.min ? val : acc.min;
          acc.max = val > acc.max ? val : acc.max;
          return acc;
        }, {
          min: vals[0], max: vals[0],
        });
        let opacity = 1;
        if (extremums.min !== extremums.max) {
          opacity = (value.value - extremums.min) / (extremums.max - extremums.min);
        }

        const colors = {
          toGreen: this.getCellColor(['#F78998', 'F5EAE3', '#95D5BC'], opacity),
          toRed: this.getCellColor(['#95D5BC', 'F5EAE3', '#F78998'], opacity),
        };

        const color = raw.id.value.match('Благодарность')
          ? colors.toGreen : colors.toRed;

        result = color;
      } else if (raw.title.value === 'Всего жалоб'
                || raw.title.value === 'Среднее количество жалоб'
                || raw.title.value === 'Жалоб на магазин'
                || raw.title.value === 'Среднее количество жалоб на магазин'
                || raw.title.value === 'Итог') {
        result = '#f1f1f1';
      }
      return result;
    },

    tdClicked(colTitle, raw) {
      if (this.isRudeness) {
        this.$emit('tdclick', { [raw.field.value]: raw.key.value, period_relative_offset: colTitle }, { col: colTitle, row: raw });
        return;
      }

      if (!this.getCellDisabledClick(colTitle)) {
        this.$emit('tdclick', this.getPayload(colTitle, raw), { col: colTitle, row: raw });
      }
    },

    getPayload(colTitle, raw) {
      const { selectedDataSet } = this;
      const payload = { [selectedDataSet]: colTitle };
      const categories = [raw.title.value, ...this.getParentTitles(raw.parentTitle.value)];

      categories.reverse().forEach((category, i) => { payload[`category_${i + 1}_nm`] = category; });

      return payload;
    },

    getParentTitles(parentTitle) {
      const result = [];
      const searchParents = (title) => {
        const search = this.records.find((rec) => rec.title === title);
        if (search) {
          result.push(title);
          searchParents(search.parentTitle);
        }
      };
      searchParents(parentTitle);
      return result;
    },

    setHeaderTextAlign(index, rowIndex = 0) {
      return index > 0 || rowIndex > 0 ? 'center' : 'normal';
    },

    getColumnStyle(index, raw, field) {
      let result = {
        'background-color': this.sortableColumn?.field === field ? '#f5f5f5' : '',
        border: 'none',
        whiteSpace: index > 0 ? 'nowrap' : null,
        textAlign: index > 0 ? 'center' : null,
      };
      if (field === 'title') {
        result = {
          ...result,
          width: '320px',
          minWidth: '320px',
          zIndex: 4,
        };
      } else {
        result = { ...result, minWidth: '100px', textAlign: 'center' };
      }
      return result;
    },

    async toggleGroup(id, payload) {
      const row = this.findRowById(id);
      // eslint-disable-next-line no-prototype-builtins
      if (this.isRudeness && !row.isOpen && row.has_child && !row.hasOwnProperty('children')) {
        this.$set(row, 'isLoading', true);
        this.$emit('fetch-sub-table', { id, ...payload });
        return;
      }
      this.$set(row, 'isOpen', !row.isOpen);
    },
    async openSubTable({ id }) {
      await this.$nextTick;
      const row = this.findRowById(id);

      this.$set(row, 'isOpen', !row.isOpen);
      this.$set(row, 'isLoading', false);
      this.$forceUpdate();
    },
    findRowById(id) {
      let result;

      const searchRecursively = (items) => {
        items.forEach((item) => {
          if (item.id === id) {
            result = item;
            return;
          }
          if (item.children) {
            searchRecursively(item.children);
          }
        });
      };

      searchRecursively(this.data);

      return result;
    },
    getFormatedValueWithRoundedDecimals(valueObj, decimals) {
      const newValue = this.isFloat(valueObj.value)
        ? valueObj.value.toFixed(decimals)
        : valueObj.value;
      return getValueInFormat({ ...valueObj, value: newValue });
    },
    getCellColor(scale, point) {
      return chroma(chroma.scale(scale)(point));
    },
    getValueInFormat,
    isFloat,
    getTextTooltip(raw) {
      switch (raw) {
        case 'Всего жалоб':
          return 'Сумма жалоб по столбцу (в категории 1 жалоба клиента + жалоба на качество продовольственных товаров)';

        case 'Среднее количество жалоб':
          return 'На основании последних 90 дней';

        case 'Жалоб на магазин':
          return 'Сумма жалоб по столбцу / количество магазинов в столбце (дивизионе или регионе)';

        case 'Среднее количество жалоб на магазин':
          return 'Среднее количество жалоб / количество магазинов в столбце (дивизионе или регионе)';

        default:
          return '';
      }
    },
    toggleSorting(col) {
      this.sortableColumn = col;
    },
    getRowspan(raw, field) {
      return field === 'title' ? raw.cellOptions?.value?.rowspan : 1;
    },
    getColspan(col) {
      return col.colspan || 1;
    },
    getShowTd(raw, field) {
      return field === 'title' ? !((raw.cellOptions || {}).value || {}).hide : true;
    },
    getCellDisabledClick(name) {
      return this.columnDisabledClick.includes(name);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@darkfighter/fabrique-core/assets/variables.scss";
.title-cell{
  padding: 10px 10px 10px 0;
  display: flex;
}
.value-cell{
  margin: -4px -10px;
  padding: 10px;
  display: flex;
  justify-content: center;
}
.highlight-on-hover:hover{
 box-shadow: inset -2px -2px 0 rgb(187, 187, 187),
           inset 2px 2px 0 rgb(187, 187, 187) !important
}

::v-deep td {
  height: 39px !important;
}

::v-deep .title-cell, .value-cell {
  width: 100%;
  margin: 0;
  font-size: 14px;
}
</style>
