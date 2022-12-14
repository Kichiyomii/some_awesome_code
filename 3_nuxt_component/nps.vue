<template>
  <div v-overflow="'hidden'">
    <AppealsPageComponent
      ref="appealsPageComponent"
      v-m-b:offset-md
      :state="['statGroups']"
      v-bind="$attrs"
      appeal-type="nps"
      @load-data="loadData"
      @changeFilters="changeFilters"
      @onScroll="loadMore"
      @handle-error="handleError"
    />

    <div class="card-chart">
      <StatBarStackCharts
        :is-loading="isLoadinglist.includes('data')"
        :chart="{
          titles: barChartTitles,
          data: barChartSeriesData,
        }"
        :computed-filters="computedFilters"
        @clickChart="changeFilters"
      />
    </div>

    <!-- <Delimiter
      v-m-x="-40"
      :margin="0"
    /> -->

    <div
      v-width="'100%'"
      v-m-t:offset-md
      v-m-b:offset-md
      v-d-flex="{align:'normal', justify: 'start'}"
    >
      <div v-width="'30%'" class="card">
        <div
          v-f-weight="'bold'"
          v-m-b="20"
          v-height="52"
          v-d-flex="{align:'center', justify: 'start'}"
        >
          Top 5 СМ с наименьшим NPS
        </div>

        <BarHorisontalChart
          v-height="320"
          v-width="'100%'"
          :is-loading="isLoadinglist.includes('worst')"
          :data-chart="npsWorstStoresChart"
          :tooltip="tooltipWorst"
          color-type="chartGradientColor"
          @fetchDetails="fetchNpsQuestionnairesByDivision($event, 'npsWorstStoresChart')"
        />
      </div>

      <div v-width="'40%'" class="card">
        <div
          v-width="'100%'"
          v-m-b="20"
          v-d-flex="{align:'center', justify: 'start'}"
        >
          <div v-f-weight="'bold'" v-m-r="15">
            NPS
          </div>
          <SelectField
            slot="type"
            v-model="segmentType"
            :options="optionsNpsDate"
          />
        </div>

        <LineChart
          v-height="320"
          :is-loading="isLoadinglist.includes('npsChart')"
          :data-chart="npsDataChart"
          :x-axis="npsDataChartXAxis"
        />
      </div>

      <div v-width="'30%'" class="card">
        <div
          v-f-weight="'bold'"
          v-m-b="20"
          v-height="52"
          v-d-flex="{align:'center', justify: 'start'}"
        >
          Причины негатива
        </div>
        <StatTopList
          v-if="!isLoadinglist.includes('reasons') && reasonsDissatisfaction"
          v-height="320"
          :top-list="reasonsDissatisfaction.reasons"
          @clickItem="fetchNpsQuestionnairesByCode"
        />
        <div
          v-else
          v-width="'100%'"
          v-height="'calc(100% - 71px)'"
          v-d-flex="{align:'center',justify:'center'}"
        >
          <Loading v-m-x="'auto'" />
        </div>
      </div>
    </div>

    <div
      v-if="!isLoadinglist.includes('questionnaires') || page !== 1"
      v-d-grid="{ columns: 3, gap: 17, align: 'flex-start' }"
    >
      <InfoDropdownCard
        v-for="card in npsQuestionnaires.content"
        :key="card.transaction_id"
        :info="card"
      />
    </div>
    <div
      v-if="isLoadinglist.includes('questionnaires') && page === 1"
      v-d-grid="{ columns: 3, gap: 17, align: 'flex-start' }"
    >
      <InfoDropdownCard
        v-for="index in 12"
        :key="index"
        :is-loading="true"
      />
    </div>
    <Loading
      v-if="isLoadinglist.includes('questionnaires') && page !== 1"
      v-m-x="'auto'"
      v-m-t="'20px'"
    />
  </div>
</template>
<router>{
  meta: {
    page: 'nps',
    exportName: 'nps',
    breadcrumbs:[
      { label: 'Отчеты', url: { name: 'reports' } },
      { label: 'Клиентский Сервис', url: {name: 'client-service'} },
    ]
  },
}</router>

<script>
import { mapState } from 'vuex';
import AppealsPageComponent from '@/components/AppealsPageComponent/AppealsPageComponent';
import StatBarStackCharts from '@/components/StatBarStackCharts/StatBarStackCharts';
import StatTopList from '@/components/StatTopList/StatTopList';
import BarHorisontalChart from '@/components/Charts/BarCharts/BarHorisontalChart';
import LineChart from '@/components/Charts/LineChart/LineChart';
import InfoDropdownCard from '@/components/Cards/InfoDropdownCard';
import fetchMixin from '@/mixins/fetchMixin';
import fetchDetailsMixin from '@/mixins/fetchDetailsMixin';

export default {
  meta: {
    theme: 'dark',
  },
  name: 'AppealsNps',
  components: {
    AppealsPageComponent,
    StatBarStackCharts,
    InfoDropdownCard,
    LineChart,
    StatTopList,
    BarHorisontalChart,
  },
  mixins: [fetchMixin, fetchDetailsMixin],
  data() {
    return {
      isDataLoading: false,
      page: 1,
      tierIndex: 0,
      segmentType: 'by_day',
      filterCharts: null,
      optionsNpsDate: [
        { key: 'by_day', label: 'по дням' },
        { key: 'by_week', label: 'по неделям' },
        { key: 'by_month', label: 'по месяцам' },
      ],

      cancelRequest: {},
      // isLoadinglist: [],
    };
  },
  computed: {
    ...mapState('reports/appeals', {
      stateFilters: (state) => state.filters,
    }),
    filters() {
      return this.$store.getters['reports/appeals/currentFilters'];
    },
    payload() {
      return [];
    },
    npsQuestionnaires() {
      return this.$store.state.reports.appeals.nps.questionnaires;
    },
    reasonsDissatisfaction() {
      return this.$store.state.reports.appeals.nps.reasonsDissatisfaction;
    },
    npsWorstStoresChart() {
      let data = [];

      if (this.$store.state.reports.appeals.nps.npsWorstStoresChart) {
        data = [...this.$store.state.reports.appeals.nps.npsWorstStoresChart?.pies];
      }

      const sortData = data.map((item) => ({
        values: [...item.values].sort((first, last) => {
          if (first.value > last.value) {
            return -1;
          }
          if (first.value < last.value) {
            return 1;
          }
          return 0;
        }),
      }));

      return {
        pies: sortData,
        labels: sortData.map((item) => item.values.map((value) => value.name))[0],
      };
    },
    computedFilters() {
      return this.stateFilters.filter((filter) => !(['theme_tag'].includes(filter.field)));
    },
    npsDataChart() {
      let data = [];

      if (this.$store.state.reports.appeals.nps.npsChart?.[this.segmentType]?.data) {
        data = [...this.$store.state.reports.appeals.nps.npsChart?.[this.segmentType]?.data];
      }
      return data.map((item) => ({ ...item, data: [...item.data || []].reverse() }));
    },
    npsDataChartXAxis() {
      return [...(this.$store.state.reports.appeals.nps
        .npsChart?.[this.segmentType]?.xAxis || [])].reverse();
    },
    appealData() {
      return this.$store.getters['reports/appeals/nps'];
    },
    barChartSeriesData() {
      if (this.barChartData.length === 0) return [];

      const seriesData = {
        summaries: [],
      };

      this.barChartData.forEach((obj) => {
        seriesData.summaries.push(obj.summary);

        Object.keys(obj.pies).forEach((tierKey) => {
          if (!Array.isArray(seriesData[tierKey])) {
            seriesData[tierKey] = [];
          }
          seriesData[tierKey].push({ ...obj.pies[tierKey], npsTier: tierKey });
        });
      });

      return seriesData;
    },
    barChartTitles() {
      if (this.barChartData.length === 0) return [];

      return this.barChartData.map((obj) => ({ value: obj.title, key: obj.filter_key }));
    },

    barChartData() {
      if (Array.isArray(this.appealData.table)) {
        const chartData = [...this.appealData.table];
        /**
         * Сортируем по результирующему nps от большего к меньшему,
         * с условием что общая статистика должна быть в начале
         */
        chartData.sort((prev, val) => {
          if (prev.title === 'Всего') return -1;
          if (val.title === 'Всего') return 1;
          return val.summary.value - prev.summary.value;
        });
        return chartData;
      }
      return [];
    },
    tooltipWorst() {
      return {
        appendToBody: true,
        transitionDuration: 0,
        formatter: (params) => `
              <div>
                <div>
                  <span style='font-weight: 600'>SAP: </span>
                  <span>${params.data.value[2]?.sap || 'Нет данных'}</span>
                </div>
                <div>${params.data.value[2]?.name || 'Нет данных'}</div>
                <div style='display: flex'>
                  <div style='margin-right: 20px'>
                    <div style='font-weight: 600'>NPS</div>
                    <div>${params.data.value[2]?.value}</div>
                  </div>
                  <div>
                    <div style='font-weight: 600'>В топе раз</div>
                    <div>${params.data.value[2]?.inTopCount}</div>
                  </div>
                </div>
                <div>
                  <div style='font-weight: 600'>Недели</div>
                  ${params.data.value[2]?.in_top_weeks ? `<div style='display: grid; grid-template-columns: repeat(3, 1fr);'>
                      ${params.data.value[2]?.in_top_weeks.reduce((prev, current) => `${prev} <div>${current}</div>`, '')}
                    </div>` : 'Нет данных'}
                </div>
              </div>
            `,

        borderColor: '#343c4a',
        backgroundColor: '#343c4a',
        textStyle: {
          color: '#fff',
        },

      };
    },
  },
  watch: {
    segment_type() {
      this.fetchDataNpsChart();
    },
  },
  methods: {
    loadMore() {
      if (this.npsQuestionnaires.has_more && !this.isLoadinglist.includes('questionnaires')) {
        this.page += 1;
        this.fetchNpsQuestionnaires();
      }
    },
    async changeFilters(params = null) {
      this.$notify.hideAll();
      this.tierIndex = 0;
      this.filterCharts = { ...this.filters };
      let newFilterValue = null;

      if (!params) {
        if (!this.isLoadinglist.includes('data')) this.isLoadinglist.push('data');
        // this.isDataLoading = true;
      }

      if (params && params.componentType === 'xAxis') {
        const valueAxis = params.value.split(',');
        newFilterValue = valueAxis[0] === 'Общая статистика' ? null : valueAxis[valueAxis.length - 1];
      } else if (params && params.componentType === 'series') {
        const nameAxis = params.name.split(',');
        this.tierIndex = Object.keys(this.barChartData[0]?.pies).length - params?.seriesIndex;
        newFilterValue = nameAxis[0] === 'Общая статистика' ? null : nameAxis[nameAxis.length - 1];
      }

      if (params) {
        let valueSetted = false;
        Object.entries(this.filters).forEach(([key, value]) => {
          if (!value && !valueSetted) {
            valueSetted = true;
            this.filterCharts[key] = newFilterValue;
          }
        });
      }

      this.page = 1;
      // const notificationID = this.$notify.push('Загрузка данных анкет...');
      if (!params) {
        this.fetchWorstStores();
        this.fetchReasonsDissatisfaction();
        this.fetchDataNpsChart();
      }
      await this.fetchNpsQuestionnaires();
      // this.$notify.hideById(notificationID);
    },
    async fetchNpsQuestionnaires(params) {
      this.$notify.hideById(this.notifyId);
      this.notifyId = this.$notify.push('Загрузка детальной информации...', { duration: 40000 });
      await this.fetchData('questionnaires', 'reports/appeals/nps/getNpsQuestionnaires', {
        nps_tier: this.tierIndex === 0 ? null : `tier${this.tierIndex}`,
        page: this.page,
        appealType: 'nps',
        ...this.filters,
        ...this.filterCharts,
        ...params,
      });
      this.$notify.hideById(this.notifyId);
    },
    async fetchNpsQuestionnairesByDivision(data, chartName = null) {
      this.page = 1;
      const store = this[`${chartName}`].pies[0].values[data].sap;
      this.fetchNpsQuestionnaires({ store_id: store });
    },
    async fetchNpsQuestionnairesByCode(params) {
      this.page = 1;
      this.fetchNpsQuestionnaires({ nps_category: params.code });
    },
    async fetchDataNpsChart() {
      this.fetchData('npsChart', 'reports/appeals/nps/getNpsChart');
    },
    async fetchReasonsDissatisfaction() {
      this.fetchData('reasons', 'reports/appeals/nps/getReasonsDissatisfaction');
    },
    loadData(dateUpdated) {
      this.isLoadinglist.splice(this.isLoadinglist.indexOf('data'), 1);
      // this.isDataLoading = false;
      this.$emit('load-data', dateUpdated);
    },
    async fetchWorstStores() {
      this.fetchData('worst', 'reports/appeals/nps/getWorstStores');
    },

    // async fetchData(nameBlock, path, requestParams) {
    //   if (!this.isLoadinglist.includes(nameBlock)) {
    //     this.isLoadinglist.push(nameBlock);
    //   }
    //   if (this.cancelRequest[nameBlock]) {
    //     this.cancelRequest[nameBlock]();
    //   }

    //   const { status } = await this.$store.dispatch(path, {
    //     ...this.filters,
    //     ...requestParams,
    //     cancelToken: new axios.CancelToken((cancelCallback) => {
    //       this.cancelRequest[nameBlock] = cancelCallback;
    //     }),
    //   });
    //   if (!status) return;
    //   this.cancelRequest[nameBlock] = null;
    //   if (status) {
    //     this.isLoadinglist.splice(this.isLoadinglist.indexOf(nameBlock), 1);
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped>
.card {
  padding: 22px 25px;
  border: 1px solid #EDEDED;
  border-radius: 8px;
  background: white;

  &:not(:last-child) {
    margin-right: 30px;
  }
}

.card-chart {
  padding: 24px 32px;
  border: 1px solid #EDEDED;
  border-radius: 8px;
  background: white;
}
</style>
