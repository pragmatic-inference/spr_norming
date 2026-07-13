/*
 * Provocation & Revenge: PCIbex norming experiment
 * ------------------------------------------------
 * Data file expected in data_includes:
 *   sentences_mvb_8_versions.csv
 *
 * The script keeps ONLY rows whose generated_version is:
 *   - both_male
 *   - both_female
 *
 * For each list_item, one available same-gender variant is selected
 * deterministically from the participant's Prolific ID. Trial order and
 * answer side are then randomized deterministically.
 *
 * Optional CSV columns, recommended for manual corrections:
 *
 *   norming_question
 *   NP1_answer
 *   NP2_answer
 *
 * Example:
 *
 * norming_question:
 *   Wer war am frühen Morgen unüberhörbar?
 *
 * NP1_answer:
 *   Der Schüler
 *
 * NP2_answer:
 *   Der Lehrer
 *
 * If those optional columns are absent, the script derives the question
 * and answer labels from the existing columns.
 */

PennController.ResetPrefix(null);

// Uncomment this only when the experiment is ready for real data collection.
// DebugOff();

// ============================================================
// CONFIGURATION
// ============================================================

const DATA_FILE = "sentences_mvb_8_versions.csv";

// Maximum time allowed for one judgment.
// The timer begins when the sentence, question and buttons are visible.
const RESPONSE_TIMEOUT_MS = 30000;

// Brief blank interval between trials.
const INTER_TRIAL_INTERVAL_MS = 300;

// Replace this with the completion link/code for the new Prolific study.
const confirmationLink =
  "https://app.prolific.com/submissions/complete?cc=CNAM6AA1";

// ============================================================
// PARTICIPANT AND EXPERIMENT TIMING
// ============================================================

// Use the Prolific participant ID when available.
// A temporary ID is generated when previewing the study outside Prolific.
window.PROLIFIC_ID =
  GetURLParameter("PROLIFIC_PID") ||
  ("tmp_" + Math.random().toString(36).slice(2));

window.STUDY_ID =
  GetURLParameter("STUDY_ID") || "";

window.SESSION_ID =
  GetURLParameter("SESSION_ID") || "";

// Whole-experiment timing.
window.__expStart = Date.now();
window.__expEnd = null;
window.__expDuration = null;

// Main norming-section timing.
window.__normingStart = null;
window.__normingEnd = null;
window.__normingDuration = null;

// Per-trial timing and response information.
window.__normingState = window.__normingState || {};

// Add participant information to every results line.
Header()
  .log("PROLIFIC_ID", window.PROLIFIC_ID)
  .log("STUDY_ID", window.STUDY_ID)
  .log("SESSION_ID", window.SESSION_ID);

// ============================================================
// EXPERIMENT STYLING
// ============================================================

// The styling is injected here, so a separate CSS file is not required.
Header(
  newFunction("inject_norming_css", function () {
    if (
      document.getElementById(
        "provocation-revenge-norming-css"
      )
    ) {
      return;
    }

    const style = document.createElement("style");

    style.id = "provocation-revenge-norming-css";

    style.innerHTML = `
      body {
        margin-top: 42px !important;
        font-family: Arial, Helvetica, sans-serif;
      }

      .norming-sentence {
        font-size: 30px;
        line-height: 1.55;
        text-align: center;
        max-width: 1050px;
        margin: 0 auto 34px auto;
      }

      .norming-question {
        font-size: 28px;
        line-height: 1.45;
        text-align: center;
        font-weight: 600;
        max-width: 950px;
        margin: 0 auto 22px auto;
      }

      .norming-hint {
        font-size: 20px;
        line-height: 1.4;
        text-align: center;
        font-style: italic;
        margin-top: 18px;
      }

      .norming-answer-button {
        width: 380px !important;
        min-height: 72px !important;
        padding: 14px 22px !important;
        font-size: 24px !important;
        line-height: 1.25 !important;
        cursor: pointer !important;
        border: 2px solid #777 !important;
        border-radius: 9px !important;
        background: #ffffff !important;
      }

      .norming-answer-button:hover {
        background: #f1f1f1 !important;
      }
    `;

    document.head.appendChild(style);
  }).call()
);

// ============================================================
// GENERAL TEXT AND CSV HELPERS
// ============================================================

function cleanCell(value) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
}

function stripFinalPunctuation(value) {
  return cleanCell(value)
    .replace(/[\s,.;:!?]+$/g, "")
    .trim();
}

function capitalizeFirst(value) {
  const stringValue = cleanCell(value);

  if (!stringValue) {
    return stringValue;
  }

  return (
    stringValue.charAt(0).toUpperCase() +
    stringValue.slice(1)
  );
}

function escapeHTML(value) {
  return cleanCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeId(value) {
  return String(value).replace(
    /[^A-Za-z0-9_-]/g,
    "_"
  );
}

// ============================================================
// ANSWER-LABEL HELPERS
// ============================================================

/*
 * Converts an NP taken from sentence position into a reasonable
 * standalone answer label.
 *
 * Examples:
 *
 *   den Lehrer  -> Der Lehrer
 *   einen Mann  -> Ein Mann
 *
 * This is intentionally conservative. German case morphology cannot
 * always be repaired reliably with a simple rule.
 *
 * For irregular cases, add the optional columns NP1_answer and
 * NP2_answer to the CSV.
 */
function normalizeStandaloneNP(value) {
  let stringValue = stripFinalPunctuation(value);

  stringValue = stringValue
    .replace(/^den\s+/i, "der ")
    .replace(/^einen\s+/i, "ein ")
    .replace(/^dem\s+/i, "der ");

  return capitalizeFirst(stringValue);
}

function getNP1Answer(row) {
  return normalizeStandaloneNP(
    row.NP1_answer ||
    row["NP1 answer"] ||
    row.NP1
  );
}

function getNP2Answer(row) {
  const version =
    cleanCell(row.generated_version).toLowerCase();

  let fallback = "";

  if (version === "both_female") {
    fallback = row["NP2 - female"];
  }
  else if (version === "both_male") {
    fallback = row["NP2 - male"];
  }

  return normalizeStandaloneNP(
    row.NP2_answer ||
    row["NP2 answer"] ||
    fallback ||
    row.NP2
  );
}

// ============================================================
// QUESTION GENERATION
// ============================================================

function buildNormingQuestion(row) {
  // Prefer a manually written question when the optional column exists.
  const manualQuestion = cleanCell(
    row.norming_question ||
    row["norming question"]
  );

  if (manualQuestion) {
    if (/[?]$/.test(manualQuestion)) {
      return capitalizeFirst(manualQuestion);
    }

    return capitalizeFirst(manualQuestion) + "?";
  }

  /*
   * Build the question from:
   *
   *   präposition
   *   adjective + verb
   *
   * Example:
   *
   *   präposition:
   *     am frühen Morgen
   *
   *   adjective + verb:
   *     unüberhörbar war
   *
   * Result:
   *     Wer war am frühen Morgen unüberhörbar?
   */
  const prepositionalPhrase =
    stripFinalPunctuation(row["präposition"]);

  const adjectiveAndVerb =
    stripFinalPunctuation(row["adjective + verb"]);

  const match = adjectiveAndVerb.match(
    /^(.*?)\s+(war|waren|ist|sind|wäre|wären)$/i
  );

  if (match) {
    const predicate =
      cleanCell(match[1]);

    const copula =
      cleanCell(match[2]).toLowerCase();

    const middle = prepositionalPhrase
      ? " " + prepositionalPhrase
      : "";

    return (
      `Wer ${copula}${middle} ${predicate}?`
        .replace(/\s+/g, " ")
    );
  }

  /*
   * Fallback for rows whose adjective-plus-verb column does not
   * follow the expected pattern.
   */
  const pronoun = cleanCell(row.pronoun);

  if (pronoun) {
    return (
      `Auf wen bezieht sich das Pronomen „${pronoun}“?`
    );
  }

  return (
    "Auf welche der beiden Personen bezieht sich der weil-Satz?"
  );
}

// This is logged for later comparison with the participant's judgment.
// It is not treated as a correct answer during the experiment.
function getDesignReferent(row) {
  const causality =
    cleanCell(row.Causality).toUpperCase();

  if (causality.indexOf("NP1") === 0) {
    return "NP1";
  }

  if (causality.indexOf("NP2") === 0) {
    return "NP2";
  }

  return "";
}

// ============================================================
// DETERMINISTIC COUNTERBALANCING AND RANDOMIZATION
// ============================================================

// Deterministic string-to-number hash.
function hashStringToUint32(stringValue) {
  stringValue = String(stringValue || "");

  let hash = 2166136261;

  for (
    let index = 0;
    index < stringValue.length;
    index++
  ) {
    hash ^= stringValue.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

// Seeded pseudo-random-number generator.
function mulberry32(seed) {
  let state = seed >>> 0;

  return function () {
    state += 0x6d2b79f5;

    let value = Math.imul(
      state ^ (state >>> 15),
      1 | state
    );

    value ^= (
      value +
      Math.imul(
        value ^ (value >>> 7),
        61 | value
      )
    );

    return (
      ((value ^ (value >>> 14)) >>> 0) /
      4294967296
    );
  };
}

// Seeded Fisher-Yates shuffle.
function fisherYatesSeeded(array, randomFunction) {
  for (
    let index = array.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex =
      Math.floor(
        randomFunction() * (index + 1)
      );

    [
      array[index],
      array[randomIndex]
    ] = [
      array[randomIndex],
      array[index]
    ];
  }

  return array;
}

// Sort NP1-causality before NP2-causality.
function causalityRank(row) {
  const causality =
    cleanCell(row.Causality).toUpperCase();

  if (causality.indexOf("NP1") === 0) {
    return 0;
  }

  if (causality.indexOf("NP2") === 0) {
    return 1;
  }

  return 2;
}

// Sort male before female inside each causality condition.
function genderRank(row) {
  const version =
    cleanCell(row.generated_version).toLowerCase();

  if (version === "both_male") {
    return 0;
  }

  if (version === "both_female") {
    return 1;
  }

  return 2;
}

// ============================================================
// RESPONSE-TIME HELPERS
// ============================================================

function initializeTrialState(stateKey) {
  window.__normingState[stateKey] = {
    onset_epoch_ms: null,
    onset_performance_ms: null,
    response_epoch_ms: null,
    response_code: "",
    response_text: "",
    response_side: "",
    rt_ms: null,
    timed_out: 0
  };
}

function markTrialOnset(stateKey) {
  const state =
    window.__normingState[stateKey];

  state.onset_epoch_ms =
    Date.now();

  state.onset_performance_ms =
    performance.now();
}

function recordChoice(
  stateKey,
  code,
  text,
  side
) {
  const state =
    window.__normingState[stateKey];

  // Ignore repeated clicks or callbacks after the first response.
  if (
    !state ||
    state.response_code
  ) {
    return;
  }

  state.response_epoch_ms =
    Date.now();

  state.response_code =
    code;

  state.response_text =
    text;

  state.response_side =
    side;

  state.rt_ms =
    Math.round(
      performance.now() -
      state.onset_performance_ms
    );
}

function finalizeTrialState(stateKey) {
  const state =
    window.__normingState[stateKey];

  // If neither button was selected, record a timeout.
  if (!state.response_code) {
    state.response_epoch_ms =
      Date.now();

    state.response_code =
      "TIMEOUT";

    state.response_text =
      "";

    state.response_side =
      "";

    state.rt_ms =
      RESPONSE_TIMEOUT_MS;

    state.timed_out =
      1;
  }
}

function stateValue(
  stateKey,
  field
) {
  const state =
    window.__normingState[stateKey] || {};

  return state[field] == null
    ? ""
    : state[field];
}

// ============================================================
// REUSABLE TWO-BUTTON NORMING TRIAL
// ============================================================

function createNormingChoiceTrial(
  trialLabel,
  config
) {
  const uid =
    sanitizeId(config.uid);

  const stateKey =
    String(config.stateKey);

  const leftButtonName =
    "left_" + uid;

  const rightButtonName =
    "right_" + uid;

  const timerName =
    "response_window_" + uid;

  const leftText =
    config.leftText;

  const rightText =
    config.rightText;

  const leftCode =
    config.leftCode;

  const rightCode =
    config.rightCode;

  const commands = [
    // Initialize response state for this trial.
    newFunction(
      "initialize_state_" + uid,
      function () {
        initializeTrialState(stateKey);

        // Start the main-section timer at the first critical trial.
        if (
          config.isCritical &&
          window.__normingStart === null
        ) {
          window.__normingStart =
            Date.now();
        }
      }
    ).call(),

    // Present the whole sentence at once.
    newText(
      "sentence_" + uid,
      (
        '<div class="norming-sentence">' +
        escapeHTML(config.sentence) +
        "</div>"
      )
    ).print(),

    // Present the automatically generated or manually supplied question.
    newText(
      "question_" + uid,
      (
        '<div class="norming-question">' +
        escapeHTML(config.question) +
        "</div>"
      )
    ).print(),

    // Create the response-window timer before the button callbacks.
    newTimer(
      timerName,
      RESPONSE_TIMEOUT_MS
    ),

    // Left answer button.
    newButton(
      leftButtonName,
      leftText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .log("first")
      .callback(
        newFunction(
          "record_left_" + uid,
          function () {
            recordChoice(
              stateKey,
              leftCode,
              leftText,
              "left"
            );
          }
        ).call(),

        getButton(leftButtonName).disable(),
        getButton(rightButtonName).disable(),
        getTimer(timerName).stop()
      ),

    // Right answer button.
    newButton(
      rightButtonName,
      rightText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .log("first")
      .callback(
        newFunction(
          "record_right_" + uid,
          function () {
            recordChoice(
              stateKey,
              rightCode,
              rightText,
              "right"
            );
          }
        ).call(),

        getButton(leftButtonName).disable(),
        getButton(rightButtonName).disable(),
        getTimer(timerName).stop()
      ),

    // Display the two buttons horizontally.
    newCanvas(
      "answers_" + uid,
      1000,
      115
    )
      .add(
        85,
        15,
        getButton(leftButtonName)
      )
      .add(
        535,
        15,
        getButton(rightButtonName)
      )
      .center()
      .print(),

    newText(
      "hint_" + uid,
      (
        '<div class="norming-hint">' +
        "Bitte wählen Sie die spontan natürlichere Interpretation." +
        "</div>"
      )
    ).print(),

    /*
     * Begin response-time measurement only after the sentence,
     * question and buttons have been printed.
     */
    newFunction(
      "mark_onset_" + uid,
      function () {
        markTrialOnset(stateKey);
      }
    ).call(),

    /*
     * The timer ends either:
     *
     * 1. when the participant selects a button, because the callback
     *    stops the timer; or
     *
     * 2. after RESPONSE_TIMEOUT_MS.
     */
    getTimer(timerName)
      .start()
      .wait(),

    // Record timeout status when no response was made.
    newFunction(
      "finalize_state_" + uid,
      function () {
        finalizeTrialState(stateKey);
      }
    ).call(),

    clear(),

    newTimer(
      "iti_" + uid,
      INTER_TRIAL_INTERVAL_MS
    )
      .start()
      .wait()
  ];

  const trial = trialLabel
    ? newTrial(
        trialLabel,
        ...commands
      )
    : newTrial(
        ...commands
      );

  return trial
    .log(
      "is_practice",
      config.isPractice ? 1 : 0
    )
    .log(
      "trial_position",
      config.trialPosition || ""
    )
    .log(
      "latin_list",
      config.listId == null
        ? ""
        : config.listId
    )
    .log(
      "latin_target_index",
      config.targetIndex == null
        ? ""
        : config.targetIndex
    )
    .log(
      "n_same_gender_variants",
      config.nVariants == null
        ? ""
        : config.nVariants
    )
    .log(
      "list_item",
      config.listItem || ""
    )
    .log(
      "item_number",
      config.itemNumber || ""
    )
    .log(
      "original_row_index",
      config.originalRowIndex || ""
    )
    .log(
      "generated_version",
      config.generatedVersion || ""
    )
    .log(
      "gender_condition",
      config.genderCondition || ""
    )
    .log(
      "causality",
      config.causality || ""
    )
    .log(
      "design_referent",
      config.designReferent || ""
    )
    .log(
      "verb_bias",
      config.verbBias || ""
    )
    .log(
      "adj_amb",
      config.adjAmb || ""
    )
    .log(
      "pronoun",
      config.pronoun || ""
    )
    .log(
      "sentence",
      config.sentence
    )
    .log(
      "question",
      config.question
    )
    .log(
      "np1_answer",
      config.np1Text
    )
    .log(
      "np2_answer",
      config.np2Text
    )
    .log(
      "left_answer_code",
      leftCode
    )
    .log(
      "left_answer_text",
      leftText
    )
    .log(
      "right_answer_code",
      rightCode
    )
    .log(
      "right_answer_text",
      rightText
    )
    .log(
      "answer_sides_swapped",
      config.swapSides ? 1 : 0
    )
    .log(
      "question_onset_epoch_ms",
      function () {
        return stateValue(
          stateKey,
          "onset_epoch_ms"
        );
      }
    )
    .log(
      "response_epoch_ms",
      function () {
        return stateValue(
          stateKey,
          "response_epoch_ms"
        );
      }
    )
    .log(
      "response_code",
      function () {
        return stateValue(
          stateKey,
          "response_code"
        );
      }
    )
    .log(
      "response_text",
      function () {
        return stateValue(
          stateKey,
          "response_text"
        );
      }
    )
    .log(
      "response_side",
      function () {
        return stateValue(
          stateKey,
          "response_side"
        );
      }
    )
    .log(
      "response_rt_ms",
      function () {
        return stateValue(
          stateKey,
          "rt_ms"
        );
      }
    )
    .log(
      "timed_out",
      function () {
        return stateValue(
          stateKey,
          "timed_out"
        );
      }
    );
}

// ============================================================
// EXPERIMENT ORDER
// ============================================================

Sequence(
  "consent",
  "instructions",
  "practice",
  "go",
  "norming",
  "record_norming_time",
  "conclude",
  "exit",
  "demo",
  "debrief",
  "record_total_time",
  SendResults(),
  "submit"
);

// ============================================================
// CONSENT
// ============================================================

newTrial(
  "consent",

  newHtml(
    "consent_form",
    "consent.html"
  )
    .cssContainer({
      width: "720px"
    })
    .checkboxWarning(
      "Sie müssen zustimmen, bevor Sie fortfahren können."
    )
    .print(),

  newButton(
    "consent_continue",
    "Zustimmen und fortfahren"
  )
    .css({
      "margin-top": "20px",
      padding: "12px 24px",
      "font-size": "16px",
      cursor: "pointer",
      "background-color": "#a51e37",
      color: "white",
      border: "none",
      "border-radius": "4px"
    })
    .center()
    .print()
    .wait(
      getHtml("consent_form")
        .test.complete()
        .failure(
          getHtml("consent_form").warn()
        )
    )
);

// ============================================================
// INSTRUCTIONS
// ============================================================

newTrial(
  "instructions",

  defaultText
    .css({
      "font-size": "24px",
      "line-height": "1.6",
      "text-align": "left"
    })
    .cssContainer({
      width: "900px",
      margin: "0 auto 18px auto"
    })
    .print(),

  newText(
    "inst_title",
    (
      "<div style='" +
      "text-align:center;" +
      "font-size:32px;" +
      "font-weight:700;" +
      "'>" +
      "Willkommen!" +
      "</div>"
    )
  ),

  newText(
    "inst_1",
    (
      "In dieser Studie sehen Sie jeweils einen " +
      "vollständigen deutschen Satz."
    )
  ),

  newText(
    "inst_2",
    (
      "Unter dem Satz steht eine Frage dazu, auf welche der " +
      "beiden genannten Personen sich die Beschreibung im " +
      "weil-Satz Ihrer Meinung nach bezieht."
    )
  ),

  newText(
    "inst_3",
    (
      "Klicken Sie auf die Antwort, die Ihrer spontanen " +
      "Interpretation am ehesten entspricht."
    )
  ),

  newText(
    "inst_4",
    (
      "Es gibt dabei keine Rückmeldung zu richtig oder falsch. " +
      "Uns interessiert Ihre persönliche sprachliche Einschätzung."
    )
  ),

  newText(
    "inst_5",
    (
      "Lesen Sie aufmerksam, aber überlegen Sie nicht unnötig lange. " +
      "Für jede Antwort stehen höchstens 30 Sekunden zur Verfügung."
    )
  ),

  newButton(
    "instructions_continue",
    "Beispiel starten"
  )
    .css({
      "margin-top": "18px",
      padding: "12px 22px",
      "font-size": "19px",
      cursor: "pointer"
    })
    .center()
    .print()
    .wait()
);

// ============================================================
// PRACTICE TRIAL
// ============================================================

/*
 * This example demonstrates the task.
 *
 * It gives no right/wrong feedback, because this is a judgment task
 * rather than an objective comprehension test.
 */
createNormingChoiceTrial(
  "practice",
  {
    uid: "practice_1",
    stateKey: "practice_1",

    sentence:
      (
        "Die Fotografin traf die Redakteurin, " +
        "weil sie am Nachmittag sehr beschäftigt war."
      ),

    question:
      "Wer war am Nachmittag sehr beschäftigt?",

    np1Text:
      "Die Fotografin",

    np2Text:
      "Die Redakteurin",

    leftText:
      "Die Fotografin",

    rightText:
      "Die Redakteurin",

    leftCode:
      "NP1",

    rightCode:
      "NP2",

    swapSides:
      false,

    isPractice:
      true,

    isCritical:
      false,

    trialPosition:
      0
  }
);

// ============================================================
// START OF MAIN SECTION
// ============================================================

newTrial(
  "go",

  newText(
    "go_title",
    (
      "<div style='" +
      "text-align:center;" +
      "font-size:32px;" +
      "font-weight:700;" +
      "'>" +
      "Hauptteil" +
      "</div>"
    )
  ).print(),

  newText(
    "go_text",
    (
      "Im Hauptteil funktioniert jede Aufgabe genauso. " +
      "Bitte wählen Sie jeweils die Interpretation, die Ihnen " +
      "beim Lesen am natürlichsten erscheint."
    )
  )
    .css({
      "font-size": "26px",
      "line-height": "1.6",
      "text-align": "center"
    })
    .cssContainer({
      width: "900px",
      margin: "20px auto"
    })
    .print(),

  newButton(
    "go_continue",
    "Hauptteil beginnen"
  )
    .css({
      padding: "12px 22px",
      "font-size": "20px",
      cursor: "pointer"
    })
    .center()
    .print()
    .wait()
);

// ============================================================
// LOAD AND FILTER THE CSV
// ============================================================

/*
 * The object has this structure:
 *
 * sameGenderItems[list_item] = [
 *   row 1,
 *   row 2,
 *   row 3,
 *   row 4
 * ]
 *
 * Only both_male and both_female rows are retained.
 */
const sameGenderItems = {};

Template(
  DATA_FILE,
  function (row) {
    const version =
      cleanCell(
        row.generated_version
      ).toLowerCase();

    if (
      version !== "both_male" &&
      version !== "both_female"
    ) {
      return {};
    }

    /*
     * list_item identifies the base lexical item.
     *
     * item_number is used as a fallback in case list_item is absent.
     */
    const listItem =
      cleanCell(
        row.list_item ||
        row.item_number
      );

    if (!listItem) {
      throw new Error(
        (
          "A same-gender row has no list_item or item_number in " +
          DATA_FILE
        )
      );
    }

    if (!sameGenderItems[listItem]) {
      sameGenderItems[listItem] = [];
    }

    sameGenderItems[listItem].push(row);

    /*
     * No trial is returned here.
     *
     * The trials are created only after the entire CSV has been
     * read and organized.
     */
    return {};
  }
);

// ============================================================
// BUILD COUNTERBALANCED TRIALS
// ============================================================

/*
 * This one-row dummy table triggers trial construction after the
 * main CSV has finished loading.
 */
AddTable(
  "build_norming_trials",
  "x\n1"
);

Template(
  "build_norming_trials",
  function () {
    const itemKeys =
      Object.keys(
        sameGenderItems
      ).sort(
        function (firstItem, secondItem) {
          const firstNumber =
            Number(firstItem);

          const secondNumber =
            Number(secondItem);

          if (
            Number.isFinite(firstNumber) &&
            Number.isFinite(secondNumber)
          ) {
            return (
              firstNumber -
              secondNumber
            );
          }

          return String(firstItem)
            .localeCompare(
              String(secondItem)
            );
        }
      );

    if (itemKeys.length === 0) {
      throw new Error(
        (
          "No rows with generated_version=both_male or " +
          "both_female were found in " +
          DATA_FILE
        )
      );
    }

    const globalSeed =
      hashStringToUint32(
        window.PROLIFIC_ID
      );

    const randomFunction =
      mulberry32(globalSeed);

    /*
     * Stable order within each item:
     *
     * 0: NP1-causality, both_male
     * 1: NP1-causality, both_female
     * 2: NP2-causality, both_male
     * 3: NP2-causality, both_female
     *
     * The exact available rows can vary, so the script also works
     * if one item has fewer candidates.
     */
    itemKeys.forEach(
      function (itemKey) {
        sameGenderItems[itemKey].sort(
          function (firstRow, secondRow) {
            const causalityDifference =
              causalityRank(firstRow) -
              causalityRank(secondRow);

            if (causalityDifference !== 0) {
              return causalityDifference;
            }

            const genderDifference =
              genderRank(firstRow) -
              genderRank(secondRow);

            if (genderDifference !== 0) {
              return genderDifference;
            }

            return (
              Number(
                firstRow.original_row_index || 0
              ) -
              Number(
                secondRow.original_row_index || 0
              )
            );
          }
        );
      }
    );

    /*
     * Determine how many same-gender variants the largest item has.
     *
     * Usually this should be four:
     *
     * NP1 male
     * NP1 female
     * NP2 male
     * NP2 female
     */
    const maxVariants =
      Math.max.apply(
        null,
        itemKeys.map(
          function (itemKey) {
            return (
              sameGenderItems[itemKey].length
            );
          }
        )
      );

    /*
     * Assign the participant to a reproducible list.
     */
    const listId =
      globalSeed % maxVariants;

    const selectedRows = [];

    /*
     * Choose one condition per list_item.
     *
     * The item index is rotated through the variants so the conditions
     * remain distributed across the experiment.
     */
    itemKeys.forEach(
      function (
        itemKey,
        itemIndex
      ) {
        const variants =
          sameGenderItems[itemKey];

        const targetIndex =
          (
            itemIndex +
            listId
          ) %
          variants.length;

        selectedRows.push({
          itemKey: itemKey,
          row: variants[targetIndex],
          targetIndex: targetIndex,
          nVariants: variants.length
        });
      }
    );

    // Randomize item order reproducibly.
    fisherYatesSeeded(
      selectedRows,
      randomFunction
    );

    const selectedTrials = [];

    selectedRows.forEach(
      function (
        entry,
        positionIndex
      ) {
        const row =
          entry.row;

        const sentence =
          cleanCell(
            row["Generated-Sentence"] ||
            row.story
          );

        const question =
          buildNormingQuestion(row);

        const np1Text =
          getNP1Answer(row);

        const np2Text =
          getNP2Answer(row);

        if (
          !sentence ||
          !np1Text ||
          !np2Text
        ) {
          throw new Error(
            (
              "Missing sentence or answer label for list_item=" +
              entry.itemKey
            )
          );
        }

        /*
         * Randomize whether NP1 appears on the left or right.
         */
        const swapSides =
          randomFunction() < 0.5;

        const leftText =
          swapSides
            ? np2Text
            : np1Text;

        const rightText =
          swapSides
            ? np1Text
            : np2Text;

        const leftCode =
          swapSides
            ? "NP2"
            : "NP1";

        const rightCode =
          swapSides
            ? "NP1"
            : "NP2";

        const generatedVersion =
          cleanCell(
            row.generated_version
          );

        const genderCondition =
          generatedVersion.toLowerCase() ===
          "both_male"
            ? "male"
            : "female";

        /*
         * This key is used internally to store timing data.
         */
        const stateKey = [
          "norming",
          entry.itemKey,
          cleanCell(
            row.original_row_index
          ),
          generatedVersion,
          positionIndex + 1
        ].join("_");

        const trialObject =
          createNormingChoiceTrial(
            null,
            {
              uid:
                stateKey,

              stateKey:
                stateKey,

              sentence:
                sentence,

              question:
                question,

              np1Text:
                np1Text,

              np2Text:
                np2Text,

              leftText:
                leftText,

              rightText:
                rightText,

              leftCode:
                leftCode,

              rightCode:
                rightCode,

              swapSides:
                swapSides,

              isPractice:
                false,

              isCritical:
                true,

              trialPosition:
                positionIndex + 1,

              listId:
                listId,

              targetIndex:
                entry.targetIndex,

              nVariants:
                entry.nVariants,

              listItem:
                entry.itemKey,

              itemNumber:
                cleanCell(
                  row.item_number
                ),

              originalRowIndex:
                cleanCell(
                  row.original_row_index
                ),

              generatedVersion:
                generatedVersion,

              genderCondition:
                genderCondition,

              causality:
                cleanCell(
                  row.Causality
                ),

              designReferent:
                getDesignReferent(row),

              verbBias:
                cleanCell(
                  row.verb_bias
                ),

              adjAmb:
                cleanCell(
                  row.adj_amb
                ),

              pronoun:
                cleanCell(
                  row.pronoun
                )
            }
          );

        /*
         * Give every dynamically constructed critical trial the
         * sequence label "norming".
         */
        selectedTrials.push([
          "norming",
          "PennController",
          trialObject
        ]);
      }
    );

    /*
     * Add the dynamically constructed trials to PCIbex.
     */
    window.items =
      (window.items || []).concat(
        selectedTrials
      );

    return {};
  }
);

// ============================================================
// NORMING-SECTION DURATION
// ============================================================

newTrial(
  "record_norming_time",

  newFunction(
    "store_norming_time",
    function () {
      window.__normingEnd =
        Date.now();

      if (
        window.__normingStart !== null
      ) {
        window.__normingDuration =
          (
            window.__normingEnd -
            window.__normingStart
          );
      }
    }
  ).call()
)
  .log(
    "norming_start_ms",
    function () {
      return (
        window.__normingStart == null
          ? ""
          : window.__normingStart
      );
    }
  )
  .log(
    "norming_end_ms",
    function () {
      return (
        window.__normingEnd == null
          ? ""
          : window.__normingEnd
      );
    }
  )
  .log(
    "norming_duration_ms",
    function () {
      return (
        window.__normingDuration == null
          ? ""
          : window.__normingDuration
      );
    }
  )
  .log(
    "norming_duration_sec",
    function () {
      return (
        window.__normingDuration == null
          ? ""
          : (
              window.__normingDuration /
              1000
            ).toFixed(3)
      );
    }
  );

// ============================================================
// END-OF-EXPERIMENT SCREEN
// ============================================================

newTrial(
  "conclude",

  newText(
    "conclude_title",
    (
      "<div style='" +
      "text-align:center;" +
      "font-size:32px;" +
      "font-weight:700;" +
      "'>" +
      "Hauptteil abgeschlossen" +
      "</div>"
    )
  ).print(),

  newText(
    "conclude_text",
    (
      "Vielen Dank! Bitte füllen Sie nun noch die " +
      "kurzen Abschlussformulare aus."
    )
  )
    .css({
      "font-size": "26px",
      "line-height": "1.6",
      "text-align": "center"
    })
    .cssContainer({
      width: "900px",
      margin: "20px auto"
    })
    .print(),

  newButton(
    "conclude_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait()
);

// ============================================================
// EXIT FORM
// ============================================================

newTrial(
  "exit",

  newHtml(
    "exit_form",
    "exit.html"
  )
    .cssContainer({
      width: "720px"
    })
    .inputWarning(
      "Sie müssen alle Fragen beantworten, bevor Sie fortfahren können."
    )
    .print()
    .log(),

  newButton(
    "exit_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait(
      getHtml("exit_form")
        .test.complete()
        .failure(
          getHtml("exit_form").warn()
        )
    )
);

// ============================================================
// DEMOGRAPHIC FORM
// ============================================================

newTrial(
  "demo",

  newHtml(
    "demo_form",
    "demo.html"
  )
    .cssContainer({
      width: "720px"
    })
    .inputWarning(
      "Sie müssen alle Fragen beantworten, bevor Sie fortfahren können."
    )
    .print()
    .log(),

  newButton(
    "demo_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait(
      getHtml("demo_form")
        .test.complete()
        .failure(
          getHtml("demo_form").warn()
        )
    )
);

// ============================================================
// DEBRIEF
// ============================================================

newTrial(
  "debrief",

  newHtml(
    "debrief_form",
    "debrief.html"
  )
    .cssContainer({
      width: "720px"
    })
    .print(),

  newButton(
    "debrief_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait()
);

// ============================================================
// WHOLE-EXPERIMENT DURATION
// ============================================================

newTrial(
  "record_total_time",

  newFunction(
    "store_total_time",
    function () {
      window.__expEnd =
        Date.now();

      window.__expDuration =
        (
          window.__expEnd -
          window.__expStart
        );
    }
  ).call()
)
  .log(
    "exp_start_ms",
    function () {
      return window.__expStart;
    }
  )
  .log(
    "exp_end_ms",
    function () {
      return window.__expEnd;
    }
  )
  .log(
    "exp_duration_ms",
    function () {
      return window.__expDuration;
    }
  )
  .log(
    "exp_duration_sec",
    function () {
      return (
        window.__expDuration /
        1000
      ).toFixed(3);
    }
  );

// ============================================================
// SUBMISSION
// ============================================================

newTrial(
  "submit",

  newText(
    "thanks",
    "<p>Vielen Dank für Ihre Teilnahme!</p>"
  )
    .center()
    .print(),

  newText(
    "prolific_link",
    (
      "<a href='" +
      confirmationLink +
      "' target='_blank' " +
      "style='font-weight:bold;'>" +
      "Klicken Sie hier für die Bestätigung auf Prolific" +
      "</a>" +
      "<p>" +
      "Dieser Schritt ist notwendig, damit Ihre Teilnahme bestätigt wird." +
      "</p>"
    )
  )
    .center()
    .print(),

  newButton("void")
    .wait()
);