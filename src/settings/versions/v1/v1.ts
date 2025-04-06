import block_qoute_example
    from "./few_shot_examples/block_qoute_example";
import codeblock_function_completion
    from "./few_shot_examples/codeblock_function_completion";
import codeblock_function_parameters
    from "./few_shot_examples/codeblock_function_parameters";
import header_example from "./few_shot_examples/header_example";
import numbered_list_example
    from "./few_shot_examples/numbered_list_example";
import sub_task_list_example
    from "./few_shot_examples/sub_task_list_example";
import task_list_example from "./few_shot_examples/task_list_example";
import text_completion_end
    from "./few_shot_examples/text_completion_end";
import text_completion_middle
    from "./few_shot_examples/text_completion_middle";
import unordered_list_pro_and_con_list
    from "./few_shot_examples/unordered_list_pro_and_con_list";
import unordered_list_solid
    from "./few_shot_examples/unordered_list_solid";
import math_block_inline from "./few_shot_examples/math_block_inline";
import math_block_multi_line
    from "./few_shot_examples/math_block_multi_line";
import header_example_relu
    from "./few_shot_examples/header_example_relu";
import {
    MAX_DELAY,
    MAX_MAX_CHAR_LIMIT,
    MIN_DELAY,
    MIN_MAX_CHAR_LIMIT,
    ollamaApiSettingsSchema,
} from "../shared";
import {z} from "zod";
import {geminiApiSettingsSchema, azureOAIApiSettingsSchema, fewShotExampleSchema, modelOptionsSchema, openAIApiSettingsSchema} from "../shared";
import {isRegexValid, isValidIgnorePattern} from "../../utils";

export const triggerSchema = z.object({
    type: z.enum(['string', 'regex']),
    value: z.string().min(1, {message: "Trigger value must be at least 1 character long"})
}).strict().superRefine((trigger, ctx) => {
    if (trigger.type === "regex") {
        if (!trigger.value.endsWith("$")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Regex triggers must end with a $.",
                path: ["value"],
            });
        }
        if (!isRegexValid(trigger.value)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Invalid regex: "${trigger.value}"`,
                path: ["value"],
            });
        }
    }
});


export const settingsSchema = z.object({
    version: z.literal("1"),
    enabled: z.boolean(),
    advancedMode: z.boolean(),
    apiProvider: z.enum(['azure', 'openai', "ollama", "gemini"]),
    azureOAIApiSettings: azureOAIApiSettingsSchema,
    geminiApiSettings: geminiApiSettingsSchema,
    openAIApiSettings: openAIApiSettingsSchema,
    ollamaApiSettings: ollamaApiSettingsSchema,
    triggers: z.array(triggerSchema),
    delay: z.number().int().min(MIN_DELAY, {message: "Delay must be between 0ms and 2000ms"}).max(MAX_DELAY, {message: "Delay must be between 0ms and 2000ms"}),
    modelOptions: modelOptionsSchema,
    systemMessage: z.string().min(3, {message: "System message must be at least 3 characters long"}),
    fewShotExamples: z.array(fewShotExampleSchema),
    userMessageTemplate: z.string().min(3, {message: "User message template must be at least 3 characters long"}),
    chainOfThoughRemovalRegex: z.string().refine((regex) => isRegexValid(regex), {message: "Invalid regex"}),
    dontIncludeDataviews: z.boolean(),
    maxPrefixCharLimit: z.number().int().min(MIN_MAX_CHAR_LIMIT, {message: `Max prefix char limit must be at least ${MIN_MAX_CHAR_LIMIT}`}).max(MAX_MAX_CHAR_LIMIT, {message: `Max prefix char limit must be at most ${MAX_MAX_CHAR_LIMIT}`}),
    maxSuffixCharLimit: z.number().int().min(MIN_MAX_CHAR_LIMIT, {message: `Max prefix char limit must be at least ${MIN_MAX_CHAR_LIMIT}`}).max(MAX_MAX_CHAR_LIMIT, {message: `Max prefix char limit must be at most ${MAX_MAX_CHAR_LIMIT}`}),
    removeDuplicateMathBlockIndicator: z.boolean(),
    removeDuplicateCodeBlockIndicator: z.boolean(),
    ignoredFilePatterns: z.string().refine((value) => value
        .split("\n")
        .filter(s => s.trim().length > 0)
        .filter(s => !isValidIgnorePattern(s)).length === 0,
        {message: "Invalid ignore pattern"}
    ),
    ignoredTags: z.string().refine((value) => value
        .split("\n")
        .filter(s => s.includes(" ")).length === 0, {message: "Tags cannot contain spaces"}
    ).refine((value) => value
        .split("\n")
        .filter(s => s.includes("#")).length === 0, {message: "Enter tags without the # symbol"}
    ).refine((value) => value
        .split("\n")
        .filter(s => s.includes(",")).length === 0, {message: "Enter each tag on a new line without commas"}
    ),
    cacheSuggestions: z.boolean(),
    debugMode: z.boolean(),
}).strict();

export const pluginDataSchema = z.object({
    settings: settingsSchema,
}).strict();


export const DEFAULT_SETTINGS: Settings = {
    version: "1",

    // General settings
    enabled: true,
    advancedMode: false,
    apiProvider: "openai",
    // API settings
    azureOAIApiSettings: {
        key: "",
        url: "https://YOUR_AOI_SERVICE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions",
    },
    geminiApiSettings: {
        key: "",
        url: "https://generativelanguage.googleapis.com/v1beta/models",
        model: 'gemini-1.5-flash'
    },
    openAIApiSettings: {
        key: "",
        url: "https://api.openai.com/v1/chat/completions",
        model: "gpt-3.5-turbo",
    },
    ollamaApiSettings: {
        url: "http://localhost:11434/api/chat",
        model: "",
    },

    // Trigger settings
    triggers: [
        {type: "string", value: "# "},
        {type: "string", value: ". "},
        {type: "string", value: ": "},
        {type: "string", value: ", "},
        {type: "string", value: "! "},
        {type: "string", value: "? "},
        {type: "string", value: "`"},
        {type: "string", value: "' "},
        {type: "string", value: "= "},
        {type: "string", value: "$ "},
        {type: "string", value: "> "},
        {type: "string", value: "\n"},

        // bullet list
        {type: "regex", value: "[\\t ]*(\\-|\\*)[\\t ]+$"},
        // numbered list
        {type: "regex", value: "[\\t ]*[0-9A-Za-z]+\\.[\\t ]+$"},
        // new line with spaces
        {type: "regex", value: "\\$\\$\\n[\\t ]*$"},
        // markdown multiline code block
        {type: "regex", value: "```[a-zA-Z0-9]*(\\n\\s*)?$"},
        // task list normal, sub or numbered.
        {type: "regex", value: "\\s*(-|[0-9]+\\.) \\[.\\]\\s+$"},
    ],

    delay: 500,
    // Request settings
    modelOptions: {
        temperature: 1,
        top_p: 0.1,
        frequency_penalty: 0.25,
        presence_penalty: 0,
        max_tokens: 800,
    },
    // Prompt settings
    systemMessage: `Your job is to predict the most logical text that should be written at the location of the <mask/>.
Your answer can be either code, a single word, or multiple sentences.
If the <mask/> is in the middle of a partial sentence, your answer should only be the 1 or 2 words fixes the sentence and not the entire sentence.
You are not allowed to have any overlapping text directly surrounding the <mask/>.  
Your answer must be in the same language as the text directly surrounding the <mask/>.
Your response must have the following format:
THOUGHT: here, you reason about the answer; use the 80/20 principle to be brief.
LANGUAGE: here, you write the language of your answer, e.g. English, Python, Dutch, etc.
ANSWER: here, you write the text that should be at the location of <mask/>
`,
    fewShotExamples: [
        block_qoute_example,
        codeblock_function_completion,
        codeblock_function_parameters,
        header_example,
        numbered_list_example,
        sub_task_list_example,
        task_list_example,
        text_completion_end,
        text_completion_middle,
        unordered_list_pro_and_con_list,
        unordered_list_solid,
        math_block_inline,
        math_block_multi_line,
        header_example_relu,
    ].sort((a, b) => a.toString().localeCompare(b.toString())),
    userMessageTemplate: "{{prefix}}<mask/>{{suffix}}",
    chainOfThoughRemovalRegex: `(.|\\n)*ANSWER:`,
    // Preprocessing settings
    dontIncludeDataviews: true,
    maxPrefixCharLimit: 4000,
    maxSuffixCharLimit: 4000,
    // Postprocessing settings
    removeDuplicateMathBlockIndicator: true,
    removeDuplicateCodeBlockIndicator: true,
    ignoredFilePatterns: "**/secret/**\n",
    ignoredTags: "",
    cacheSuggestions: true,
    debugMode: false,
};

export type Settings = z.input<typeof settingsSchema>;
export type Trigger = z.infer<typeof triggerSchema>;
export type PluginData = z.infer<typeof pluginDataSchema>;
