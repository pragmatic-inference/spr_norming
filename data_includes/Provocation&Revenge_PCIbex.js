/*
 * Provocation & Revenge — PCIbex norming experiment
 *
 * Put this script in data_includes.
 * Put sentences_mvb_8_versions.csv in chunk_includes / Resources.
 *
 * Only generated_version = both_male / both_female is used.
 * Each participant sees one same-gender condition per list_item.
 */

PennController.ResetPrefix(null);

// Uncomment only when the experiment is ready to publish.
// DebugOff();

// ============================================================
// CONFIGURATION
// ============================================================

const DATA_FILE = "sentences_mvb_8_versions.csv";
const RESPONSE_TIMEOUT_MS = 30000;
const INTER_TRIAL_INTERVAL_MS = 300;

// Replace this with the completion code for the new Prolific study.
const confirmationLink =
  "https://app.prolific.com/submissions/complete?cc=CNAM6AA1";

// ============================================================
// PARTICIPANT IDS AND TIMING
// ============================================================

window.PROLIFIC_ID =
  GetURLParameter("PROLIFIC_PID") ||
  ("tmp_" + Math.random().toString(36).slice(2));

window.STUDY_ID =
  GetURLParameter("STUDY_ID") || "";

window.SESSION_ID =
  GetURLParameter("SESSION_ID") || "";

window.__expStart = Date.now();
window.__expEnd = null;
window.__expDuration = null;

window.__normingStart = null;
window.__normingEnd = null;
window.__normingDuration = null;

window.__normingState = {};

Header()
  .log("PROLIFIC_ID", window.PROLIFIC_ID)
  .log("STUDY_ID", window.STUDY_ID)
  .log("SESSION_ID", window.SESSION_ID);

// ============================================================
// STYLING
// ============================================================

Header(
  newFunction("inject_norming_css", function () {
    if (
      document.getElementById(
        "provocation-revenge-norming-css"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "provocation-revenge-norming-css";

    style.innerHTML = `
      body {
        margin-top: 42px !important;
        font-family: Arial, Helvetica, sans-serif;
      }

      .norming-sentence {
        max-width: 1050px;
        margin: 0 auto 34px auto;
        font-size: 30px;
        line-height: 1.55;
        text-align: center;
      }

      .norming-question {
        max-width: 950px;
        margin: 0 auto 22px auto;
        font-size: 28px;
        line-height: 1.45;
        font-weight: 600;
        text-align: center;
      }

      .norming-hint {
        margin-top: 18px;
        font-size: 20px;
        line-height: 1.4;
        font-style: italic;
        text-align: center;
      }
    `;

    document.head.appendChild(style);
  }).call()
);

// ============================================================
// BASIC HELPERS
// ============================================================

function cleanCell(value) {
  return String(
    value == null ? "" : value
  )
    .replace(/\s+/g, " ")
    .trim();
}

function stripFinalPunctuation(value) {
  return cleanCell(value)
    .replace(/[\s,.;:!?]+$/g, "")
    .trim();
}

function capitalizeFirst(value) {
  const text =
    cleanCell(value);

  return text
    ? text.charAt(0).toUpperCase() +
        text.slice(1)
    : "";
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
// GENDER-AWARE NOMINATIVE ANSWER FORMS
// ============================================================

/*
 * Exact overrides for forms where changing only the determiner
 * is not enough.
 *
 * Extend this dictionary if the full CSV contains additional
 * weak masculine nouns.
 */
const NOMINATIVE_NP_OVERRIDES = {
  "male|den löwen": "Der Löwe",
  "male|dem löwen": "Der Löwe",

  "male|den studenten": "Der Student",
  "male|dem studenten": "Der Student",

  "male|den menschen": "Der Mensch",
  "male|dem menschen": "Der Mensch",

  "male|den jungen": "Der Junge",
  "male|dem jungen": "Der Junge",

  "male|den kollegen": "Der Kollege",
  "male|dem kollegen": "Der Kollege",

  "male|den kunden": "Der Kunde",
  "male|dem kunden": "Der Kunde",

  "male|den komponisten": "Der Komponist",
  "male|dem komponisten": "Der Komponist",

  "male|den reisenden": "Der Reisende",
  "male|dem reisenden": "Der Reisende",

  "male|den angestellten": "Der Angestellte",
  "male|dem angestellten": "Der Angestellte"
};

const MASCULINE_NOMINATIVE_DETERMINERS = {
  // Definite articles
  der: "der",
  den: "der",
  dem: "der",
  des: "der",

  // Indefinite articles
  ein: "ein",
  einen: "ein",
  einem: "ein",
  eines: "ein",

  // kein
  kein: "kein",
  keinen: "kein",
  keinem: "kein",
  keines: "kein",

  // mein
  mein: "mein",
  meinen: "mein",
  meinem: "mein",
  meines: "mein",

  // dein
  dein: "dein",
  deinen: "dein",
  deinem: "dein",
  deines: "dein",

  // sein
  sein: "sein",
  seinen: "sein",
  seinem: "sein",
  seines: "sein",

  // ihr
  ihr: "ihr",
  ihren: "ihr",
  ihrem: "ihr",
  ihres: "ihr",

  // unser
  unser: "unser",
  unseren: "unser",
  unserem: "unser",
  unseres: "unser",

  // euer
  euer: "euer",
  euren: "euer",
  eurem: "euer",
  eures: "euer",

  // dieser
  dieser: "dieser",
  diesen: "dieser",
  diesem: "dieser",
  dieses: "dieser",

  // jeder
  jeder: "jeder",
  jeden: "jeder",
  jedem: "jeder",
  jedes: "jeder",

  // jener
  jener: "jener",
  jenen: "jener",
  jenem: "jener",
  jenes: "jener",

  // welcher
  welcher: "welcher",
  welchen: "welcher",
  welchem: "welcher",
  welches: "welcher",

  // solcher
  solcher: "solcher",
  solchen: "solcher",
  solchem: "solcher",
  solches: "solcher",

  // mancher
  mancher: "mancher",
  manchen: "mancher",
  manchem: "mancher",
  manches: "mancher"
};

const FEMININE_NOMINATIVE_DETERMINERS = {
  // Definite articles
  die: "die",

  /*
   * Feminine dative:
   *
   * der Lehrerin → die Lehrerin
   */
  der: "die",

  // Indefinite articles
  eine: "eine",
  einer: "eine",

  // kein
  keine: "keine",
  keiner: "keine",

  // mein
  meine: "meine",
  meiner: "meine",

  // dein
  deine: "deine",
  deiner: "deine",

  // sein
  seine: "seine",
  seiner: "seine",

  // ihr
  ihre: "ihre",
  ihrer: "ihre",

  // unser
  unsere: "unsere",
  unserer: "unsere",

  // euer
  eure: "eure",
  eurer: "eure",

  // diese
  diese: "diese",
  dieser: "diese",

  // jede
  jede: "jede",
  jeder: "jede",

  // jene
  jene: "jene",
  jener: "jene",

  // welche
  welche: "welche",
  welcher: "welche",

  // solche
  solche: "solche",
  solcher: "solche",

  // manche
  manche: "manche",
  mancher: "manche"
};

/*
 * Convert a sentence-internal NP into a standalone nominative
 * answer label.
 *
 * Examples:
 *
 * male:
 *   den Lehrer → Der Lehrer
 *   dem Lehrer → Der Lehrer
 *   der Lehrer → Der Lehrer
 *
 * female:
 *   die Lehrerin → Die Lehrerin
 *   der Lehrerin → Die Lehrerin
 *   einer Lehrerin → Eine Lehrerin
 */
function toStandaloneNominative(
  value,
  gender
) {
  const source =
    stripFinalPunctuation(value);

  if (!source) {
    return "";
  }

  if (
    gender !== "male" &&
    gender !== "female"
  ) {
    throw new Error(
      "Unknown gender passed to " +
      "toStandaloneNominative: " +
      gender
    );
  }

  const overrideKey =
    gender +
    "|" +
    source.toLowerCase();

  if (
    Object.prototype.hasOwnProperty.call(
      NOMINATIVE_NP_OVERRIDES,
      overrideKey
    )
  ) {
    return (
      NOMINATIVE_NP_OVERRIDES[
        overrideKey
      ]
    );
  }

  const words =
    source.split(/\s+/);

  const originalDeterminer =
    words.shift();

  const determiner =
    originalDeterminer.toLowerCase();

  const rest =
    words.join(" ");

  const map =
    gender === "male"
      ? MASCULINE_NOMINATIVE_DETERMINERS
      : FEMININE_NOMINATIVE_DETERMINERS;

  const nominativeDeterminer =
    Object.prototype.hasOwnProperty.call(
      map,
      determiner
    )
      ? map[determiner]
      : originalDeterminer;

  return capitalizeFirst(
    rest
      ? nominativeDeterminer +
          " " +
          rest
      : nominativeDeterminer
  );
}

// ============================================================
// QUESTION AND MATERIAL GENERATION
// ============================================================

function buildNormingQuestion(row) {
  const prepositionalPhrase =
    stripFinalPunctuation(
      row["präposition"]
    );

  const predicateWithVerb =
    stripFinalPunctuation(
      row["adjective + verb"]
    );

  /*
   * The final word is treated as the finite verb:
   *
   * unüberhörbar war
   * → verb: war
   * → predicate: unüberhörbar
   */
  const parts =
    predicateWithVerb
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length >= 2) {
    const finiteVerb =
      parts.pop().toLowerCase();

    const predicate =
      parts.join(" ");

    const middle =
      prepositionalPhrase
        ? " " + prepositionalPhrase
        : "";

    return (
      `Wer ${finiteVerb}${middle} ${predicate}?`
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  const pronoun =
    cleanCell(row.pronoun);

  if (pronoun) {
    return (
      `Auf wen bezieht sich das Pronomen „${pronoun}“?`
    );
  }

  return (
    "Auf welche der beiden Personen " +
    "bezieht sich der weil-Satz?"
  );
}

function getNormingMaterials(row) {
  const generatedVersion =
    cleanCell(
      row.generated_version
    ).toLowerCase();

  if (
    generatedVersion !== "both_male" &&
    generatedVersion !== "both_female"
  ) {
    throw new Error(
      "Expected both_male or both_female, " +
      "but received: " +
      generatedVersion
    );
  }

  const genderCondition =
    generatedVersion === "both_male"
      ? "male"
      : "female";

  /*
   * Use the explicitly gendered columns.
   *
   * Do not use row.NP2 here, because row.NP2 can contain:
   *
   * den Lehrer auf,
   *
   * including a separable verb particle.
   */
  const np1Source =
    genderCondition === "male"
      ? row["NP1 - male"]
      : row["NP1 - female"];

  const np2Source =
    genderCondition === "male"
      ? row["NP2 - male"]
      : row["NP2 - female"];

  const sentence =
    cleanCell(
      row["Generated-Sentence"]
    );

  const question =
    buildNormingQuestion(row);

  const np1Text =
    toStandaloneNominative(
      np1Source,
      genderCondition
    );

  const np2Text =
    toStandaloneNominative(
      np2Source,
      genderCondition
    );

  const missing = [];

  if (!sentence) {
    missing.push(
      "Generated-Sentence"
    );
  }

  if (!question) {
    missing.push(
      "generated question"
    );
  }

  if (!np1Text) {
    missing.push(
      genderCondition === "male"
        ? "NP1 - male"
        : "NP1 - female"
    );
  }

  if (!np2Text) {
    missing.push(
      genderCondition === "male"
        ? "NP2 - male"
        : "NP2 - female"
    );
  }

  if (missing.length > 0) {
    throw new Error(
      "Missing material for list_item=" +
      cleanCell(row.list_item) +
      ", generated_version=" +
      generatedVersion +
      ": " +
      missing.join(", ")
    );
  }

  return {
    sentence,
    question,
    np1Text,
    np2Text,
    generatedVersion,
    genderCondition,

    rawNP1Source:
      cleanCell(np1Source),

    rawNP2Source:
      cleanCell(np2Source)
  };
}

function getDesignReferent(row) {
  const causality =
    cleanCell(
      row.Causality
    ).toUpperCase();

  if (
    causality.indexOf("NP1") === 0
  ) {
    return "NP1";
  }

  if (
    causality.indexOf("NP2") === 0
  ) {
    return "NP2";
  }

  return "";
}

// ============================================================
// COUNTERBALANCING AND RANDOMIZATION
// ============================================================

function hashStringToUint32(value) {
  const text =
    String(value || "");

  let hash =
    2166136261;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    hash ^=
      text.charCodeAt(i);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let state =
    seed >>> 0;

  return function () {
    state +=
      0x6d2b79f5;

    let value =
      Math.imul(
        state ^
          (state >>> 15),
        1 | state
      );

    value ^=
      value +
      Math.imul(
        value ^
          (value >>> 7),
        61 | value
      );

    return (
      (
        (
          value ^
          (value >>> 14)
        ) >>> 0
      ) /
      4294967296
    );
  };
}

function fisherYatesSeeded(
  array,
  randomFunction
) {
  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        randomFunction() *
          (i + 1)
      );

    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];
  }

  return array;
}

function causalityRank(row) {
  const causality =
    cleanCell(
      row.Causality
    ).toUpperCase();

  if (
    causality.indexOf("NP1") === 0
  ) {
    return 0;
  }

  if (
    causality.indexOf("NP2") === 0
  ) {
    return 1;
  }

  return 2;
}

function genderRank(row) {
  const version =
    cleanCell(
      row.generated_version
    ).toLowerCase();

  if (
    version === "both_male"
  ) {
    return 0;
  }

  if (
    version === "both_female"
  ) {
    return 1;
  }

  return 2;
}

/*
 * Each list_item should contain exactly:
 *
 * NP1-Causality + both_male
 * NP1-Causality + both_female
 * NP2-Causality + both_male
 * NP2-Causality + both_female
 */
function validateSameGenderVariants(
  listItem,
  rows
) {
  const expected = [
    "NP1-Causality|both_male",
    "NP1-Causality|both_female",
    "NP2-Causality|both_male",
    "NP2-Causality|both_female"
  ];

  const found =
    rows.map(function (row) {
      return (
        cleanCell(
          row.Causality
        ) +
        "|" +
        cleanCell(
          row.generated_version
        ).toLowerCase()
      );
    });

  const missing =
    expected.filter(
      function (condition) {
        return (
          !found.includes(
            condition
          )
        );
      }
    );

  const duplicates =
    found.filter(
      function (
        condition,
        index,
        array
      ) {
        return (
          array.indexOf(
            condition
          ) !== index
        );
      }
    );

  if (
    rows.length !== 4 ||
    missing.length > 0 ||
    duplicates.length > 0
  ) {
    throw new Error(
      "Invalid same-gender variants for list_item=" +
      listItem +
      ". Found: [" +
      found.join(", ") +
      "]. Missing: [" +
      missing.join(", ") +
      "]."
    );
  }
}

// ============================================================
// RESPONSE-TIME STATE
// ============================================================

function initializeTrialState(
  stateKey
) {
  window.__normingState[
    stateKey
  ] = {
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

function markTrialOnset(
  stateKey
) {
  const state =
    window.__normingState[
      stateKey
    ];

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
    window.__normingState[
      stateKey
    ];

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

function finalizeTrialState(
  stateKey
) {
  const state =
    window.__normingState[
      stateKey
    ];

  if (
    !state.response_code
  ) {
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
    window.__normingState[
      stateKey
    ] || {};

  return state[field] == null
    ? ""
    : state[field];
}

// ============================================================
// REUSABLE NORMING TRIAL
// ============================================================

function createNormingChoiceTrial(
  trialLabel,
  config
) {
  const uid =
    sanitizeId(
      config.uid
    );

  const stateKey =
    String(
      config.stateKey
    );

  const leftButtonName =
    "left_" + uid;

  const rightButtonName =
    "right_" + uid;

  const timerName =
    "response_window_" +
    uid;

  const leftText =
    config.leftText;

  const rightText =
    config.rightText;

  const leftCode =
    config.leftCode;

  const rightCode =
    config.rightCode;

  const commands = [
    newFunction(
      "initialize_state_" + uid,
      function () {
        initializeTrialState(
          stateKey
        );

        if (
          config.isCritical &&
          window.__normingStart === null
        ) {
          window.__normingStart =
            Date.now();
        }
      }
    ).call(),

    newText(
      "sentence_" + uid,
      (
        '<div class="norming-sentence">' +
        escapeHTML(
          config.sentence
        ) +
        "</div>"
      )
    ).print(),

    newText(
      "question_" + uid,
      (
        '<div class="norming-question">' +
        escapeHTML(
          config.question
        ) +
        "</div>"
      )
    ).print(),

    newTimer(
      timerName,
      RESPONSE_TIMEOUT_MS
    ),

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
        border:
          "2px solid #777",
        "border-radius":
          "9px",
        background:
          "#ffffff"
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

        getButton(
          leftButtonName
        ).disable(),

        getButton(
          rightButtonName
        ).disable(),

        getTimer(
          timerName
        ).stop()
      ),

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
        border:
          "2px solid #777",
        "border-radius":
          "9px",
        background:
          "#ffffff"
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

        getButton(
          leftButtonName
        ).disable(),

        getButton(
          rightButtonName
        ).disable(),

        getTimer(
          timerName
        ).stop()
      ),

    newCanvas(
      "answers_" + uid,
      1000,
      115
    )
      .add(
        85,
        15,
        getButton(
          leftButtonName
        )
      )
      .add(
        535,
        15,
        getButton(
          rightButtonName
        )
      )
      .center()
      .print(),

    newText(
      "hint_" + uid,
      (
        '<div class="norming-hint">' +
        "Bitte wählen Sie die spontan " +
        "natürlichere Interpretation." +
        "</div>"
      )
    ).print(),

    /*
     * The RT clock starts after the sentence,
     * question and buttons have been displayed.
     */
    newFunction(
      "mark_onset_" + uid,
      function () {
        markTrialOnset(
          stateKey
        );
      }
    ).call(),

    /*
     * This timer stops either when:
     *
     * 1. the participant selects a button; or
     * 2. 30 seconds have elapsed.
     */
    getTimer(
      timerName
    )
      .start()
      .wait(),

    newFunction(
      "finalize_state_" + uid,
      function () {
        finalizeTrialState(
          stateKey
        );
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

  const trial =
    trialLabel
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
      config.isPractice
        ? 1
        : 0
    )
    .log(
      "trial_position",
      config.trialPosition ||
        ""
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
      config.originalRowIndex ||
        ""
    )
    .log(
      "generated_version",
      config.generatedVersion ||
        ""
    )
    .log(
      "gender_condition",
      config.genderCondition ||
        ""
    )
    .log(
      "causality",
      config.causality || ""
    )
    .log(
      "design_referent",
      config.designReferent ||
        ""
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
      "raw_np1_source",
      config.rawNP1Source ||
        ""
    )
    .log(
      "raw_np2_source",
      config.rawNP2Source ||
        ""
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
      config.swapSides
        ? 1
        : 0
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
      "Sie müssen zustimmen, " +
      "bevor Sie fortfahren können."
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
      "background-color":
        "#a51e37",
      color: "white",
      border: "none",
      "border-radius":
        "4px"
    })
    .center()
    .print()
    .wait(
      getHtml(
        "consent_form"
      )
        .test.complete()
        .failure(
          getHtml(
            "consent_form"
          ).warn()
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
      margin:
        "0 auto 18px auto"
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
    "In dieser Studie sehen Sie " +
      "jeweils einen vollständigen " +
      "deutschen Satz."
  ),

  newText(
    "inst_2",
    "Unter dem Satz steht eine Frage " +
      "dazu, auf welche der beiden " +
      "genannten Personen oder " +
      "Lebewesen sich die Beschreibung " +
      "im weil-Satz Ihrer Meinung nach " +
      "bezieht."
  ),

  newText(
    "inst_3",
    "Klicken Sie auf die Antwort, " +
      "die Ihrer spontanen Interpretation " +
      "am ehesten entspricht."
  ),

  newText(
    "inst_4",
    "Es gibt keine Rückmeldung zu " +
      "richtig oder falsch. Uns interessiert " +
      "Ihre persönliche sprachliche " +
      "Einschätzung."
  ),

  newText(
    "inst_5",
    "Lesen Sie aufmerksam, aber überlegen " +
      "Sie nicht unnötig lange. Für jede " +
      "Antwort stehen höchstens 30 Sekunden " +
      "zur Verfügung."
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
// PRACTICE
// ============================================================

createNormingChoiceTrial(
  "practice",
  {
    uid:
      "practice_1",

    stateKey:
      "practice_1",

    sentence:
      "Die Fotografin traf " +
      "die Redakteurin, weil sie " +
      "am Nachmittag sehr beschäftigt war.",

    question:
      "Wer war am Nachmittag " +
      "sehr beschäftigt?",

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
// MAIN-SECTION INTRODUCTION
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
    "Im Hauptteil funktioniert jede " +
      "Aufgabe genauso. Bitte wählen Sie " +
      "jeweils die Interpretation, die Ihnen " +
      "beim Lesen am natürlichsten erscheint."
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
// LOAD SAME-GENDER CSV ROWS
// ============================================================

const sameGenderItems = {};

Template(
  GetTable(DATA_FILE),

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

    const listItem =
      cleanCell(
        row.list_item
      );

    if (!listItem) {
      throw new Error(
        "A same-gender row has no " +
        "list_item in " +
        DATA_FILE
      );
    }

    if (
      !sameGenderItems[
        listItem
      ]
    ) {
      sameGenderItems[
        listItem
      ] = [];
    }

    sameGenderItems[
      listItem
    ].push(row);

    return {};
  }
);

// ============================================================
// BUILD COUNTERBALANCED TRIALS
// ============================================================

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
        function (a, b) {
          const aNumber =
            Number(a);

          const bNumber =
            Number(b);

          if (
            Number.isFinite(
              aNumber
            ) &&
            Number.isFinite(
              bNumber
            )
          ) {
            return (
              aNumber -
              bNumber
            );
          }

          return String(a)
            .localeCompare(
              String(b)
            );
        }
      );

    if (
      itemKeys.length === 0
    ) {
      throw new Error(
        "No both_male or both_female " +
        "rows were found in " +
        DATA_FILE
      );
    }

    itemKeys.forEach(
      function (itemKey) {
        validateSameGenderVariants(
          itemKey,
          sameGenderItems[
            itemKey
          ]
        );

        sameGenderItems[
          itemKey
        ].sort(
          function (
            firstRow,
            secondRow
          ) {
            const causalityDifference =
              causalityRank(
                firstRow
              ) -
              causalityRank(
                secondRow
              );

            if (
              causalityDifference !==
              0
            ) {
              return (
                causalityDifference
              );
            }

            const genderDifference =
              genderRank(
                firstRow
              ) -
              genderRank(
                secondRow
              );

            if (
              genderDifference !==
              0
            ) {
              return (
                genderDifference
              );
            }

            return (
              Number(
                firstRow
                  .original_row_index ||
                  0
              ) -
              Number(
                secondRow
                  .original_row_index ||
                  0
              )
            );
          }
        );
      }
    );

    const globalSeed =
      hashStringToUint32(
        window.PROLIFIC_ID
      );

    const randomFunction =
      mulberry32(
        globalSeed
      );

    /*
     * Four expected conditions:
     *
     * 0 NP1 male
     * 1 NP1 female
     * 2 NP2 male
     * 3 NP2 female
     */
    const listId =
      globalSeed % 4;

    const selectedRows = [];

    itemKeys.forEach(
      function (
        itemKey,
        itemIndex
      ) {
        const variants =
          sameGenderItems[
            itemKey
          ];

        const targetIndex =
          (
            itemIndex +
            listId
          ) % 4;

        selectedRows.push({
          itemKey:
            itemKey,

          row:
            variants[
              targetIndex
            ],

          targetIndex:
            targetIndex,

          nVariants:
            variants.length
        });
      }
    );

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

        const materials =
          getNormingMaterials(
            row
          );

        const swapSides =
          randomFunction() <
          0.5;

        const leftText =
          swapSides
            ? materials.np2Text
            : materials.np1Text;

        const rightText =
          swapSides
            ? materials.np1Text
            : materials.np2Text;

        const leftCode =
          swapSides
            ? "NP2"
            : "NP1";

        const rightCode =
          swapSides
            ? "NP1"
            : "NP2";

        const stateKey = [
          "norming",
          entry.itemKey,
          cleanCell(
            row.original_row_index
          ),
          materials.generatedVersion,
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
                materials.sentence,

              question:
                materials.question,

              np1Text:
                materials.np1Text,

              np2Text:
                materials.np2Text,

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
                materials
                  .generatedVersion,

              genderCondition:
                materials
                  .genderCondition,

              causality:
                cleanCell(
                  row.Causality
                ),

              designReferent:
                getDesignReferent(
                  row
                ),

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
                ),

              rawNP1Source:
                materials
                  .rawNP1Source,

              rawNP2Source:
                materials
                  .rawNP2Source
            }
          );

        selectedTrials.push([
          "norming",
          "PennController",
          trialObject
        ]);
      }
    );

    window.items =
      (
        window.items ||
        []
      ).concat(
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
        window.__normingStart !==
        null
      ) {
        window.__normingDuration =
          window.__normingEnd -
          window.__normingStart;
      }
    }
  ).call()
)
  .log(
    "norming_start_ms",
    function () {
      return (
        window.__normingStart ==
        null
          ? ""
          : window.__normingStart
      );
    }
  )
  .log(
    "norming_end_ms",
    function () {
      return (
        window.__normingEnd ==
        null
          ? ""
          : window.__normingEnd
      );
    }
  )
  .log(
    "norming_duration_ms",
    function () {
      return (
        window.__normingDuration ==
        null
          ? ""
          : window.__normingDuration
      );
    }
  )
  .log(
    "norming_duration_sec",
    function () {
      return (
        window.__normingDuration ==
        null
          ? ""
          : (
              window.__normingDuration /
              1000
            ).toFixed(3)
      );
    }
  );

// ============================================================
// CONCLUSION
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
    "Vielen Dank! Bitte füllen Sie " +
      "nun noch die kurzen " +
      "Abschlussformulare aus."
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
      "Sie müssen alle Fragen " +
      "beantworten, bevor Sie " +
      "fortfahren können."
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
      getHtml(
        "exit_form"
      )
        .test.complete()
        .failure(
          getHtml(
            "exit_form"
          ).warn()
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
      "Sie müssen alle Fragen " +
      "beantworten, bevor Sie " +
      "fortfahren können."
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
      getHtml(
        "demo_form"
      )
        .test.complete()
        .failure(
          getHtml(
            "demo_form"
          ).warn()
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
        window.__expEnd -
        window.__expStart;
    }
  ).call()
)
  .log(
    "exp_start_ms",
    function () {
      return (
        window.__expStart
      );
    }
  )
  .log(
    "exp_end_ms",
    function () {
      return (
        window.__expEnd
      );
    }
  )
  .log(
    "exp_duration_ms",
    function () {
      return (
        window.__expDuration
      );
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
      "Klicken Sie hier für die " +
      "Bestätigung auf Prolific" +
      "</a>" +
      "<p>Dieser Schritt ist notwendig, " +
      "damit Ihre Teilnahme bestätigt wird.</p>"
    )
  )
    .center()
    .print(),

  newButton(
    "void"
  ).wait()
);