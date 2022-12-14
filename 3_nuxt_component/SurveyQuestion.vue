<template>
  <div
    v-if="dicts"
    :class="{'poll-entry--error': error && Object.keys(error).length > 0,
             'poll-entry_loading': isCheckingAnswer}"
    class="poll-entry"
  >
    <div class="poll-entry__question">
      <div class="poll-entry__question--number">
        <span class="poll-entry__question--number-text">
          {{ number }}.
        </span>
      </div>
      <div
        class="poll-entry__question--text wyswiyg-content"
        v-html="question.question_text"
      />
    </div>

    <div
      v-if="question.image"
      class="poll-entry__image-main"
    >
      <a
        :href="question.image"
        target="_blank"
      >
        <img
          :src="question.image"
          alt=""
        >
      </a>
    </div>

    <div v-if="question.skipped">
      <div
        v-if="!question.is_required && enabled"
        class="poll-entry__question--not-requied"
      >
        Вопрос пропущен, <a
          href="#"
          @click.prevent="skipQuestion(false)"
        >отменить</a>
      </div>
      <div
        v-if="!enabled"
        class="poll-entry__question--not-requied"
      >
        Вопрос пропущен
      </div>
    </div>
    <div v-else>
      <div
        v-if="!question.is_required && enabled"
        class="poll-entry__question--not-requied"
      >
        Это необязательный вопрос, вы можете его <a
          href="#"
          @click.prevent="skipQuestion(true)"
        >пропустить</a>
      </div>

      <div v-if="question.description">
        <div class="poll-entry__hint">
          <div
            class="poll-entry__hint-answer"
            v-html="nl2br(question.description)"
          />
        </div>
      </div>

      <div>
        <div v-if="isCheckingAnswer" class="loading__container">
          <div>
            <Loading
              :image-height="20"
              :image-width="20"
            />
            Проверка ответа...
          </div>
        </div>
        <div v-if="question.question_type == dicts['const_question_types']['TYPE_TEXT']">
          <div class="poll-entry__answer">
            <simple-input
              :form="form"
              :field="'questions->' + index + '->user_answers->answer_text'"
              type="textarea"
              placeholder="Введите ответ"
            />
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_SINGLE_ANSWER']">
          <div class="poll-entry__answer">
            <simple-input
              :direction="getDirectionNameById(question.direction)"
              :form="form"
              :field="'questions->' + index + '->user_answers->answer_id'"
              :values="question['sub_questions']"
              type="radio_html"
              :is-readonly="isAnswered"
              @input="onInput"
            />
          </div>
        </div>

        <div v-if="question.question_type === dicts['const_question_types']['TYPE_ORDER']">
          <div class="poll-entry__answer">
            <div class="input_order">
              <draggable
                v-model="question.user_answers['answer_id']"
                :options="{group:'answers__row__' + index}"
                :force-fallback="true"
                :disabled="!enabled"
                @start="drag=false"
                @end="drag=false;"
              >
                <div
                  v-for="(answer_id, answer_index) in question.user_answers['answer_id']"
                  :key="answer_id"
                  :index="answer_index"
                  class="input_order--item"
                >
                  <div class="input_order--item-index">
                    {{ getIndexByID(question.sub_questions, answer_id) + 1 }}.
                  </div>
                  <div
                    class="wyswiyg-content"
                    v-html="getAnswerById(question.sub_questions, answer_id, index)"
                  />
                </div>
              </draggable>
            </div>
          </div>
        </div>

        <div
          v-if="question.question_type ==
            dicts['const_question_types']['TYPE_MULTIPLE_ANSWERS']"
        >
          <div class="poll-entry__answer">
            <simple-input
              :direction="getDirectionNameById(question.direction)"
              :form="form"
              :field="'questions->' + index + '->user_answers->answer_id'"
              :values="question['sub_questions']"
              :max-answers="question['max_answers']"
              type="checkbox_html"
              :is-readonly="isAnswered"
              @input="onInput"
            />
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_CROSS_TABLE']">
          <div class="poll-entry__answer">
            <table class="poll-entry__table">
              <thead>
                <tr>
                  <th>Утверждение</th>
                  <th
                    v-for="(data, key) in getCrossTableItems('header')"
                    :key="key"
                  >
                    {{ data.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data_row, key) in getCrossTableItems('row')"
                  :key="key"
                >
                  <td>{{ data_row.title }}</td>
                  <td
                    v-for="(data_col) in getCrossTableItems('header')"
                    :key="data_col.id + '_' + data_row.id"
                    class="poll-entry__table-cell"
                  >
                    <label class="input__radio">
                      <!--enabled-->
                      <input
                        v-model="rowValues[ String(data_row.id) ]"
                        :name="'row_' + data_row.id"
                        :value="data_col.id"
                        :disabled="!enabled"
                        type="radio"
                      >
                      <span class="input__radio-content" />
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_SCALE']">
          <div class="poll-entry__answer poll-entry__answer--no-scroll poll-entry__answer--scale">
            <vue-slider
              v-model="numberValue"
              :min="startNumber"
              :max="endNumber"
              :marks="isNumericScaleFormat ? numericSliderMarks : textSliderMarks"
              :process-style="{ background: processColor }"
              :dot-style="isNumericScaleFormat
                ? {} : { boxShadow: '0px 0px 0px 0px rgb(0 0 0 / 32%)' }"
              :tooltip-formatter="sliderTooltipFormatter"
              :disabled="!enabled || isAnswered"
              :tooltip="isNumericScaleFormat ? 'always' : 'none'"
              @change="onSliderChange"
              @drag-start="onClickSliderChange"
            >
              <template
                v-slot:label="{ label, caption, labelStyle, labelActiveStyle, captionStyle }"
              >
                <!-- Маркер значения — label -->
                <div
                  class="vue-slider-mark-label"
                  :style="{
                    ...labelStyle,
                    ...labelActiveStyle,
                  }"
                  v-text="label"
                />
                <!-- Подпись — caption -->
                <div
                  v-if="caption"
                  :style="captionStyle"
                  v-text="caption"
                />
              </template>
            </vue-slider>
            <span v-if="sliderProcessing" v-m-t="25" v-text="sliderHintText" />
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_NUMBER']">
          <div class="poll-entry__answer poll-entry__answer--no-scroll">
            <div class="poll_answer-number">
              <label>Ответ</label>
              <div class="poll_answer-number__answer">
                <simple-input
                  :placeholder="'Введите число'"
                  :form="form"
                  :field="`questions->${index}->user_answers->answer_number`"
                  type="number"
                  class="input-data-table"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_DATETIME']">
          <div class="poll-entry__answer poll-entry__answer--no-scroll">
            <div
              v-if="question.date_time_type
                && ['TYPE_DATETIME',
                    'TYPE_DATE'].includes(getCodeByDateType(question.date_time_type))"
              class="poll_answer-date"
            >
              <label>Дата:</label>
              <div class="poll_answer-date__answer">
                <simple-input
                  :form="form"
                  :field="'questions->' + index + '->user_answers->extra_info->date'"
                  type="date"
                  class="input-data-table"
                  :is-readonly="isDatePicked"
                  @input="onDateTimeInput($event, 'date')"
                />
              </div>
            </div>
            <div
              v-if="question.date_time_type
                && ['TYPE_DATETIME',
                    'TYPE_TIME'].includes(getCodeByDateType(question.date_time_type))"
              class="poll_answer-date"
            >
              <label>Время:</label>
              <div class="poll_answer-date__answer">
                <simple-input
                  :form="form"
                  :field="'questions->' + index + '->user_answers->extra_info->time'"
                  type="time"
                  class="input-time"
                  :is-readonly="isTimePicked"
                  @blur="onDateTimeInput($event, 'time')"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_FILE_CONTAINER']">
          <div class="poll-entry__answer poll-entry__answer--no-scroll">
            <div
              v-if="enabled"
              class="poll_answer-file"
            >
              <label class="poll_answer-file__label">Файл:</label>
              <div class="poll_answer-file__upload">
                <file-upload
                  :key="'file__' + index"
                  :upload-path="imagesUploadPath"
                  class="button button--lime button--secondary"
                  extensions="gif,jpg,jpeg,png,pdf"
                  name="file"
                  @file-upload-complete="fileUploadComplete(index, $event)"
                  @file-upload-failed="fileUploadFailed(index, $event)"
                >
                  Загрузить файл
                </file-upload>
              </div>
            </div>
            <div
              v-if="Array.isArray(question.user_answers.extra_info.files)
                && question.user_answers.extra_info.files.length > 0"
              class="poll_answer-file-current"
            >
              <label class="poll_answer-file-current__label">Файлы:</label>
              <div class="poll_answer-file-current__items">
                <ul class="poll_answer-file-current__list">
                  <li
                    v-for="(file, fileIndex) in question.user_answers.extra_info.files"
                    :key="fileIndex"
                  >
                    <a
                      :href="file.url"
                      target="_blank"
                    >{{ file.original_name }}</a>
                    <a
                      v-if="enabled"
                      href="#"
                      class="poll_answer-file-current__remove"
                      @click.prevent="removeFile(index, fileIndex)"
                    >
                      <img src="~/assets/i/trash.svg">
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_NOTIFY']">
          <div class="notify-text">
            {{ question.notify_text }}
          </div>
          <div class="poll-entry__answer poll-entry__answer--no-scroll">
            <simple-input
              class="input-notify"
              :title="question.notify_accept_text
                ? question.notify_accept_text : 'Я согласен с извещением'"
              :field="`questions->${index}->user_answers->extra_info->checked`"
              :form="form"
              :values="[true]"
              type="checkbox"
            />
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_DATA_TABLE']">
          <div class="poll-entry__answer">
            <table class="poll-entry__table">
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th
                    v-for="(column, key) in answersData?.columns"
                    :key="key"
                  >
                    {{ column.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data_row) in answersData?.rows"
                  :key="data_row.id"
                >
                  <td>{{ data_row.title }}</td>
                  <td
                    v-for="(data_col) in answersData?.columns"
                    :key="data_col.id + '_' + data_row.id"
                    class="poll-entry__table-cell"
                  >
                    <simple-input
                      v-bind="inputTypeProps(
                        data_col.data_type,
                        `questions->${index}->user_answers->extra_info->rows->${
                          getRowId(data_row.id)}->values->${
                          getValueId(data_row.id,data_col.id)}->value`,
                        data_col.id
                      )"
                      class="input-data-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- TODO: объединить перечень и таблицу -->
        <div v-if="question.question_type == dicts['const_question_types']['TYPE_DATA_LIST']">
          <div
            v-d-flex="{align: 'center'}"
            class="poll-entry__answer"
          >
            <table class="poll-entry__table">
              <thead>
                <tr>
                  <th class="datalist-th">
                    №
                  </th>
                  <th
                    v-for="(column, key) in answersData.columns"
                    :key="key"
                  >
                    {{ column.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data_row, rowIdx) in answersData.rows"
                  :key="data_row.id"
                >
                  <td class="datalist-td">
                    {{ `${rowIdx+1}.` }}
                  </td>
                  <td
                    v-for="(data_col) in answersData.columns"
                    :key="data_col.id + '_' + data_row.id"
                    class="poll-entry__table-cell"
                  >
                    <simple-input
                      v-bind="inputTypeProps(
                        data_col.data_type,
                        `questions->${index}->user_answers->extra_info->rows->${
                          getRowId(data_row.id)}->values->${
                          getValueId(data_row.id,data_col.id)}->value`,
                        data_col.id
                      )"
                      :show-labels="false"
                      class="input-data-table"
                    />
                  </td>
                  <td class="datalist-delete">
                    <Button
                      v-if="!form.readonly"
                      state="danger"
                      icon-after="trash-red"
                      @click.prevent="deleteListRow(data_row.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <Button
              v-if="!form.readonly"
              v-width="250"
              state="filled"
              label="Добавить строку"
              @click.prevent="addListRow()"
            />
          </div>
        </div>

        <div v-if="question.question_type == dicts['const_question_types']['TYPE_NPS']">
          <div
            v-d-flex="{ justify: 'space-between', direction: 'row' }"
            class="poll-entry__answer"
          >
            <label
              v-for="(val, idx) in 11"
              :key="'radio-input_' + idx"
              v-m-r="0"
              class="input__radio"
            >
              <input
                v-model="question.user_answers['answer_number']"
                :value="idx"
                :disabled="!enabled"
                type="radio"
              >
              <span v-text-align:center>
                <div
                  v-m-t="4"
                  v-text-align:center
                  v-text="idx"
                />
              </span>
            </label>
          </div>
          <div
            v-d-flex="{ justify: 'space-between' }"
            class="input__radio-labels"
          >
            <span>Совсем не доволен</span>
            <span>Очень доволен</span>
          </div>
        </div>
      </div>

      <div
        v-if="question.max_answers"
        class="poll-entry__select-conditions"
      >
        Можно выбрать не более
        {{ declension(question.max_answers,
                      '%d варианта ответа,%d вариантов ответа,%d вариантов ответов') }}.
      </div>

      <div v-if="question.is_comments_allowed">
        <div class="poll-entry__comment">
          <label class="poll-entry__comment-label">
            Прокомментируйте ответ:
          </label>
          <div class="poll-entry__comment-answer">
            <simple-input
              :form="form"
              :field="`questions->${index}->user_answers->comment`"
              type="textarea"
              placeholder="Введите комментарий"
            />
          </div>
        </div>
      </div>

      <div
        v-if="error && Object.keys(error).length > 0"
      >
        <div
          v-for="(err, idx) in error"
          :key="idx"
          class="poll-entry-message poll-entry-message_error"
        >
          <img
            src="~assets/i/warning.svg"
            alt=""
          >
          <span v-html="err[0]" />
        </div>
      </div>
      <div
        v-if="isPollTestFormat && answerResults.length > 0"
      >
        <div
          v-for="(result, idx) in answerResults"
          :key="idx"
          class="poll-entry-message"
          :class="{'poll-entry-message_success': result.type === 'success',
                   'poll-entry-message_error': result.type === 'failure'}"
        >
          <Icon
            v-m-r="12"
            :type="result.type === 'success' ? 'check' : 'info-circle'"
          />
          <span v-html="result.text" />
        </div>
      </div>
      <div v-if="showRightAnswers && !enabled">
        <span
          v-html="getQuestionRightAnswerText(
            form.rightAnswers,
            question.question_id,
            question.question_type,
            question.sub_questions
          )"
        />
      </div>
    </div>
  </div>
</template>
<script>
import VueSlider from 'vue-slider-component';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import SimpleInput from '~/components/SimpleInput.vue';
import FileUpload from '~/components/FileUpload.vue';
import mixins_common from '~/mixins/common';
import rightAnswer from '~/mixins/rightAnswer';
import draggable from '~/plugins/vuedraggable';

function watchHandler(val) {
  const result = [];
  const value = val;
  Object.keys(value).forEach((v) => {
    result.push(`${v}_${value[v]}`);
  });

  this.form.questions[this.index].user_answers.answer_id = result;
}

const red = '255,55,35,100';
const yellow = '255,199,22,100';
const green = '0,161,33,100';

export default {
  name: 'SurveyQuestion',
  components: {
    FileUpload,
    SimpleInput,
    VueSlider,
    draggable,
  },

  mixins: [mixins_common, rightAnswer],
  props: {
    form: { type: Object, default: null },
    question: { type: Object, default: null },
    error: { type: Object, default: null },
    number: { type: Number, default: null },
    index: { type: Number, default: null },
    enabled: { type: Boolean },
    showRightAnswers: Boolean,
  },

  data() {
    return {
      rowValues: {},

      isCheckingAnswer: false,
      isAnswered: false,
      isDatePicked: false,
      isTimePicked: false,

      sliderProcessing: false,
      slideringTimeout: null,
      sliderHintSecondsToInput: 4,
      sliderHintSecondsRemaining: null,
      slideringHintInterval: null,

      answerResults: [],
      directions: [
        { id: 1, name: 'vertical' },
        { id: 2, name: 'horizontal' }],
    };
  },

  computed: {
    dicts() {
      return this.$store.getters['dict_values/dicts'].base || {};
    },
    imagesUploadPath() {
      return `/api/survey/${this.$route.params.id}/upload/`;
    },

    numberValue: {
      cache: false,
      get() {
        const { answer_number, answer_id } = this.form.questions[this.index].user_answers;
        if (this.isNumericScaleFormat) {
          return answer_number || null;
        }
        const questionIndex = this.question.sub_questions.findIndex(
          (sub_question) => sub_question.id === answer_id,
        );
        return questionIndex >= 0 ? questionIndex : 0;
      },
      set(newVal) {
        if (this.isNumericScaleFormat) {
          this.form.questions[this.index].user_answers.answer_number = newVal;
        } else {
          this.form.questions[this.index].user_answers.answer_id = this.question.sub_questions
            .find(
              (sub_question, index) => index === newVal,
            )?.id;
        }
      },
    },

    answersData: {
      get() {
        return this.form.questions[this.index].user_answers.extra_info;
      },
    },
    isPollTestFormat() {
      return this.$getDictById('poll_formats', this.form.poll.poll_format)?.code === 'POLL_TYPE_QUIZ';
    },
    sliderHintText() {
      return `Ответ зачтется через ${this.sliderHintSecondsRemaining}...`;
    },
    isReansweredEnable() {
      return this.form.poll.re_answer_enabled;
    },
    pollUid() {
      return this.$route.params.id;
    },
    startNumber() {
      return this.isNumericScaleFormat ? this.question.number_from : 0;
    },
    endNumber() {
      return this.isNumericScaleFormat
        ? this.question.number_to
        : this.question.sub_questions.length - 1;
    },
    textSliderMarks() {
      const result = {};
      this.question.sub_questions.forEach((sub_question, index) => {
        const color = 'black';
        result[index] = {
          label: sub_question.title || '',
          caption: sub_question.extra_text,
          style: {
            width: '20px',
            height: '20px',
            display: 'block',
            transform: 'translate(-8px, -8px)',
            backgroundColor: '#ccc',
            border: '4px solid #ccc',
          },
          captionStyle: {
            fontSize: '14px',
            textAlign: 'center',
            transform: 'translate(-50%, 20px)',
            opacity: '.75',
            width: '100px',
          },
          labelStyle: this.question.scale_format === this.getFormatIdByTitle('Шкала оценки с эмодзи')
            ? {
              fontSize: '34px',
              textAlign: 'center',
              transform: 'translate(-50%, -65px)',
            }
            : {
              fontSize: '14px',
              whiteSpace: 'normal',
              textAlign: 'center',
            },
          labelActiveStyle: {
            color,
          },
          activeStyle: {
            backgroundColor: this.processColor,
            border: `4px solid ${this.processColor}`,
          },
        };
      });
      return result;
    },
    processColor() {
      return this.getColorTransition([[red, yellow, '0-50'], [yellow, green, '51-100']]);
    },
    isNumericScaleFormat() {
      return this.question.scale_format === this.getFormatIdByTitle('Шкала оценки с числами');
    },
  },

  watch: {
    rowValues: {
      handler: watchHandler,
      deep: true,
    },
  },

  async mounted() {
    if (this.question.question_type === this.dicts.const_question_types.TYPE_CROSS_TABLE) {
      this.question.user_answers.answer_id.forEach((v) => {
        if (String(v).includes('_')) {
          const d = v.split('_');
          this.$set(this.rowValues, String(d[0]), parseInt(d[1]));
        }
      });
    } else if (this.question.question_type === this.dicts.const_question_types.TYPE_DATA_TABLE
    || this.question.question_type === this.dicts.const_question_types.TYPE_DATA_LIST) {
      if (!this.answersData?.rows) {
        this.answersData.rows = [];
      }
      if (!this.answersData?.columns) {
        this.answersData.columns = [];
      }

      const data = { ...this.answersData };

      if (data?.rows?.length === 0 && data?.columns?.length === 0) {
        this.question.sub_questions.forEach((v) => {
          const axis = v.extra_type === 2 ? 'rows' : 'columns';
          data[axis].push(
            {
              id: v.id,
              title: v.title,
              ...(axis === 'columns' && { data_type: v.data_type }),
              ...(axis === 'rows' && { values: [] }),
            },
          );
        });

        if (this.question.question_type === this.dicts.const_question_types.TYPE_DATA_LIST) {
          data.rows.push(
            {
              id: 1,
              values: [],
            },
          );
        }

        data.rows.forEach((row) => {
          data.columns.forEach((column) => {
            row.values.push({
              id: column.id,
              data_type: column.data_type,
              value: null,
            });
          });
        });
      }

      this.$set(this.question.user_answers, 'extra_info', data);
    } else if (this.question.question_type === this.dicts.const_question_types.TYPE_DATETIME
    || this.question.question_type === this.dicts.const_question_types.TYPE_NOTIFY) {
      // eslint-disable-next-line no-undef
      if (!_.isPlainObject(this.form.questions[this.index].user_answers.extra_info)) {
        this.$set(this.form.questions[this.index].user_answers, 'extra_info', {});
      }
    } else if (this.question.question_type === this.dicts.const_question_types.TYPE_ORDER) {
      if (this.form.questions[this.index].user_answers.answer_id.length === 0
        || this.form.questions[this.index].user_answers.answer_id.length
        !== this.form.questions[this.index].sub_questions.length) {
        this.form.questions[this.index].user_answers.answer_id = [];
        this.form.questions[this.index].sub_questions.forEach((n) => {
          this.form.questions[this.index].user_answers.answer_id.push(n.id);
        });
      }
    }

    if (this.question.question_type === this.dicts.const_question_types.TYPE_DATETIME
    && !this.question.date_time_type) {
      this.question.date_time_type = 6;
    }

    this.addedRows = this.maxCachedFormRows !== 0 ? this.maxCachedFormRows : 1;

    if (this.form.poll.poll_format === 2) {
      if ((!this.isReansweredEnable
        && (this.question.user_answers.answer_id?.length === 0
          || typeof !this.question.user_answers?.answer_id !== 'number'))) this.isAnswered = true;
      this.isAnswered = false;
    }
    this.$emit('isFirstQuestion', this.index);
  },
  beforeDestroy() {
    clearInterval(this.slideringHintInterval);
  },

  methods: {
    getRowId(rowId) {
      return this.answersData.rows.findIndex((row) => row.id === rowId);
    },
    getValueId(rowId, colId) {
      return this.answersData.rows[this.getRowId(rowId)].values.findIndex(
        (value) => value.id === colId,
      );
    },
    numericSliderMarks(val) {
      const min = this.form.questions[this.index].number_from;
      const max = this.form.questions[this.index].number_to;
      const half = this.form.questions[this.index].number_average || Math.round((max - min) / 2);

      if (val === max || val === min || val === half) {
        return {
          label: String(val),
          style: {
            width: '20px',
            height: '20px',
            display: 'block',
            transform: 'translate(-8px, -8px)',
            backgroundColor: '#ccc',
            border: '4px solid #ccc',
          },
          activeStyle: {
            backgroundColor: this.processColor,
            border: `4px solid ${this.processColor}`,
          },
          labelActiveStyle: {
            color: 'black',
          },
        };
      }

      return false;
    },

    removeFile(questionIndex, fileIndex) {
      const extraInfo = this.form.questions[this.index].user_answers.extra_info;
      extraInfo.files.splice(fileIndex, 1);
      this.$set(this.form.questions[questionIndex].user_answers.extra_info, extraInfo);
    },

    fileUploadComplete(questionIndex, data) {
      let extraInfo = [];
      if (Array.isArray(this.form.questions[this.index].user_answers.extra_info.files)) {
        extraInfo = this.form.questions[this.index].user_answers.extra_info.files;
      }
      extraInfo.push(data);

      this.$set(this.form.questions[this.index].user_answers.extra_info.files, extraInfo);
      this.$forceUpdate();
    },
    fileUploadFailed(questionIndex, data) {
      Swal.fire({
        type: 'error',
        title: 'Ошибка',
        text: data.response.data.file[0],
        showConfirmButton: true,
        showCloseButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        allowEnterKey: true,
      });
    },

    getCrossTableItems(type) {
      const result = [];

      let seekType = 2; // строка
      if (type === 'header') {
        seekType = 1; // столбец
      }

      this.question.sub_questions.forEach((v) => {
        if (v.extra_type === seekType) {
          result.push({ id: v.id, title: v.title, data_type: v.data_type });
        }
      });
      return result;
    },

    skipQuestion(v) {
      this.form.questions[this.index].skipped = v;
      this.$emit('skipped');
    },
    getIndexByID(answers, answerId) {
      return answers.findIndex((n) => n.id === answerId);
    },
    getAnswerById(answers, answerId) {
      return answers.filter((n) => n.id === answerId)[0].title;
    },

    sliderTooltipFormatter(v) {
      let result = v;
      if (result === null) {
        result = this.question.number_from;
      }
      return result;
    },

    inputTypeProps(type, field, colId) {
      const subQuestion = this.question.sub_questions.find((e) => e.id === colId);

      const types = {
        1: {
          placeholder: 'Введите текст',
          form: this.form,
          field,
          type: 'text',
        },
        2: {
          placeholder: 'Введите число',
          form: this.form,
          field,
          type: 'number',
        },
        3: {
          form: this.form,
          field,
          type: 'date',
        },
        4: {
          form: this.form,
          field,
          type: 'select',
          values: subQuestion?.extra_answers || [],
        },
      };
      return types[type];
    },

    addListRow() {
      const { rows } = this.answersData;
      const values = [];

      this.answersData?.columns.forEach((column) => {
        values.push({
          id: column.id,
          data_type: column.data_type,
          value: null,
        });
      });

      rows.push({
        id: rows.length === 0 ? 1 : Math.max(...(rows.map((row) => row.id))) + 1,
        values,
      });

      this.$forceUpdate();
    },

    deleteListRow(index) {
      const rowIdx = this.answersData.rows.findIndex((row) => row.id === index);
      this.answersData.rows.splice(rowIdx, 1);

      this.$forceUpdate();
    },

    isTypeOf(question, ...args) {
      const typeIds = [];
      args.forEach((v) => {
        typeIds.push(this.dicts.const_question_types[v]);
      });
      if (typeIds.includes(question.question_type)) {
        return true;
      }
      return false;
    },
    getCodeByDateType(id) {
      return this.dicts?.date_time_types.find((type) => id === type.id)?.code;
    },
    onInput(value) {
      if (!this.isPollTestFormat) return;
      this.checkAnswer(value);
    },
    async checkAnswer(value) {
      this.isCheckingAnswer = true;

      let answer = value;

      if ([
        this.dicts.const_question_types.TYPE_MULTIPLE_ANSWERS,
      ].includes(this.question.question_type)) {
        answer = Array.isArray(value) ? value : [value];
      } else if ([this.dicts.const_question_types.TYPE_DATETIME]
        .includes(this.question.question_type)) {
        const dateAnswers = this.question.user_answers.extra_info;
        answer = {
          ...(dateAnswers?.date) && { date: dateAnswers?.date },
          ...(dateAnswers?.time) && { time: dateAnswers?.time },
        };
      }

      const params = {
        question_id: this.question.question_id,
        answer,
      };
      const { data } = await this.$store.dispatch('survey/checkAnswer', { uid: this.pollUid, params });

      this.onAnswerIsRight(data);
      this.isCheckingAnswer = false;
    },
    async onDateTimeInput(value, type) {
      if (!this.isPollTestFormat) return;

      const timeFormat = new RegExp('[0-2][0-3]:[0-5][0-9]');
      const dateFormat = new RegExp('\\d{4}-\\d{2}-\\d{2}');

      if (type === 'date') {
        if (!dateFormat.test(value)) return;
        if (!this.isReansweredEnable) {
          this.isDatePicked = true;
        }
      } else if (type === 'time') {
        if (!timeFormat.test(value)) return;
        if (!this.isReansweredEnable) {
          this.isTimePicked = true;
        }
      }

      if (this.getCodeByDateType(this.question.date_time_type) === 'TYPE_DATETIME') {
        const answerDate = this.question.user_answers.extra_info.date;
        const answerTime = this.question.user_answers.extra_info.time;

        if (!dateFormat.test(answerDate) || !timeFormat.test(answerTime)) {
          return;
        }
      }
      await this.checkAnswer(value);
    },
    onSliderChange(value) {
      if (!this.isPollTestFormat) return;
      clearTimeout(this.slideringTimeout);
      clearInterval(this.slideringHintInterval);
      this.sliderProcessing = true;

      this.sliderHintSecondsRemaining = this.sliderHintSecondsToInput;
      this.slideringHintInterval = setInterval(() => {
        this.sliderHintSecondsRemaining -= 1;
      }, 1000);

      this.slideringTimeout = setTimeout(() => {
        this.checkAnswer(value);
        this.sliderProcessing = false;
      }, this.sliderHintSecondsToInput * 1000);
    },
    onClickSliderChange(value) {
      this.numberValue = value;
      if (!this.isPollTestFormat) return;
      this.checkAnswer(value);
    },
    onAnswerIsRight(answerData) {
      if (answerData.is_right === undefined || answerData.error) {
        this.answerResults = [];
        return;
      }
      if (this.question.user_answers.answer_id.length
        !== answerData.right_answer.length && this.question.question_type === 3) {
        this.answerResults = [
          { type: 'failure', text: 'Осталось ещё несколько вариантов' },
        ];
        return;
      }
      if (answerData.is_right) {
        this.answerResults = [
          { type: 'success', text: 'Выбран правильный ответ' },
        ];
      } else {
        this.answerResults = [
          { type: 'failure', text: 'Выбран неправильный ответ' },
        ];
      }
    },
    getDirectionNameById(id) {
      return this.directions.find((direction) => direction.id === id).name;
    },
    getFormatIdByTitle(title) {
      return this.dicts.question_scale_formats.find(
        (scale_format) => scale_format.title === title,
      ).id;
    },
    /**
    * @description Позволяет делать переход между 2мя RGBA цветами на шкале
    *              до заданного процента шкалы.
    * Пример передаваемых аргументов: ([red, yellow, '0-50'], [yellow, green, '51-100'])
    * Будет означать переход с цвета red до yellow от 0% шкалы до 50%
    * и с цвета yellow до green от 51% шкалы до 100%.
    */
    getColorTransition(transitions, index = null) {
      const numberValue = index !== null ? index : this.numberValue;
      const scaleLength = this.endNumber - this.startNumber;
      const scaleValue = numberValue - this.startNumber;
      // Высчитываем пройденный процент от всей шкалы
      const scaleValueInPercentage = Math.round((100 / scaleLength) * scaleValue);
      let calcucactedColor = '';
      transitions.forEach((transition) => {
        const rgbaArray = [];
        const firstColor = transition[0].split(',').map((color) => Number(color));
        const secondColor = transition[1].split(',').map((color) => Number(color));
        const startOfScale = Number(transition[2].split('-')[0]);
        const endOfScale = Number(transition[2].split('-')[1]);
        const isInScaleRange = (startOfScale <= scaleValueInPercentage)
                                 && (scaleValueInPercentage <= endOfScale);

        if (!isInScaleRange) return false;
        for (let i = 0; i < 4; i += 1) {
          const differenceBetweenColors = (secondColor[i] - firstColor[i]) / 100;
          const multiplier = 100 / (endOfScale - startOfScale);
          const value = scaleValueInPercentage - startOfScale;

          const colorNumber = differenceBetweenColors * multiplier * value + firstColor[i];
          rgbaArray.push(Math.round(colorNumber));
        }

        calcucactedColor = `rgba(${rgbaArray.join()})`;
        return true;
      });
      return calcucactedColor;
    },
  },
};
</script>

<style lang="scss">
  .notify-text {
    padding: 30px;
    border: 1px solid #d6d6d6ac;
    border-radius: 10px;
  }

  .input__date-wrapper::before {
    top: 14px !important;
  }

  .poll-entry__answer {
    display: flex;
    flex-direction: column;

    .input-time {
      width: 85px;
    }

    .input__field {
      margin-top: 0
    }
    .input-notify {
      align-items: center;
      .input__label {
        width: 90%;
        cursor: auto;
      }

      .input__content {
        order: -1;
        flex-grow: 0;
        .input__checkbox {
          padding-top: 0;
          margin-right: 0;
        }
      }
    }

    .input-data-table {
      min-width: 150px;
      margin: 0 5px;

      .input__date-wrapper::before {
        top: 24px;
      }
      .input__field--date {
        width: 160px;
      }
    }

    th.datalist-th, td.datalist-td {
      width: 10px;
      min-width: 1px;
      padding-left: 15px;
    }

    .datalist-delete {
      width: 40px;
    }

    .button-add {
      width: 300px;
      align-self: center;
    }

    .poll-entry__table {
      margin-bottom: 15px;
    }
  }

</style>

<style lang="scss" scoped>
  .loading__container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    top: 40%;
  }
</style>
