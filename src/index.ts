import { getHighlighter, type BundledLanguage, type BundledTheme } from "shiki";
import { hookBracket } from "./bracket.js";
import { hookScroll } from "./scroll.js";
import { hookIndent, hookOutdent } from "./tab.js";

interface EditorOptions {
	value?: string;
	language: BundledLanguage;
	/**
	 * Control the rendering of line numbers.
	 * Defaults to `on`.
	 */
	lineNumbers?: "on" | "off";
	/**
	 * Should the editor be read only. See also `domReadOnly`.
	 * Defaults to false.
	 */
	readOnly?: boolean;

	theme?: BundledTheme;
	/**
	 * The number of spaces a tab is equal to.
	 * This setting is overridden based on the file contents when `detectIndentation` is on.
	 * Defaults to 4.
	 */
	tabSize?: number;
	/**
	 * Insert spaces when pressing `Tab`.
	 * This setting is overridden based on the file contents when `detectIndentation` is on.
	 * Defaults to true.
	 */
	insertSpaces?: boolean;
}

const defaultOptions: EditorOptions = {
	value: "",
	language: "c",
	lineNumbers: "on",
	readOnly: false,
	theme: "github-light",
	tabSize: 4,
	insertSpaces: true,
};

interface ICodeEditor {
	updateOptions(options: EditorOptions): void;
	/**
	 * Dispose the editor.
	 */
	dispose(): void;
}

export function create(domElement: HTMLElement, options?: EditorOptions): ICodeEditor {
	const doc = domElement.ownerDocument;

	const output = doc.createElement("div");
	const input = doc.createElement("textarea");

	output.classList.add("shiki-editor", "output");
	input.classList.add("shiki-editor", "input");

	input.setAttribute("autocapitalize", "off");
	input.setAttribute("autocomplete", "off");
	input.setAttribute("autocorrect", "off");
	input.setAttribute("spellcheck", "false");

	if (options?.lineNumbers !== "off") {
		output.classList.add("line-numbers");
		input.classList.add("line-numbers");
	}

	domElement.appendChild(input);
	domElement.appendChild(output);

	const theme_name = options?.theme ?? "github-light";

	const highlighter = getHighlighter({
		themes: [theme_name],
		langs: ["javascript"],
	});

	const render = async () => {
		const { codeToHtml, getTheme } = await highlighter;

		const theme = getTheme(theme_name);
		domElement.style.backgroundColor = theme.bg;
		domElement.style.color = theme.fg;
		domElement.style.setProperty("--fg", theme.fg);
		domElement.style.setProperty("--bg", theme.bg);

		output.innerHTML = codeToHtml(input.value, {
			lang: "javascript",
			theme,
		});
	};

	input.addEventListener("input", render);

	if (options?.value) {
		input.value = options.value;
	}
	render();

	const cleanup = [
		() => {
			input.removeEventListener("input", render);
		},
		hookIndent(input, options?.tabSize ?? 4, options?.insertSpaces ?? true),
		hookOutdent(input, options?.tabSize ?? 4, options?.insertSpaces ?? true),
		hookBracket(input),
		hookScroll(input, output),
		() => {
			domElement.removeChild(input);
			domElement.removeChild(output);
		},
	];

	return {
		updateOptions: (newOptions: EditorOptions) => {
			console.log("updateOptions", newOptions);
		},
		dispose() {
			cleanup.forEach((fn) => fn());
		},
	};
}
