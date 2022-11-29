<template>
  <div v-height="500" v-width="'70%'">
    <v-chart autoresize className="chart" :option="option"/>
  </div>
</template>

<script>
import {use} from 'echarts/core';
import {CanvasRenderer} from 'echarts/renderers';
import {PieChart} from 'echarts/charts';
import {graphic} from 'echarts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import {ref, defineComponent} from 'vue';

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

export default defineComponent({
  name: 'LineChart',
  components: {
    VChart,
  },
  setup() {
    const option = ref({
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'cross',
          label: {
            margin: 25,
            backgroundColor: '#1B1C1E',
          },
        },
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        extraCssText: 'box-shadow: none',
        position: 'top',
        formatter: (params) => `
              <div style="color: white; font-family: 'Roboto'; font-style: normal;font-weight: 600; font-size: 16px; text-align: center">
              <div
              style="background: #22BDFF; border-radius: 8px 8px 0 0; padding: 8px 12px;">
                ${option.value.series[0].data[params.dataIndex]}
              </div>
              <div
              style="background: #9C60F3; padding: 8px 12px;">
                ${option.value.series[1].data[params.dataIndex]}
              </div>
              <div
              style="background: #4BC91A; border-radius: 0 0 8px 8px; padding: 8px 12px;">
                ${option.value.series[2].data[params.dataIndex]}
              </div>
              </div>
            `,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          splitNumber: 4,
          nameGap: 25,
          textBorderColor: 'transparent',
          axisLine: {
            show: false,
            lineStyle: {
              color: 'rgba(143, 146, 161, 1)',
            }
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            margin: 25,
            fontSize: 11,
            formatter: (value) => `${value}`,
          },
          axisPointer: {
            lineStyle: {
              color: 'rgba(143, 146, 161, 0.5)',
              type: 'solid',
            }
          },
          data: ['14 Марта 2022', '15 Марта 2022', '16 Марта 2022', '17 Марта 2022', '18 Марта 2022', '19 Марта 2022', '20 Марта 2022', '21 Марта 2022', '22 Марта 2022', '23 Марта 2022', '24 Марта 2022', '25 Марта 2022', '26 Марта 2022', '27 Марта 2022', '28 Марта 2022', '29 Марта 2022', '30 Марта 2022', '31 Марта 2022', '32 Марта 2022', '33 Марта 2022', '34 Марта 2022', '35 Марта 2022', '36 Марта 2022', '14 Марта 2022', '14 Марта 2022', '14 Марта 2022', '14 Марта 2022', '14 Марта 2022', '14 Марта 2022', '14 Марта 2022',],
        }
      ],
      yAxis: [
        {
          type: 'value',
          z: 4,
          splitNumber: 4,
          axisLine: {
            show: false,
          },
          axisLabel: {
            margin: 25,
          },
          axisPointer: {
            show: false,
          },
          splitLine: {
            show: true,
            type: 'dashed',
            lineStyle: {
              type: 'dashed',
              color: '#ECECEE',
            }
          }
        }
      ],
      series: [
        {
          name: 'All',
          type: 'line',
          symbol: 'circle',
          symbolSize: 4,
          animation: false,
          emphasis: {
            disabled: true,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#FFFFFF',
            color: '#22BDFF',
          },
          lineStyle: {
            width: 2,
            color: '#22BDFF',
          },

          areaStyle: {
            opacity: 0.9,
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#D0EBFF'
              },
              {
                offset: 1,
                color: '#F5FBFF'
              }
            ])
          },
          data: [159, 222, 343, 47, 85, 103, 214, 19, 381, 203, 184, 85, 314, 220, 73, 183, 110, 75, 29, 35, 346, 97, 364, 268, 51, 331, 100, 265, 62, 386, 185, 34, 247]
        },
        {
          name: 'Sended',
          type: 'line',
          symbol: 'circle',
          symbolSize: 4,
          animation: false,
          emphasis: {
            disabled: true,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#FFFFFF',
            color: '#9C60F3',
          },
          lineStyle: {
            width: 2,
            color: '#9C60F3',
          },

          areaStyle: {
            opacity: 0.9,
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#E6DAFF'
              },
              {
                offset: 1,
                color: '#F7F2FF'
              }
            ])
          },
          data: [276, 170, 355, 304, 260, 117, 122, 213, 226, 330, 255, 10, 378, 96, 383, 115, 137, 295, 267, 75, 256, 84, 174, 144, 154, 271, 348, 193, 193, 162, 101, 145, 103]
        },
        {
          name: 'Confirmed',
          type: 'line',
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: {
            borderWidth: 1,
            borderColor: '#FFFFFF',
            color: '#4BC91A',
          },
          lineStyle: {
            width: 2,
            color: '#4BC91A',
          },
          animation: false,
          emphasis: {
            disabled: true,
          },
          areaStyle: {
            opacity: 0.9,
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#A8F589'
              },
              {
                offset: 1,
                color: '#EDFFE7'
              }
            ])
          },
          data: [397, 343, 14, 334, 265, 212, 172, 128, 290, 351, 312, 343, 196, 283, 72, 219, 315, 66, 238, 131, 276, 382, 2, 127, 157, 127, 341, 41, 217, 211, 101, 324, 16],
        },
      ]
    }
    );

    return {option};
  },
});
</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>
