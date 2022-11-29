<template>
  <div
    :id="'check'+check?.receipt_id"
    :class="['check',
             {'shadow-light' : extraInfoCard}
    ]"
  >
    <div class="check__content" @click="openCheckModal(width)">
      <CheckModal
        v-if="checkedModal"
        :checked="checkedModal"
        :check="check"
        @cancel="checkedModal = false"
      />
      <div v-if="width >= 720" v-d-flex="{direction: 'column', align: 'flex-start'}">
        <Typography
          size="xs"
          :weight="400"
          color="gray-dark"
          v-text="dateFilter(check.receipt_date)"
        />
      </div>
      <div v-d-flex="{align: 'flex-start'}">
        <Icon
          v-m-r="12"
          :is-adopted="true"
          :style="{fontSize: '24px'}"
          :type="check.is_delivery ? 'delivery' : 'shop'"
        />
        <div v-d-flex="{direction: 'column', align: 'flex-start'}">
          <Typography v-text="check.is_delivery ? 'Доставка' : 'Покупка в магазине'" />
          <Typography
            v-p-t="4"
            v-width="width >= 720 ? 300 : 170 "
            size="xs"
            :weight="400"
            color="gray-dark"
            v-text="check.address"
          />
        </div>
      </div>
      <div v-if="width >= 720" v-d-flex="">
        <div v-if="!extraInfoCard" v-width="100" style="text-align: right">
          <Typography v-text="`${check.turnover}₽`" />
        </div>
        <div v-else v-width="100" v-d-flex="{justify: 'flex-end'}">
          <Icon
            v-cursor="'pointer'"
            v-print="`#check${check?.receipt_id}`"
            :is-adopted="true"
            type="print"
          />
        </div>

        <Icon
          v-m-l="30"
          v-cursor="'pointer'"
          :is-adopted="true"
          type="favorite"
          :class="['check__icon', {'check__icon--active' : check.is_favorite}]"
          @click.native="toggleFavorite(check?.receipt_index)"
        />
        <Icon
          v-m-l="30"
          v-cursor="'pointer'"
          :is-adopted="true"
          :type="extraInfoCard ? 'arrow-down' : 'arrow-up'"
          @click.native="loadMoreInfo"
        />
      </div>
      <Button
        v-if="width < 720"
        v-d-flex="{justify: 'center', align: 'center'}"
        v-width="40"
        v-bg="'#F7F7F7'"
        type="default"
      >
        <Icon
          v-cursor="'pointer'"
          v-m-t="2"
          v-d-flex="{justify: 'center', align: 'center'}"
          :is-adopted="true"
          type="favorite"
          :style="{fontSize: '15px'}"
          :class="['check__icon', {'check__icon--active' : check.is_favorite}]"
          @click.native="toggleFavorite(check?.receipt_id)"
        />
      </Button>
    </div>
    <div v-if="width < 720" v-m-t="22" v-d-flex="{justify: 'space-between'}">
      <Typography
        v-m-l="36"
        size="xs"
        :weight="600"
        color="gray-dark"
        v-text="dateFilter(check.operation_timestamp)"
      />
      <Typography v-text="`${check.turnover}₽`" />
    </div>
    <div v-if="extraInfoCard" v-m-t="17">
      <table v-width="'100%'">
        <tr>
          <td> <Typography color="gray-dark" size="xs" v-text="'Название продукта'" /></td>
          <td><Typography color="gray-dark" size="xs" v-text="'Кол-во'" /></td>
          <td><Typography color="gray-dark" size="xs" v-text="'Стоимость'" /></td>
          <td v-p-l="2">
            <Typography color="gray-dark" size="xs" v-text="'НДС'" />
          </td>
        </tr>
        <tr v-for="product in check.extraInfo?.details" :key="product.product_id">
          <td v-width="width < 1315 ? 415 : 450">
            <div v-p-r="8">
              <Typography size="xs" v-text="product.name" />
            </div>
          </td>
          <td><Typography v-p-r="40" size="xs" v-text="product.quantity" /></td>
          <td>
            <Typography
              v-p-r="20"
              :weight="600"
              size="xs"
              v-text="`${product.sales_amount} ₽`"
            />
          </td>
          <td><Typography color="gray-dark" size="xs" v-text="`${product.tax} %`" /></td>
        </tr>
      </table>
      <div v-m-t="30">
        <Typography size="xs" v-text="`Покупка совершена по карте № ${check.card_number}`" />
      </div>
      <div v-m-t="24" v-d-flex="{align: 'flex-end'}">
        <Typography v-text="'Итого'" />
        <div class="check__border" />
        <Typography :weight="600" v-text="`${check.turnover}₽`" />
      </div>
      <div v-if="!check?.is_delivery" v-d-flex="{align: 'flex-start'}" v-m-t="24">
        <Typography v-text="'Информация о кассовом чеке'" />
        <Icon
          v-m-l="30"
          :is-adopted="true"
          :type="extraOFDCard ? 'arrow-down' : 'arrow-up'"
          style="cursor: pointer"
          @click.native="loadOFDInfo"
        />
      </div>
      <div v-if="check.ofdInfo?.error_message">
        <Typography
          size="xs"
          :weight="600"
          :line-height="14.4"
        >
          <span>
            Не удалось загрузить данные из ОФД. <br>
            Возможна задержка до 24 часов в отображении данных. <br>
            Пожалуйста, попробуйте повторить попытку позже. <br>
          </span>
        </Typography>
      </div>
      <div v-if="!check.ofdInfo?.error_message && extraOFDCard" v-m-t="24">
        <Typography
          v-m-t="24"
          size="xs"
          :weight="600"
          v-text="parseCheckTime(check.extraInfo?.operation_timestamp)"
        />
        <div v-d-flex="{justify: 'space-between', align: 'center'}">
          <div v-width="320">
            <Typography
              size="xs"
              :weight="600"
              :line-height="14.4"
            >
              <span>
                {{ check?.company_name }} <br>
                ИНН: {{ check?.extraInfo?.inn }}, СНО: ОСН <br>
                {{ check?.raw_address }} <br>
                Касса: {{ check?.ofdInfo?.wsid }}, смена {{ check?.ofdInfo?.fiscdayno }} <br>
                Приход Формат расчета: безналичный <br>
                Сумма НДС 20%: {{ check?.extraInfo?.tax_20 }}. Сумма НДС 10%:
                {{ check?.extraInfo?.tax_10 }}. <br>
              </span>
            </Typography>
          </div>
          <Typography
            size="xs"
            :weight="600"
            :line-height="14.4"
            color="gray-dark"
          >
            <span>
              Сайт ФНС: <br>
              www.nalog.ru <br>
              РН ККТ: {{ check?.ofdInfo.rn }} <br>
              ЗН ККТ: {{ check?.ofdInfo.zn }} <br>
              ФП: {{ check?.ofdInfo.fpd }} <br>
              ФН: {{ check?.ofdInfo.fn_id }} <br>
              ФД: {{ check?.ofdInfo.fn_receipt_id }} <br>
            </span>
          </Typography>
          <qr-code class="qr" :text="qrValue" :size="80" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VueQRCodeComponent from 'vue-qrcode-component';
import Print from 'vue-print-nb-jeecg';
import moment, { Moment } from 'moment';
import {
  computed,
  defineComponent, ref, useNuxtApp,
} from '#app';
import Typography from '~/components/Typography.vue';
import mediaQueryMixin from '~/mixins/mediaQueryMixin';
import CheckModal from '~/components/CheckModal.vue';

Vue.component('QrCode', VueQRCodeComponent);

declare interface ExtraInfo {
  details: {
    product_id: number;
    name: string;
    quantity: number;
    sales_amount: number;
    tax: number;
  }[];
  tax_20: number;
  tax_10: number;
  inn: string;
  company_name: string;
  raw_address: string;
  operation_timestamp: string;
}

declare interface OFDInfo {
  wsid: string;
  fiscdayno: string;
  fpd: string;
  fn_id: string;
  fn_receipt_id: string;
  error_message: string;
  zn: string;
  rn: string;
}

declare interface Check {
  is_favorite: boolean;
  receipt_id: string;
  receipt_index: number;
  operation_timestamp: number;
  retail_id: string;
  receipt_date: string;
  card_number: string;
  turnover: number;
  company_name: string;
  raw_address: string;
  ofdInfo: OFDInfo;
  extraInfo: ExtraInfo;
}

export default defineComponent({
  name: 'Check',
  components: { Typography, CheckModal },
  mixins: [mediaQueryMixin],
  props: {
    check: {
      type: Object as () => Check,
    },
    closeCheck: {
      type: Boolean,
      default: false,
    },
    index: {
      type: Number,
    },
  },
  setup(props) {
    Vue.use(Print);
    const { $store } = useNuxtApp();
    const extraInfoCard = ref<boolean>(false);
    const extraInfoCheck = ref<boolean>(false);
    const extraOFDCard = ref<boolean>(false);
    const extraOFDError = ref<boolean>(false);
    const checkedModal = ref<boolean>(false);
    const loadMoreInfo = async () => {
      if (!props.check?.extraInfo) {
        await $store.dispatch('checkCard/getCheckExtraInfo', {
          payload: {
            receipt_index: props.check?.receipt_index,
            retail_id: props.check?.retail_id,
            receipt_date: props.check?.receipt_date,
          },
        });
        extraInfoCard.value = true;
        return;
      }
      extraInfoCard.value = !extraInfoCard.value;
    };
    const loadOFDInfo = async () => {
      if (props.check?.is_delivery) return;
      if (!props.check?.ofdInfo) {
        await $store.dispatch('checkCard/getCheckOFDInfo', {
          payload: {
            receipt_index: props.check?.receipt_index,
            retail_id: props.check?.retail_id,
            receipt_date: props.check?.receipt_date,
          },
        });
        extraOFDCard.value = true;
        return;
      }
      extraOFDCard.value = !extraOFDCard.value;
    };
    const openCheckModal = async (width: number) => {
      if (width >= 720) return;
      if (!props.check?.extraInfo) {
        await $store.dispatch('checkCard/getCheckExtraInfo', {
          payload: {
            receipt_index: props.check?.receipt_index,
            retail_id: props.check?.retail_id,
            receipt_date: props.check?.receipt_date,
          },
        });
        await $store.dispatch('checkCard/getCheckOFDInfo', {
          payload: {
            receipt_index: props.check?.receipt_index,
            retail_id: props.check?.retail_id,
            receipt_date: props.check?.receipt_date,
          },
        });
        checkedModal.value = true;
        return;
      }
      checkedModal.value = !checkedModal.value;
    };
    const qrValue = computed<any>(() => `t=${props.check?.extraInfo?.operation_timestamp}&s=${props.check?.turnover}&fn=${props.check?.ofdInfo?.fn_id}&i=${props.check?.ofdInfo?.fn_receipt_id}&fp=${props.check?.ofdInfo?.fpd}&n=1`);
    const dateFilter = (date : any) => moment(date).format('DD-MM-YY');
    const parseCheckTime = (time) => moment(time).format('HH:MM DD-MM-YY');
    const toggleFavorite = async (id: string) => {
      await $store.dispatch('checkCard/toggleFavorite', props.check);
    };
    return {
      extraInfoCard,
      loadMoreInfo,
      loadOFDInfo,
      extraInfoCheck,
      extraOFDCard,
      extraOFDError,
      toggleFavorite,
      dateFilter,
      qrValue,
      checkedModal,
      openCheckModal,
      parseCheckTime,
    };
  },
  watch: {
    closeCheck(newVal, oldVal) {
      if (newVal) {
        this.extraInfoCard = false;
        this.extraOFDCard = false;
      }
    },
  },
});

</script>

<style lang="scss">
@import '../assets/style/mixin';
.check {
  background: var(--color-white-main);
  padding: 24px;
  max-height: 100%;
  border-radius: 16px;
  overflow: hidden;
  transition: max-height 1s;
  @include devices(mobile) {
    padding: 24px 10px 24px 20px;
  }
  &__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
  }
  &__border {
    width: 70%;
    margin: 0 4px 5px 8px;
    border-bottom: 1px dashed var(--color-gray-main);
  }
  &__icon{
    & svg path {
      transition: 0.2s;
      fill: transparent;
    }
    &--active svg path{
      transition: 0.5s;
      fill: var(--color-red-background);
      stroke: var(--color-red-background);
    }
  }
  @media print {
    .qr img{
      display: none !important;
    }
  }
}
</style>
